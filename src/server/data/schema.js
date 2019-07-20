const Joi = require('joi');

/**
 * This contains "schema" objects that can be used to validate objects using the
 * Joi validator.
 *
 * This file also contains documentation on each object and field.
 */
const Schema = {};

/**
 * A target describes a desired price point and an amount and is used
 * to express an intention to buy, sell, stoploss, etc.
 *
 * target = {
 *     amount: <float>                   amount to buy at this entry point, expressed in base currency
 *     target: <float>                   price point to buy/sell at, expressed in quote currency
 * };
 */
Schema.target = Joi.object().keys({
	amount: Joi.number().greater(0).required(),
	target: Joi.number().greater(0).required()
});

/**
 * An orderSpec is a specification of an order to be executed on an exchange.
 *
 * orderSpec = {
 *     exchange: <string>                name of exchange, must match ccxt's naming convention
 *     pair: <string>                    trading pair, must match ccxt's unified pair naming
 *     direction: <string>               "short" or "long"
 *     leverage: <float>                 a number representing the leverage for this order. 0 for no leverage.
 *     price: <float>                    price to buy or sell at
 *     amount: <float>                   amount, in base currency, to buy or sell
 *     type: <string>                    "limit" or "market" // TODO: support others (stoploss, etc.)
 * };
 */
Schema.orderSpec = Joi.object().keys({
	exchange: Joi.string().alphanum().required(),
	pair: Joi.string().required(),
	direction: Joi.string().valid("long", "short").required(),
	leverage: Joi.number(),
	price: Joi.number().greater(0).required(),
	amount: Joi.number().greater(0).required(),
	type: Joi.string().valid("limit", "market").required(), // TODO: support stop loss, etc.
});

/**
 * A managedOrder is an order that is being managed by the CTM system. This includes the original order
 * specification as well as the current order state.
 *
 * managedOrder = {
 *     originalOrder: <orderSpec>     the original orderSpec object
 *     createdTimestamp: <date>       the time when this order was created
 *     status: <string>               the status of the order
 *     placed: <bool>                 true if the order has been placed on the exchange
 *     closed: <bool>                 true if the exchange is done with the order
 *     externalId: <string>           the id assigned by the exchange for this order
 *     filledAmount: <float>          the amount of the order, in base currency, that has been filled
 * };
 */
Schema.managedOrder = Joi.object().keys({
	originalOrder: Schema.orderSpec.required(),
	createdTimestamp: Joi.date().required(),
	status: Joi.string().alphanum().required(), // TODO: enumerate values to validate against
	placed: Joi.boolean().required(),
	closed: Joi.boolean().required(),
	externalId: Joi.string().alphanum().required().allow(''),
	filledAmount: Joi.number().required(),
});

/**
 * A positionSpec describes the original desired intention of a position, including where to initially
 * buy and sell, where to take profit, and where to set stop loss.
 *
 * Note that this merely describes the intention and parameters of a position; it does not contain
 * its state, outcome, etc. Schema.managedPosition serves these purposes.
 *
 * positionSpec = {
 *     exchange: <string>                name of exchange, must match ccxt's naming convention
 *     pair: <string>                    trading pair, must match ccxt's unified pair naming
 *     direction: <string>               "short" or "long"
 *     leverage: <float>                 a number representing the leverage for this position. 0 for no leverage.
 *     entries: [ <Schema.target> ]      desired entry points, amounts expressed in base currency
 *     stoploss: <float>                 stop loss price point, expressed in quote currency
 *     targets: [ <Schema.target> ]      the desired points to take profit at, amounts 
 *                                       expressed as portions in the range [0..1], e.g. 0.5 for half.
 *                                       the sum of all portions in this array should total 1.0
 *     rationale: <string>               a free-form string meant as a note about why this trade was entered
 * };
 */
Schema.positionSpec = Joi.object().keys({
	exchange: Joi.string().alphanum().required(),
	pair: Joi.string().required(),
	direction: Joi.string().valid("long", "short").required(),
	leverage: Joi.number(),
	entries: Joi.array().items(Schema.target).required(),
	stoploss: Joi.number().greater(0).required(), // TODO: should be higher/lower than entry (depending on direction)
	targets: Joi.array().items(Schema.target).required(), // TODO: amounts should total 1.0
	rationale: Joi.string().required(),

});

/**
 * A managedPosition includes the current state of a position, including the original position itself, 
 * what orders have been placed, and any modifications by the user to the original position.
 *
 * managedPosition = {
 *     originalPosition: <positionSpec>   the original position object
 *     createdTimestamp: <date>           the date when this order was received by the server
 *     status: <string>                   the status of this position (e.g. where it is in its lifecycle)
 *     closed: <bool>                     true if this position and any orders it resulted in are closed
 *     entryOrders: [ <string> ]          array of entry order ids (id being local/internal id, not exchange id)
 *     targetOrders: [ <string> ]         array of target order ids (id being local/internal id, not exchange id)
 *     stoplossOrders: [ <string> ]       array of stoploss order ids (id being local/internal id, not exchange id)
 * };
 */
Schema.managedPosition = Joi.object().keys({
	originalPosition: Schema.positionSpec.required(),
	createdTimestamp: Joi.date(),
	status: Joi.string().alphanum().required(), // TODO: enumerate values to validate against
	closed: Joi.boolean().required(),
	entryOrders: Joi.array().items(Joi.string()),
	targetOrders: Joi.array().items(Joi.string()),
	stoplossOrders: Joi.array().items(Joi.string()),
});

/**
 * UserDetails describe a user that is known to the system.
 *
 * userDetails = {
 *     username: <string>                 unique username chosen by the user
 *     email: <string>                    user's primary email, used for communication
 *     passwordHash: <string>             hash of user's password
 * };
 */
Schema.userDetails = Joi.object().keys({
	username: Joi.string().alphanum().min(5).max(50).required(),
	email: Joi.string().email({ minDomainSegments: 2 }),
	passwordHash: Joi.string().required()
});

module.exports = Schema;

