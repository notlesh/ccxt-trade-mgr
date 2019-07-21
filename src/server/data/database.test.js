import { MongoClient, ObjectId } from 'mongodb';
import Joi from 'joi';

import Database from './database';
import Schema from './schema';
import Samples from './samples';

const testCollection = "test_collection";

describe("database", () => {
	let connection;
	let mongoDb;
	let db;

	beforeAll(async () => {
		connection = await MongoClient.connect(global.__MONGO_URI__, {useNewUrlParser: true});
		mongoDb = await connection.db(global.__MONGO_DB_NAME__);
		db = new Database({});
		db.open(mongoDb);

		// inject our test_collection
		db.dbCollections[testCollection] = db.db.collection(testCollection);
	});

	afterAll(async () => {
		await connection.close();
	});

	beforeEach(async () => {
		db.dbCollections[testCollection].deleteMany({});
	});

	describe("insert", () => {

		it("Should accept a valid object", async () => {
			await db.insertObject(testCollection, {...Samples.managedOrder}, Schema.managedOrder);
		});

		it("Should reject empty object", async () => {
			await expect(db.insertObject(testCollection, {}, Schema.managedOrder)).rejects.toThrow();
		});

		it("Should reject objects with duplicate ids", async () => {
			const obj = { _id: 1, foo: "bar" };
			await db.insertObject(testCollection, {...obj}, Joi.any());
			await expect(db.insertObject(testCollection, {...obj}, Joi.any())).rejects.toThrow();
		});

	});

	describe("get", () => {

		it("Should return null on no id match", async () => {
			const obj = await db.getObject(testCollection, "invalid_1234");
			expect(obj).toBeFalsy();
		});

		it("Should properly match an id", async () => {
			const originalObj = {...Samples.managedOrder};
			const id = await db.insertObject(testCollection, originalObj, Schema.managedOrder);
			expect(id).toBeInstanceOf(ObjectId);

			const retrievedObj = await db.getObject(testCollection, id);
			expect(retrievedObj).toMatchObject(originalObj);
		});
	});

	describe("update", () => {

		it("Should reject update on non-existing ojbect", async () => {
			await expect(db.updateObject(testCollection, "invalid_1234", {foo: "newFoo"})).rejects.toThrow();
		});

		it("Should properly update a field", async () => {
			const obj = {foo: "baz"};
			const id = await db.insertObject(testCollection, {...obj}, Joi.any());

			await db.updateObject(testCollection, id, {...obj, ...{foo: "bar"}}, Joi.any());

			const newObj = await db.getObject(testCollection, id);
			expect(newObj.foo).toEqual("bar");
		});

		it("Should validate schema if provided", async () => {
			const obj = {foo: "baz"};
			const id = await db.insertObject(testCollection, {...obj}, Joi.any());

			await expect(db.updateObject(testCollection, id, {foo: "newFoo"}, Joi.any().forbidden()))
				.rejects.toThrow();
		});
	});

	describe("delete", () => {

		it("Should properly delete an existing object", async () => {
			const obj = {foo: "baz"};
			const id = await db.insertObject(testCollection, {...obj}, Joi.any());

			let objs = await db.listObjects(testCollection);
			expect(objs).toHaveLength(1);

			await db.deleteObject(testCollection, id);
			objs = await db.listObjects(testCollection);
			expect(objs).toHaveLength(0);
		});

		it("Should reject delete on non-existing object", async () => {
			await expect(db.deleteObject(testCollection, "invalid_1234")).rejects.toThrow();
		});
	});

	describe("list", () => {

		it("Should list all objects inserted", async () => {
			await db.insertObject(testCollection, {...Samples.managedOrder}, Schema.managedOrder);
			await db.insertObject(testCollection, {...Samples.managedOrder}, Schema.managedOrder);
			await db.insertObject(testCollection, {...Samples.managedOrder}, Schema.managedOrder);

			const results = await db.listObjects(testCollection);
			expect(results).toHaveLength(3);

			expect(results[0]).toMatchObject(Samples.managedOrder);
			expect(results[1]).toMatchObject(Samples.managedOrder);
			expect(results[2]).toMatchObject(Samples.managedOrder);
		});

		it("Should reject an unkown collection", async () => {
			await expect(db.listObjects("unknown_collection")).rejects.toThrow();
		});

		it("Should use query parameter to filter results", async () => {
			const obj1 = {...Samples.managedOrder, ...{externalId: "foo"}};
			const obj2 = {...Samples.managedOrder, ...{externalId: "bar"}};

			await db.insertObject(testCollection, obj1, Schema.managedOrder);
			await db.insertObject(testCollection, obj2, Schema.managedOrder);

			const results = await db.listObjects(testCollection, {externalId: "foo"});

			expect(results).toHaveLength(1);
			expect(results[0]).toMatchObject(obj1);

		});

	});

});
