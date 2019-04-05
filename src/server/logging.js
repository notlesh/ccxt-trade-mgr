/**
 * Set up multiple Winston loggers here, allowing each subsection of code
 * to log indepentently of others.
 *
 * The initial motivation is to have each part of code logging to the
 * appropriate place, allowing more sophisticated logging to be managed here
 * (as opposed to having to refactor log statements).
 */
const winston = require('winston');
const colors = require('colors');

const Constants = require('./data/constants');

const consoleFormatter = winston.format.printf(info => {
	let date = new Date().toISOString();
	let message = `${date} ${info.level}: ${info.message}`;

	// TODO: some way to display any extra info would be nice,
	//       but winston combines all sorts of things into the info object, including:
	//       1) stuff we know we want to print
	//       2) stuff we know we don't want to print
	//       3) any number of other things which we may or may not want to print

	if (info.error instanceof Error) {
		// message += "\n" + info.error.stack;
		message += "\n" + colors.red(info.error.stack);
	}

	return message;

});

const logFileFormat = winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.json());
const consoleFormat = winston.format.combine(
		winston.format.colorize({all: true}),
		consoleFormatter);


const combinedTransport = new winston.transports.File({
	format: logFileFormat,
	filename: Constants.LOGGING_DIR + 'all.log'
});
const console = new winston.transports.Console({
	level: 'warn',
	format: consoleFormat,
});
const consoleFile = new winston.transports.File({
	level: 'silly',
	format: consoleFormat,
	filename: Constants.LOGGING_DIR + 'console.log'
});

const Log = {

	// database logging
	db: winston.createLogger({
		level: 'silly',
		transports: [
			combinedTransport,
			consoleFile,
			console,
			new winston.transports.File({
				format: logFileFormat,
				filename: Constants.LOGGING_DIR + '/database.log'}),
		],
	}),

	// logging for any API request
	api: winston.createLogger({
		level: 'silly',
		transports: [
			combinedTransport,
			consoleFile,
			console,
			new winston.transports.File({
				format: logFileFormat,
				filename: Constants.LOGGING_DIR + '/api.log'}),
		],
	}),

	// order-related logging
	orders: winston.createLogger({
		level: 'silly',
		transports: [
			combinedTransport,
			consoleFile,
			console,
			new winston.transports.File({
				format: logFileFormat,
				filename: Constants.LOGGING_DIR + '/orders.log'}),
		],
	}),

	// position-related logging
	positions: winston.createLogger({
		level: 'silly',
		transports: [
			combinedTransport,
			consoleFile,
			console,
			new winston.transports.File({
				format: logFileFormat,
				filename: Constants.LOGGING_DIR + '/positions.log'}),
		],
	}),

	// log to console and combined
	console: winston.createLogger({
		level: 'silly',
		transports: [
			combinedTransport,
			consoleFile,
			console,
		],
	}),
};

module.exports = Log;
