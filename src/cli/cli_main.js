#!/usr/bin/env node

/**
 * Command line interface for using server's JSON RPC API
 */

const program = require('commander');
const sleep = require('sleep');

const Client = require('./client');

client = null;

const main = function() {

	// TODO: this needs some clean up and testing, especially where corner cases
	// might cause bad behavior (e.g. "oops, we just sold BTC for a penny.")
	//
	// "commander" lib is intuitive and does a lot for us, but it seems to lack some 
	// important functionality. for example, if we say "--port [value]" but the user
	// specifies --port witohut any value, the parser is perfectly happy.
	//
	// specifying required options / commands seems to be lacking as well.

	program
		.version('0.1.0', '-v, --version')
		// .arguments('[options] <cmd> [cmd options]')
		.option('-h, --host [host]', 'Server hostname or IP address', 'localhost')
		.option('-p, --port [port]', 'Server port', 5280)

	program
		.on('--help', () => {
			console.log('');
			console.log('Examples:');
			console.log('  $ ctm -h localhost listPositions');
			// console.log('  $ ctm -h localhost openPosition ETH/USD short 250.0 -sl 261.0 -tp 225,220.6,200');
	});

	program
		.command('getLatestPriceData')
		.description('Get the latest price data for the configured watchlist')
		.action(async () => {
			await sleep.msleep(1);
			const data = await client.getLatestPriceData();
			console.log(data);
		});

	program
		.command('listPositions')
		.description('List all positions')
		.action(async () => {
			await sleep.msleep(1);
			const positions = await client.listPositions();
			console.log(positions);
		});

	program.parse(process.argv);

	client = new Client(program.host, program.port);
}
main();

