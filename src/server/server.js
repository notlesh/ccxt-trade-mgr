/**
 * This is the main CCXT Manager server app. This handles the lifecycle
 * of the server process.
 *
 */
const assert = require('assert');
const jayson = require('jayson');

const Log = require('./logging');
const Database = require('./data/database');
const DataEngine = require('./ccxt_data_engine');
const Config = require('./config');
const OrderManager = require('./order_manager');
const PositionManager = require('./position_manager');
import UserManager from './user_manager';
const JsonRpcApi = require('./api/json/json_rpc');
import RestApi from './api/rest/rest_api';

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
			this.dataEngine,
			this.orderManager);
		this.positionManager.start();

		this.userManager = new UserManager(this.database);

		this.jsonRpcServer = new JsonRpcApi(this);
		this.restApi = new RestApi(this);
	}

	start() {
		if (this.running) {
			throw new Error("Server already running");
		}

		this.jsonRpcServer.start();
		this.restApi.start();
		this.running = true;
	}

	stop() {
		if (this.running) {
			throw new Error("Server isn't running");
		}

		this.jsonRpcServer.stop();
		this.restApi.stop();
		this.running = false;
	}

	isRunning() {
		return this.running;
	}
}

module.exports = Server;
