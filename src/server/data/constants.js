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
		ORDER_PARTIALLY_FILLED: "ORDER_PARTIALLY_FILLED",
		ORDER_FILLED: "ORDER_FILLED",
	}),

	/**
	 * The primary "lifecycle" status of a position
	 */
	PositionStatusEnum: Object.freeze({
		UNINITIALIZED: "UNINITIALIZED",
	}),

	LOGGING_DIR: './log/',

});

module.exports = Constants;
