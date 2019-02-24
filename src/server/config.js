/**
 * This file contains the CCXT data engine. This functionality will 
 *
 */
const config = require('config');

class Config {

	constructor() {
		this.initialized = false;

		// config objects
		this.server = null;
		this.watchlist = null;
		this.exchanges = null;
	}

	async loadConfigFromFile() {
		if (this.initialized) {
			throw new Error("Config already initialized");
		}

		// mix a default server config object with user specified values
		this.server = {
			listenPort: 5280
		};
		if (config.has("server")) {
			// TODO: validate
			this.server = { ...this.server, ...config.get("server") };
		}

		if (config.has("exchanges")) {
			// TODO: validate
			this.exchanges = config.get("exchanges");
		} // TODO: provide sensible defaults?

		if (config.has("watchlist")) {
			// TODO: validate
			this.watchlist = config.get("watchlist");
		} // TODO: provide sensible defaults?

		this.initialized = true;

		/*
		 * Only uncomment temporarily as needed -- config can have sensitive information
		 *
		console.log("Config: ");
		console.log("  server: ", this.server);
		// console.log("  exchanges", this.exchanges); // don't print - this contains api keys
		console.log("  watchlist", this.watchlist);
		*/
	}

	getWatchlist() {
		if (! this.initialized) {
			throw new Error("Must load config first");
		}
		return this.watchlist;
	}

	getExchangeList() {
		if (! this.initialized) {
			throw new Error("Must load config first");
		}
		return this.exchanges;
	}

	getServerConfig() {
		if (! this.initialized) {
			throw new Error("Must load config first");
		}
		return this.server;
	}

}

module.exports = Config;
