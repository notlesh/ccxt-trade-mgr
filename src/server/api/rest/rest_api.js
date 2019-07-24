/**
 * REST API
 */
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import Log from '../../logging';
import orderRoutes from './order_routes';
import positionRoutes from './position_routes';
import userRoutes from './user_routes';

const port = 5281;

class RestApi {
	constructor(server) {
		const that = this;

		this.running = false;

		this.server = server;

		this.app = express();

		// middleware
		this.app.use(cors());
		this.app.use(bodyParser.json());

		this.app.use('/', orderRoutes(server));
		this.app.use('/', positionRoutes(server));
		this.app.use('/', userRoutes(server));
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
