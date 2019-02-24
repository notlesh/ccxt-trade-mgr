/**
 * This is the main CCXT Manager server app. This handles the lifecycle
 * of the server process.
 *
 */
const assert = require('assert');
const jayson = require('jayson');
const sleep = require('sleep');

const Database = require('./database');
const DataEngine = require('./ccxt_data_engine');
const Config = require('./config');

class Server {
	constructor() {
		const that = this;

		this.running = false;

		this.config = new Config();
		this.config.loadConfigFromFile();

		this.database = new Database({});
		this.database.open(); // TODO: this is async...

		this.dataEngine = new DataEngine(this.config.getExchangeList(), this.config.getWatchlist());
		this.dataEngine.start();

		// define JSON RPC functionality
		this.jsonRpcServer = jayson.server({
			getLatestPriceData: function(args, callback) {
				callback(null, that.dataEngine.getLatestTickerData());
			},

			// database queries
			listPositions: function(args, callback) {
				that.database.listPositions().then((results) => {
					callback(null, results);
				});
			},
			getPosition: function(args, callback) {

				if (! args || ! args.id) {
					callback({code: 400, message: 'id required'});
					return;
				}

				that.database.getPosition(args.id).then((results) => {
					callback(null, results);
				});
			},
			openPosition: function(args, callback) {
				// TODO: need to define how this should work -- who validates, etc.
				callback({code: 501, message: 'not implemented yet'});
			}
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
