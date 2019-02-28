const DataEngine = require('../server/ccxt_data_engine');
const Database = require('../server/data/database');

const main = async function() {
	console.log("main()...");

	const database = new Database();
	await database.open();
	console.log("Connected!");
	await database.insertPosition( {
			exchange: "binance",
			pair: "BNB/BTC",
			direction: "long",
			entries: [
				{target: 0.001, amount: 0.01},
				{target: 0.0009, amount: 0.02},
				{target: 0.0008, amount: 0.02},
			],
			stoploss: 0.0005,
			targets: [
				{target: 0.0012, amount: 0.5},
				{target: 0.0014, amount: 0.5},
			],
			rationale: "always a good idea"
			
		});

	let allPositions = await database.listPositions();
	console.log("Positions: ", allPositions);

	for (let pos of allPositions) {

		// console.log("Overwriting name!");
		// const update = { name: "ALL YOUR NAME ARE BELONG TO US" };
		// await database.updatePosition(pos._id, update);

		console.log("Deleting position "+ pos._id);
		const obj = await database.getPosition(pos._id);
		console.log("before deleting: ", obj );
		await database.deletePosition(pos._id);
	}

	allPositions = await database.listPositions();
	console.log("Positions, after deleting: ", allPositions);
}
main();
