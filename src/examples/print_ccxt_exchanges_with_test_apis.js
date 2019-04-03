'use strict';

const ccxt = require('ccxt');

for (const exchangeName of ccxt.exchanges) {

	const classObject = ccxt[exchangeName];
	const exchange = new classObject();

	const testURL = exchange.urls['test'];
	if (testURL) {

		console.log(""+ exchangeName +" has test URL: ", testURL);
	}
	
}


