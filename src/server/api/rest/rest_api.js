/**
 * REST API
 */
import express from 'express';
import bodyParser from 'body-parser';

import Log from '../../logging';
import orderRoutes from './order_routes';
import positionRoutes from './position_routes';

const port = 5281;

class RestApi {
	constructor(server) {
		const that = this;

		this.running = false;

		this.server = server;

		this.app = express();

		// middleware
		this.app.use(bodyParser.json());

		this.app.use('/', orderRoutes(server));
		this.app.use('/', positionRoutes(server));
	}

	start() {
		if (this.running) {
			throw new Error("JSON-RPC API already running");
		}

		this.app.listen(port, () => Log.api.verbose("REST API listening on port ${port}"));
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

export default RestApi;
