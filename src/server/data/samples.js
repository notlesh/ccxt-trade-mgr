/**
 * Sample objects for data objects
 */
const Samples = {};

Samples.target = {
	amount: 1,
	target: 1,
};

Samples.orderSpec = {
	exchange: "coinbasepro",
	pair: "BTC/USD",
	direction: "long",
	leverage: 1,
	price: 1,
	amount: 1,
	type: "limit",
};

Samples.managedOrder = {
	originalOrder: Samples.orderSpec,
	createdTimestamp: new Date(),
	status: "test",
	placed: true,
	closed: false,
	externalId: "testid",
	filledAmount: 1,
};

Samples.positionSpec = {
	exchange: "coinbasepro",
	pair: "BTC/USD",
	direction: "long",
	leverage: 1,
	entries: [ Samples.target ],
	stoploss: 1,
	targets: [ Samples.target ],
	rationale: "testing",

};

Samples.managedPosition = {
	originalPosition: Samples.positionSpec,
	createdTimestamp: new Date(),
	status: "test",
	closed: true,
	entryOrders: [ "test" ],
	targetOrders: [ "test" ],
	stoplossOrders: [ "test" ],
};

Samples.userDetails = {
	username: "user1",
	email: "test@email.com",
	passwordHash: "notreallyahash",
};

export default Samples;

