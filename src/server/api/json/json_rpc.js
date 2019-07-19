/**
 * JSON-RPC server and handlers.
 */
const jayson = require('jayson');
const cors = require('cors');
const connect = require('connect');
const jsonParser = require('body-parser').json;

const Log = require('../../logging');

class JsonRpcApi {
	constructor(server) {
		const that = this;

		this.running = false;

		this.server = server;

		this.jayson = jayson.server({
			getLatestPriceData: function(args, callback) {
				callback(null, that.dataEngine.getLatestTickerData());
			},

			// position-related API 
			listPositions: async function(args, callback) {
				const positions = await that.server.positionManager.listOpenManagedPositions();
				callback(null, {code: 200, message: positions});
			},
			getPosition: async function(args, callback) {

				const id = args[0];
				if (! id) {
					callback({code: 400, message: 'id required'});
					return;
				}

				const position = await that.server.positionManager.getManagedPosition(id);
				callback(null, {code: 200, message: position});
			},
			openPosition: async function(args, callback) {
				const position = args[0];
				const id = await that.server.positionManager.openManagedPosition(position);
				callback(null, {code: 200, message: ""+ id});
			},

			// order-related API 
			listOrders: async function(args, callback) {
				const orders = await that.server.orderManager.listOpenManagedOrders();
				callback(null, {code: 200, message: orders});
			},
			getOrder: async function(args, callback) {

				const id = args[0];
				if (! id) {
					callback({code: 400, message: 'id required'});
					return;
				}

				const order = await that.server.orderManager.getManagedOrder(id);
				callback(null, {code: 200, message: order});
			},
			createOrder: async function(args, callback) {
				const order = args[0];
				const id = await that.server.orderManager.createManagedOrder(order);
				callback(null, {code: 200, message: ""+ id});
			},

			status: async function(args, callback) {
				callback(null, {code: 200, message: "Running"});
			},
		});

		this.app = connect();
		this.app.use(cors({methods: ['POST']}));
		this.app.use(jsonParser());
		this.app.use(this.jayson.middleware());

		this.jayson.on("request", (request) => {
			Log.api.verbose({ subject: "received request", data: request });
		});
		this.jayson.on("response", (request, response) => {
			Log.api.verbose({ subject: "sent response", data: response });
		});
	}

	start() {
		if (this.running) {
			throw new Error("JSON-RPC API already running");
		}

		// TODO: consult config for port (and transport?) to listen on
		// this.jayson.http().listen(5280);
		this.app.listen(5280);
		this.running = true;
	}

	stop() {
		if (! this.running) {
			throw new Error("JSON-RPC API isn't running");
		}

		this.app.close();
		this.running = false;
	}
}

module.exports = JsonRpcApi;
