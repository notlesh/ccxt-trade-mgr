/**
 * This file contains the CCXT data engine. This functionality will 
 * periodically query exchange information needed to update trades.
 *
 */
const ccxt = require('ccxt');
const assert = require('assert');
const sleep = require('sleep');

const Log = require('./logging');

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

		Log.console.info("DataEngine.start()...");

		this.running = true;

		const self = this;
		setTimeout(async function() {
			Log.console.info("DataEngine: Setting up ccxt exchanges");
			for (let exchangeConf of self.config.exchanges) {

				// initialize each exchange we will need to work with
				// we expect the string from the config to match a class in ccxt,
				// for example "binance" would match ccxt.binance
				const classObject = ccxt[exchangeConf.name]
				Log.console.info("DataEngine: Initializing exchange "+ exchangeConf.name);
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
					const balance = await exchange.fetchBalance();
					Log.console.info(
						{
							message: "Account balance for "+ exchangeConf.name,
							balance: balance,
						});
				}
			}

			// now query exchange for data
			while (self.running) {
				await self.fetchAllTickerData();
				await sleep.sleep(10);
			}

			// XXX: should only exit when told to do so
			Log.console.info("DataEngine: Done running");
			self.running = false;
		}, 1000);
	}

	/**
	 * Fetch the latest ticker data from each exchange and update
	 * the cache
	 */
	async fetchAllTickerData() {
		Log.console.info("DataEngine.fetchAllTickerData()");
		for (let exchangeName in this.exchanges) {
			let exchange = this.exchanges[exchangeName];
			let watchlist = this.config.watchlist[exchangeName];
			if (watchlist) {
				for (let symbol of watchlist) {
					try {
						const ticker = await exchange.fetchTicker(symbol);
						const now = new Date();
						Log.console.info(""+ now +" "+ exchangeName +":"+ ticker.symbol
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
					} catch(e) {
						Log.console.error(
							{
								message: "Error trying to fetch ticker data",
								error: e
							});
					}
				}
			}
		}
	}

	/**
	 * Returns the current ticker cache.
	 */
	getLatestTickerData() {
		return this.tickerCache;
	}
}

module.exports = DataEngine;
