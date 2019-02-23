const DataEngine = require('../server/ccxt_data_engine');
const Database = require('../server/database');

const main = async function() {
	console.log("main()...");

	const database = new Database();
	await database.open();
	console.log("Connected!");
	await database.insertPosition({name: "pos0"});
	await database.insertPosition({name: "pos1"});
	await database.insertPosition({name: "pos2"});
	await database.insertPosition({name: "pos3"});
	await database.insertPosition({name: "pos4"});

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
