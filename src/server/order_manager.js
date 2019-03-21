/**
 * This file contains the OrderManager. This manager will continually
 * evaluate orders that are not closed to update their status and 
 * make any necessary API calls to the exchange.
 */
const ccxt = require('ccxt');
const assert = require('assert');
const sleep = require('sleep');

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

		console.log("OrderManager.start()...");

		this.running = true;


		this.timerId = setInterval(async function() {
			console.log("Order manager polling...");

			const orders = await that.database.listOrders();

			// handle any new orders
			for (const order of orders) {
				try {
					console.log("Processing order: ", order);

					const orderId = order._id;
					delete order._id; // remove mongo's id

					// get exchange object / validate that exchange was in config
					const exchange = that.ccxtManager.exchanges[order.exchange];
					if (! exchange) {
						// TODO: this validation should occur before order ever makes it into database
						// TODO: remove, or this will happen every loop (or refactor)
						throw new Error("Exchange "+ order.exchange +" not configured");
					}

					// TODO: should refactor so that managedOrder (and managedPosition) are created immediately, no need for
					// separate databases and this extra step of conversion from foo to managedFoo
					let managedOrder = {
						originalOrder: order, // TODO: prune any database info (e.g. id)?
						createdTimestamp: new Date(), // TODO: should really be timestamped when server first receives...
						status: "UNINITIALIZED", // TODO: define, use an enum (e.g. Object.freeze({ /* enum values */ }))
						externalId: "",
						fillAmount: 0.0,
					};

					const managedOrderId = await that.database.insertManagedOrder(managedOrder);
					console.log("managedOrder created: ", managedOrderId);
					await that.database.deleteOrder(orderId);

					let externalOrder = null;
					switch (order.type) {
						case "limit":
							externalOrder = await exchange.createLimitBuyOrder(
								order.pair,
								order.amount,
								order.price);
							break;
						case "market":
							externalOrder = await exchange.createMarketBuyOrder(
								order.pair,
								order.amount);
							break;
					}

					console.log("*** Order sent to exchange, id: ", externalOrder.id);
					managedOrder.externalId = externalOrder.id;

					await that.database.updateManagedOrder(
						managedOrderId, 
						{
							externalId: externalOrder.id,
							status: "SUBMITTED",
						});

				} catch(e) {
					console.error("Caught exception while trying to process order "+ order._id +": ", e);
					// TODO: attempt to revert any inconsistent state here -- e.g. multi-document transactions in mongo
				}

			}

		}, this.orderPollingIntervalMS);
	}

	/**
	 * Order-related operations
	 */
	async createOrder(order) {
		return await this.database.insertOrder(order);
	}
	async listOpenOrders() {
		// TODO: set up proper query to select only open positions
		return await this.database.listOrders();
	}
	async getOrder(id) {
		return await this.database.getOrder(id);
	}
}

module.exports = OrderManager;
