/**
 * Schema validation for data objects.
 */

const Joi = require('joi');

const Schema = {

	position: Joi.object().keys({

		// The exchange on which this position should be executed
		exchange: Joi.string().alphanum().required(),

		// the trading pair (e.g. BTC/USD) for this position
		pair: Joi.string().required(),

		// direction: short or long
		direction: Joi.string().valid("long", "short").required(),

		// entry point(s) -- array of {entry: <number>, amount: <number>}
		entries: Joi.array().items( Joi.object().keys({
				amount: Joi.number().greater(0).required(),
				target: Joi.number().greater(0).required()
		})),


		// stoploss TODO: should be higher/lower than entry (depending on direction)
		stoploss: Joi.number().greater(0).required(),

		// target(s) -- desired take-profit levels (array of {target: <number>, portion: <number>}
		// TODO: additionally, portion should add up to exactly 1.0.
		targets: Joi.array().items( Joi.object().keys({
				amount: Joi.number().greater(0).max(1.0).required(),
				target: Joi.number().greater(0).required()
		})),

		// rationale (text blob for describing reasons for this trade)
		rationale: Joi.string().required(),

	}),
};

module.exports = Schema;

