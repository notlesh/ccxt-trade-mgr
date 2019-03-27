/**
 * This is the main CCXT Manager server app. This handles the lifecycle
 * of the server process.
 *
 */
const assert = require('assert');
const jayson = require('jayson');
const sleep = require('sleep');

const Log = require('./logging');
const Database = require('./data/database');
const DataEngine = require('./ccxt_data_engine');
const Config = require('./config');
const OrderManager = require('./order_manager');
const PositionManager = require('./position_manager');

class Server {
	constructor() {
		const that = this;

		this.running = false;

		this.config = new Config();
		this.config.loadConfigFromFile();

		this.database = new Database({});
		this.database.open(); // TODO: this is async...

		this.dataEngine = new DataEngine(
			this.database,
			this.config.getExchangeList(), 
			this.config.getWatchlist());
		this.dataEngine.start();

		this.orderManager = new OrderManager(
			this.database,
			this.dataEngine);
		this.orderManager.start();

		this.positionManager = new PositionManager(
			this.database,
			this.dataEngine);
		this.positionManager.start();


		// define JSON RPC functionality
		this.jsonRpcServer = jayson.server({
			getLatestPriceData: function(args, callback) {
				callback(null, that.dataEngine.getLatestTickerData());
			},

			// position-related API 
			listPositions: async function(args, callback) {
				const positions = await that.positionManager.listOpenManagedPositions();
				callback(null, {code: 200, message: positions});
			},
			getPosition: async function(args, callback) {

				const id = args[0];
				if (! id) {
					callback({code: 400, message: 'id required'});
					return;
				}

				const position = await that.positionManager.getManagedPosition(id);
				callback(null, {code: 200, message: position});
			},
			openPosition: async function(args, callback) {
				const position = args[0];
				const id = await that.positionManager.openManagedPosition(position);
				callback(null, {code: 200, message: ""+ id});
			},

			// order-related API 
			listOrders: async function(args, callback) {
				const orders = await that.orderManager.listOpenManagedOrders();
				callback(null, {code: 200, message: orders});
			},
			getOrder: async function(args, callback) {

				const id = args[0];
				if (! id) {
					callback({code: 400, message: 'id required'});
					return;
				}

				const order = await that.orderManager.getManagedOrder(id);
				callback(null, {code: 200, message: order});
			},
			createOrder: async function(args, callback) {
				const order = args[0];
				const id = await that.orderManager.createManagedOrder(order);
				callback(null, {code: 200, message: ""+ id});
			},




		});
		this.jsonRpcServer.on("request", (request) => {
			Log.api.verbose({ subject: "received request", data: request });
		});
		this.jsonRpcServer.on("response", (request, response) => {
			Log.api.verbose({ subject: "sent response", data: response });
		});
	}

	start() {
		if (this.running) {
			throw new Error("Server already running");
		}

		// TODO: consult config for port (and transport?) to listen on
		this.jsonRpcServer.http().listen(5280);
	}

	stop() {
		throw new Error("Fixme!");
	}

	isRunning() {
		return this.running;
	}
}

module.exports = Server;
