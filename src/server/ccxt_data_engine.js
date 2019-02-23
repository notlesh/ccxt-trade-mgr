/**
 * This file contains the CCXT data engine. This functionality will 
 * periodically query exchange information needed to update trades.
 *
 */
const ccxt = require('ccxt');
const assert = require('assert');
const sleep = require('sleep');

class DataEngine {
	constructor(config) {
		this.config = config;
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
			for (let exchange of self.config.exchanges) {

				// initialize each exchange we will need to work with
				const classObject = ccxt[exchange]
				self.exchanges[exchange] = new classObject();
			}

			// now query exchange for data
			while (true) {
				for (let exchangeName in self.exchanges) {
					let exchange = self.exchanges[exchangeName];
					let watchlist = self.config.watchlist[exchangeName];
					if (watchlist) {
						for (let symbol of watchlist) {
							const ticker = await exchange.fetchTicker(symbol);
							console.log(exchangeName +":"+ ticker.symbol
								+ ": "+ ticker.close);

							// update our cache
							if (! self.tickerCache[exchangeName]) {
								self.tickerCache[exchangeName] = {};
							}
							self.tickerCache[exchangeName][symbol] = {
								// TODO: determine what data we want to
								// actually hang on to
								timePulled: new Date(),
								close: ticker.close
							};
							// TODO: evaluate managed positions
						}
					}
				}

				await sleep.sleep(2);
			}

			// XXX: should only exit when told to do so
			console.log("Done running");
			self.running = false;
		}, 1000);
	}

	/**
	 * Returns the current ticker cache.
	 */
	getLatestTickerData() {
		return this.tickerCache;
	}
}

module.exports = DataEngine;
