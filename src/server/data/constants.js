/**
 * constants, enums, etc. shared throughout the codebase
 */
Constants = Object.freeze({

	/**
	 * The primary "lifecycle" status of an order
	 */
	OrderStatusEnum: Object.freeze({
		UNINITIALIZED: "UNINITIALIZED",
		ORDER_REQUESTED: "ORDER_REQUESTED",
	}),

});

module.exports = Constants;
