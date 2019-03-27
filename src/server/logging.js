/**
 * Set up multiple Winston loggers here, allowing each subsection of code
 * to log indepentently of others.
 *
 * The initial motivation is to have each part of code logging to the
 * appropriate place, allowing more sophisticated logging to be managed here
 * (as opposed to having to refactor log statements).
 */
const winston = require('winston');

const Constants = require('./data/constants');

let combinedTransport = new winston.transports.File({
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.errors({ stack: true }),
			winston.format.json()
		),
		filename: Constants.LOGGING_DIR + 'all.log'
	});
let console = new winston.transports.Console({
		level: 'warn',
		format: winston.format.combine(
			winston.format.errors({ stack: true }),
			winston.format.colorize({ all: true }),
		)
	});

const Log = {

	// database logging
	db: winston.createLogger({
		level: 'silly',
		transports: [
			combinedTransport,
			console,
			new winston.transports.File(
					{filename: Constants.LOGGING_DIR + '/database.log'}),
		],
	}),

	// logging for any API request
	api: winston.createLogger({
		level: 'silly',
		transports: [
			combinedTransport,
			console,
			new winston.transports.File(
					{filename: Constants.LOGGING_DIR + '/api.log'}),
		],
	}),

	// order-related logging
	orders: winston.createLogger({
		level: 'silly',
		transports: [
			combinedTransport,
			console,
			new winston.transports.File(
					{filename: Constants.LOGGING_DIR + '/orders.log'}),
		],
	}),

	// position-related logging
	positions: winston.createLogger({
		combinedTransport,
		level: 'silly',
		transports: [
			combinedTransport,
			console,
			new winston.transports.File(
					{filename: Constants.LOGGING_DIR + '/positions.log'}),
		],
	}),

	// log to console and combined
	console: winston.createLogger({
		combinedTransport,
		level: 'silly',
		transports: [
			combinedTransport,
			console,
		],
	}),
};

module.exports = Log;
