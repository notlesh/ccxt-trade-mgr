/**
 * This file contains the PositionManager. The PositionManager opens
 * orders to enter and exit a position, in the latter case by monitoring
 * price action and opening/closing mutually exclusive orders (e.g.
 * take profit vs. stop loss).
 */
const ccxt = require('ccxt');
const assert = require('assert');
const sleep = require('sleep');

const Constants = require('./data/constants');

class PositionManager {

	constructor(database, ccxtManager) {
		this.database = database;
		this.ccxtManager = ccxtManager;

		this.positionPollingIntervalMS = 10000;

		this.running = false;
		this.timerId = null;
	}

	/**
	 * Start the PositionManager.
	 */
	start() {
		assert.ok(!this.running, "Can't call PositionManager.start() when already running");

		const that = this;

		Log.positions.info("PositionManager.start()...");

		this.running = true;


		this.timerId = setInterval(async function() {
			Log.positions.debug("PositionManager polling...");

			// TODO: ...

		}, this.positionPollingIntervalMS);
	}

	/**
	 * Position-related operations
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

	/**
	 * Position-related operations
	 */
	async openManagedPosition(position) {

		if (! this.ccxtManager.exchanges[position.exchange]) {
			throw new Error("Error opening position: current config does not support exchange "
					+ order.exchange);
		}

		const managedPosition = {
			originalPosition: position,
			createdTimestamp: new Date(),
			status: Constants.PositionStatusEnum.UNINITIALIZED,
			entryOrders: [],
			targetOrders: [],
			stoplossOrders: [],
		};

		return await this.database.insertManagedPosition(managedPosition);
	}
	async listOpenManagedPositions() {
		// TODO: set up proper query to select only open positions
		return await this.database.listManagedPositions();
	}
	async getManagedPosition(id) {
		return await this.database.getManagedPosition(id);
	}
}

module.exports = PositionManager;
