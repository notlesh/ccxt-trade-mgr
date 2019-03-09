#!/usr/bin/env node

/**
 * Command line interface for using server's JSON RPC API
 */

const program = require('commander');
const sleep = require('sleep');

const Client = require('./client');
const Schema = require('../server/data/schema');

client = null;

/**
 * Takes an input in the form of:
 *
 * (amount@target),(amount@target), ...
 *
 * and returns a JSON object like:
 *
 * [ { amount: X, target: Y }, { amount: A, target: B } ]
 *
 * TODO: revise -- is there a good convention/example to follow here?
 */
const parseTargetPoint = function(input) {

	const regex = /[^\d.-]/g;

	let targets = [];

	const pairs = input.split(',');
	for (pair of pairs) {

		const splits = pair.split("@");
		if (splits.length != 2) {
			throw new Error("Error parsing input: "+ input);
		}

		const amountString = splits[0].replace(regex, '');
		const targetString = splits[1].replace(regex, '');

		const amount = parseFloat(amountString);
		const target = parseFloat(targetString);

		targets.push({
			amount: amount,
			target: target
		});
	}

	// console.log("Parsed targets: ", targets);

	return targets;
}

const main = async function() {

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
			console.log('  $ ctm -h localhost getPosition 5c77576ec1801547e4b15288');
			console.log('  $ ctm openPosition --exchange kraken --pair ETHUSD \\');
			console.log('                     --direction long \\');
			console.log('                     --entries "(15@137.0),(15@138.5)" \\');
			console.log('                     --stoploss 134.9 \\');
			console.log('                     --targets "(0.5@194.8),(0.5@249.4)" \\');
			console.log('                     --message "ETH to the moon!"');
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
			console.log(JSON.stringify(positions, null, 2));
		});

	program
		.command('getPosition <id>')
		.description('List all positions')
		.action(async (positionId, cmd) => {
			await sleep.msleep(1);
			const positions = await client.getPosition(positionId);
			console.log(JSON.stringify(positions, null, 2));
		});

	program
		.command('openPosition')
		.description('Open a new position')
		.option('-e, --exchange [exchange]', 'Exchange to trade on')
		.option('-p, --pair [pair]', 'Trading pair')
		.option('-d, --direction [dir]', 'Trading direction ("short" or "long")')
		.option('--entries [entries]', 'Entries as comma separated list of (amount@price)')
		.option('-s, --stoploss [stoploss]', 'Stoploss point')
		.option('--targets [targets]', 'Targets as comma separated list of (portion@price)')
		.option('-m, --message [message]', 'Message for this trade (e.g. rationale)')
		.action(async () => {
			// await sleep.msleep(1);
			// const positions = await client.listPositions();
			const args = program.args[0];

			const position = {
				exchange: args.exchange,
				pair: args.pair,
				direction: args.direction,
				entries: parseTargetPoint(args.entries),
				stoploss: args.stoploss,
				targets: parseTargetPoint(args.targets),
				rationale: args.message,
			};

			// console.log("position obj: ", position);

			await Schema.position.validate(position);

			const response = await client.openPosition(position);
			console.log(response.result.message);
		});

	program.parse(process.argv);

	client = new Client(program.host, program.port);
}
main();

