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

			const openOrders = await that.database.listManagedOrders(
					{closed: {$eq: false}});

			// TODO: optimization: https://github.com/ccxt/ccxt/wiki/Manual#querying-orders
			//       the ccxt manual suggests that most exchanges support querying all open
			//       orders at once (fewer support all orders or all closed orders). this
			//       would be an easy way to reduce the number of queries made here.

			// handle any new orders
			for (const order of openOrders) {
				Log.orders.debug("Processing order ${order._id}");
				switch (order.status) {
					case Constants.OrderStatusEnum.UNINITIALIZED:
						// TODO: do we want async here? we probably want some specific number
						//       of outstanding requests...
						await that.handleNewOrder(order); 
						break;
					case Constants.OrderStatusEnum.ORDER_REQUESTED:
						await that.handleQueryOrderStatus(order);
						break;
				}
			}

		}, this.orderPollingIntervalMS);
	}

	/**
	 * Internal order processing operations
	 */
	async handleNewOrder(order) {
		try {
			Log.orders.info("Processing new order: ", order);

			// side effect: ensures that exchange is properly configured
			const exchange = this.requireExchange(order.originalOrder.exchange);

			// TODO: validate trading pair

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

			await this.database.updateManagedOrder(
				order._id,
				{
					externalId: externalOrder.id,
					status: Constants.OrderStatusEnum.ORDER_REQUESTED,
				});

		} catch(e) {
			Log.orders.error("Caught exception while trying to open new order "+ order._id +": ", e);
			// TODO: be very careful here that we don't create multiple orders on the exchange.
			//       at the time of this writing, we could do this if we successfully create an order
			//       but fail to update the database
			// TODO: Other cases we run into here: insufficient funds -- order should be updated accordingly
		}
	}
	async handleQueryOrderStatus(order) {
		try {
			const exchange = this.requireExchange(order.originalOrder.exchange);

			assert.ok(exchange.has['fetchOrder'], "Exchange doesn't support fetching order by id!");

			Log.orders.debug("Querying order status on exchange "+ order.originalOrder.exchange
					+" for order "+ order.externalId);
			const externalOrder = await exchange.fetchOrder(order.externalId);
			Log.orders.debug({message: "Updated order "+ order.externalId, order: externalOrder});

			let orderUpdateObj = {}; // accumulate changed fields here before sending to mongo
			let orderUpdated = false;

			// update filled amount if it differs
			if (externalOrder.filled !== order.filled) {
				Log.orders.verbose({
					message: "Order fill changed",
					orderId: order._id,
					externalOrderId: externalOrder.id,
					before: order.filled,
					after: externalOrder.filled });

				if (externalOrder.filled > 0) {
					// might be the case if their types differed -- TODO: should test this

					// will be overridden if we're also closed
					orderUpdateObj.status = Constants.OrderStatusEnum.ORDER_FILLED;
				}

				orderUpdateObj.filledAmount = externalOrder.filled;
				orderUpdated = true;
			}
			
			// update status if order is now closed
			// TODO: inspect other fields (e.g. make sure this isn't an error case)
			if (externalOrder.status == "closed") {
				Log.orders.info({
					message: "Order closed",
					orderId: order._id,
					externalOrderId: externalOrder.id,
					externalInfo: externalOrder.info});

				orderUpdateObj.status = Constants.OrderStatusEnum.ORDER_FILLED;
				orderUpdateObj.closed = true;

				orderUpdated = true;
			}

			if (orderUpdated) {
				await this.database.updateManagedOrder(order._id, orderUpdateObj);
			}

		} catch(e) {
			Log.orders.error("Caught exception while trying to update order status "+ order._id +": ", e);
			// TODO: this also needs to be handled very carefully. some of the problems we might
			//       encounter here:
			//       1) not creating follow-up orders (e.g. stop loss)
			//       2) creating duplicate orders
			//       3) not acting fast enough, esp. in a volatile market
		}
	}

	/**
	 * Public-facing order-related operations
	 */
	async createManagedOrder(order) {

		// side effect: will ensure that exchange is available in config
		this.requireExchange(order.exchange);

		// TODO: validate other things:
		//       1) exchange should have the given pair
		//       2) should have sufficient funds (use cached balance data?)

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

	/**
	 * Utility functions / helpers
	 */
	requireExchange(exchangeName) {

		// get exchange object / validate that exchange was in config
		const exchange = this.ccxtManager.exchanges[exchangeName];
		if (! exchange) {
			throw new Error("OrderManager unable to get exchange ("+ order.exchange
					+ ") -- probably not in config");
		}
		return exchange;
	}
}

module.exports = OrderManager;
