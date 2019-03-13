/**
 * This file contains the CCXT data engine. This functionality will 
 * periodically query exchange information needed to update trades.
 *
 */
const ccxt = require('ccxt');
const assert = require('assert');
const sleep = require('sleep');

class DataEngine {
	constructor(database, exchangeConfig, watchlist) {
		this.database = database;
		this.config = { exchanges: exchangeConfig, watchlist: watchlist };
		// TODO: validate?

		this.running = false;

		this.exchanges = {};
		this.tickerCache = {};
	}

	/**
	 * Start the data engine. This will set up an asynchonous loop
	 * that will query exchange data and dispatch it to be handled.
	 */
	start() {
		assert.ok(!this.running, "Can't call DataEngine.start() when already running");

		console.log("DataEngine.start()...");

		this.running = true;

		const self = this;
		let id = setTimeout(async function() {
			console.log("Setting up ccxt exchanges");
			for (let exchangeConf of self.config.exchanges) {

				// initialize each exchange we will need to work with
				// we expect the string from the config to match a class in ccxt,
				// for example "binance" would match ccxt.binance
				const classObject = ccxt[exchangeConf.name]
				console.log("Initializing exchange "+ exchangeConf.name);
				if (classObject === 'undefined') {
					throw new Error("Exchange "+ exchangeConf.name +" not recognized / supported");
				}

				// we pass the config object verbatim, which allows our config file to support anything
				// that CCXT supports (e.g. enableRateLimit: true)
				const exchange = new classObject(exchangeConf);
				self.exchanges[exchangeConf.name] = exchange;

				// if config JSON specifies test, update url...
				// TODO: verify this will work with all exchanges
				if (exchangeConf.test) {
					exchange.urls['api'] = exchange.urls['test'];
				}

				// if config specifies apiKey/secret key, print out account balance
				if (exchangeConf.hasOwnProperty("secret")) {
					exchange.fetchBalance().then((balance) => {
						console.log("Account balance for "+ exchangeConf.name +": ", balance);
					});
				}
			}

			// now query exchange for data
			while (true) {
				await self.fetchAllTickerData();
				await self.processOpenPositions();
				await sleep.sleep(10);
			}

			// XXX: should only exit when told to do so
			console.log("Done running");
			self.running = false;
		}, 1000);
	}

	/**
	 * Fetch the latest ticker data from each exchange and update
	 * the cache
	 */
	async fetchAllTickerData() {
		console.log("fetchAllTickerData()");
		for (let exchangeName in this.exchanges) {
			let exchange = this.exchanges[exchangeName];
			let watchlist = this.config.watchlist[exchangeName];
			if (watchlist) {
				for (let symbol of watchlist) {
					const ticker = await exchange.fetchTicker(symbol);
					const now = new Date();
					console.log(""+ now +" "+ exchangeName +":"+ ticker.symbol
						+ ": "+ ticker.close);

					// update our cache
					if (! this.tickerCache[exchangeName]) {
						this.tickerCache[exchangeName] = {};
					}
					this.tickerCache[exchangeName][symbol] = {
						// TODO: determine what data we want to
						// actually hang on to
						timePulled: now,
						close: ticker.close
					};
				}
			}
		}
	}

	/**
	 * Process positions
	 */
	async processOpenPositions() {
		console.log("processOpenPositions()");
		const positions = this.listOpenPositions();

		// TODO
	}

	/**
	 * Returns the current ticker cache.
	 */
	getLatestTickerData() {
		return this.tickerCache;
	}

	/**
	 * Order-related operations
	 */
	async createOrder(order) {
		return await this.database.insertOrder(order);
	}
	async listOpenOrders() {
		// TODO: set up proper query to select only open positions
		return await this.database.listOrders();
	}
	async getOrder(id) {
		return await this.database.getOrder(id);
	}

	/**
	 * Position-related operations
	 */
	async openPosition(position) {
		return await this.database.insertPosition(position);
	}
	async listOpenPositions() {
		// TODO: set up proper query to select only open positions
		return await this.database.listPositions();
	}
	async getPosition(id) {
		return await this.database.getPosition(id);
	}
}

module.exports = DataEngine;
