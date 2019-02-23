const DataEngine = require('../ccxt_data_engine');
const Database = require('../database');

const main = async function() {
	console.log("main()...");

	const dataEngine = new DataEngine(
		{
			exchanges: [ "kraken", "binance" ],
			watchlist: {
				kraken: [
					"BTC/USD",
					"ETH/USD",
				],
				binance: [
					"TRX/BTC",
				],
			},
		});
	dataEngine.start();
}
main();
