/**
 * constants, enums, etc. shared throughout the codebase
 */
const Constants = Object.freeze({

	/**
	 * The primary "lifecycle" status of an order
	 */
	OrderStatusEnum: Object.freeze({
		UNINITIALIZED: "UNINITIALIZED",
		PLACEMENT_FAILED: "PLACEMENT_FAILED",
		ORDER_REQUESTED: "ORDER_REQUESTED",
		ORDER_PARTIALLY_FILLED: "ORDER_PARTIALLY_FILLED",
		ORDER_FILLED: "ORDER_FILLED",
	}),

	/**
	 * The primary "lifecycle" status of a position
	 */
	PositionStatusEnum: Object.freeze({
		UNINITIALIZED: "UNINITIALIZED",
		ENTRIES_PLACED: "ENTRIES_PLACED",
	}),

	LOGGING_DIR: './log/',

});

module.exports = Constants;
