/**
 * This file contains the OrderManager. This manager will continually
 * evaluate orders that are not closed to update their status and 
 * make any necessary API calls to the exchange.
 */
const ccxt = require('ccxt');
const assert = require('assert');
const sleep = require('sleep');

const Log = require('./logging');

const Constants = require('./data/constants');

class OrderManager {

	constructor(database, ccxtManager) {
		this.database = database;
		this.ccxtManager = ccxtManager;

		this.orderPollingIntervalMS = 10000;

		this.running = false;
		this.timerId = null;
	}

	/**
	 * Start the OrderManager.
	 */
	start() {
		assert.ok(!this.running, "Can't call OrderManager.start() when already running");

		const that = this;

		Log.orders.info("OrderManager.start()...");

		this.running = true;


		this.timerId = setInterval(async function() {
			Log.orders.debug("Order manager polling...");

			const newOrders = await that.database.listManagedOrders(
					{status: {$eq: Constants.OrderStatusEnum.UNINITIALIZED}});

			// handle any new orders
			for (const order of newOrders) {
				try {
					Log.orders.info("Processing new order: ", order);

					// get exchange object / validate that exchange was in config
					const exchange = that.ccxtManager.exchanges[order.originalOrder.exchange];
					if (! exchange) {
						// we check that exchange exists in createManagedOrder(), so if we get here it's
						// probably because exchange was removed from config
						// TODO: remove? flag as bad?
						throw new Error("Uninitialized managedOrder has exchange ("+ order.exchange
								+ ") which isn't in config");
					}

					let externalOrder = null;
					switch (order.originalOrder.type) {
						case "limit":
							externalOrder = await exchange.createLimitBuyOrder(
								order.originalOrder.pair,
								order.originalOrder.amount,
								order.originalOrder.price);
							break;
						case "market":
							externalOrder = await exchange.createMarketBuyOrder(
								order.originalOrder.pair,
								order.originalOrder.amount);
							break;
					}

					Log.orders.info("*** Order sent to exchange, id: ", externalOrder.id);

					await that.database.updateManagedOrder(
						order._id,
						{
							externalId: externalOrder.id,
							status: "SUBMITTED",
						});

				} catch(e) {
					Log.orders.error("Caught exception while trying to process order "+ order._id +": ", e);
					// TODO: attempt to revert any inconsistent state here
					//       e.g. multi-document transactions in mongo
				}

			}

		}, this.orderPollingIntervalMS);
	}

	/**
	 * Order-related operations
	 */
	async createManagedOrder(order) {

		if (! this.ccxtManager.exchanges[order.exchange]) {
			throw new Error("Current config does not support exchange "+ order.exchange);
		}

		const managedOrder = {
			originalOrder: order,
			createdTimestamp: new Date(),
			status: Constants.OrderStatusEnum.UNINITIALIZED,
			closed: false,
			externalId: "",
			filledAmount: 0.0,
		};

		return await this.database.insertManagedOrder(managedOrder);
	}
	async listOpenManagedOrders() {
		// TODO: set up proper query to select only open positions
		return await this.database.listManagedOrders({closed: {$eq: false}});
	}
	async getManagedOrder(id) {
		return await this.database.getManagedOrder(id);
	}
}

module.exports = OrderManager;
