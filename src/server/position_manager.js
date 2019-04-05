/**
 * This file contains the PositionManager. The PositionManager opens
 * orders to enter and exit a position, in the latter case by monitoring
 * price action and opening/closing mutually exclusive orders (e.g.
 * take profit vs. stop loss).
 */
const assert = require('assert');

const Log = require('./logging');

const Constants = require('./data/constants');

class PositionManager {

	constructor(database, ccxtManager, orderManager) {
		this.database = database;
		this.ccxtManager = ccxtManager;
		this.orderManager = orderManager;

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

			const openPositions = await that.database.listManagedPositions(
					{closed: {$eq: false}});

			for (const position of openPositions) {
				Log.positions.debug("Processing position "+ position._id);
				switch (position.status) {
					case Constants.PositionStatusEnum.UNINITIALIZED:
						await that.handleNewPosition(position);
						break;
				}
			}

		}, this.positionPollingIntervalMS);
	}

	/**
	 * Internal position processing operations
	 */
	async handleNewPosition(position) {
		try {

			// TODO: create orders for all entry points
			const entry = position.originalPosition.entries[0];

			const orderSpec = {
				exchange: position.originalPosition.exchange,
				pair: position.originalPosition.pair,
				direction: position.originalPosition.direction,
				leverage: position.originalPosition.leverage,
				price: entry.target,
				amount: entry.amount,
				type: "limit",
			};

			const orderId = await this.orderManager.createManagedOrder(orderSpec);

			// update position status
			await this.database.updateManagedPosition(
				position._id,
				{
					entryOrders: [ orderId ],
					status: Constants.PositionStatusEnum.ENTRIES_PLACED,
				});

		} catch(e) {
			Log.positions.error("Caught exception while trying to handle new position "+
					position._id +": ", e);
			// TODO: here we may have created some but not all positions.
			//       how should we clean up? should we retry?
		}
	}

	/**
	 * Position-related operations
	 */
	async openManagedPosition(position) {

		if (! this.ccxtManager.exchanges[position.exchange]) {
			throw new Error("Error opening position: current config does not support exchange "
					+ position.exchange);
		}

		const managedPosition = {
			originalPosition: position,
			createdTimestamp: new Date(),
			status: Constants.PositionStatusEnum.UNINITIALIZED,
			closed: false,
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
