/**
 * This file contains the CCXT data engine. This functionality will 
 * periodically query exchange information needed to update trades.
 *
 */
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const assert = require('assert');

const Log = require('../logging');
const Schema = require('./schema');

const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'ccxt_mgr';

class Database {
	constructor(config) {
		this.connected = false;
		this.dbClient = null;
		this.db = null;
		this.dbCollections = {};
	}

	/**
	 * Open the database. A mongo db can be specified for e.g. testing with
	 * a mock. If left null, one will be opened.
	 */
	async open(db = null) {
		const self = this;
		return new Promise((resolve, reject) => {
			if (self.connected) {
				resolve();
			} else {
				if (db) {
					self.db = db;
					this.connected = true;
					this.primeCollections();
					resolve();
				} else {
					Log.db.verbose("Connecting to mongo...");
					const client = new MongoClient(mongoUrl);
					client.connect(function(err) {
						if (err) {
							reject(err);
						}

						Log.db.verbose("Connected!");
						self.db = client.db(dbName);
						self.connected = true;

						self.primeCollections();
						resolve();
					});
				}
			}
		});
	}

	/**
	 * Create and track collections
	 */
	primeCollections() {
		this.dbCollections.managedOrders = this.db.collection("managedOrders");
		this.dbCollections.managedPositions = this.db.collection("managedPositions");
	}

	/**
	 * Close database
	 */
	async close() {
		if (this.connected) {
			this.dbClient.close();
			this.connected = false;
		}
	}

	/**
	 * Insert an object into the database
	 */
	async insertObject(collectionName, object, schema) {
		await schema.validate(object);
		Log.db.debug({ subject: "inserting object", collectionName, data: object });
		const collection = this.dbCollections[collectionName];
		if (! collection) {
			throw new Error("Could not find mongo collection by name "+ collectionName);
		}
		const result = await collection.insertOne(object);
		return result.insertedId;
	}

	/**
	 * Retrieve an object by its _id
	 */
	async getObject(collectionName, id) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections[collectionName].find(ObjectId(id)).toArray((err, docs) => {
				if (err) {
					reject(err);
				} else {
					if (docs.length == 0) {
						resolve(null);
					} else if (docs.length == 1) {
						resolve(docs[0]);
					} else {
						reject("Expected 0 or 1 result");
					}
				}
			});
		});
	}

	/**
	 * Update an object
	 */
	async updateObject(collectionName, id, object, schema) {
		if (schema) {
			await schema.validate(object);
		}
		Log.db.debug({ subject: "updating object", id: id, data: object });
		const self = this;
		return new Promise(async (resolve, reject) => {
			try {
				const results = await self.dbCollections[collectionName].updateOne({_id : id}, {$set: object});
				if (results.modifiedCount) {
					resolve();
				} else {
					reject(new Error("Cannot update non-existent object with id "+ id));
				}
			} catch(e) {
				reject(e);
			}
		});
	}

	/**
	 * Delete an object
	 */
	async deleteObject(collectionName, id) {
		const self = this;
		const result = await self.dbCollections[collectionName].deleteOne({_id: id});
		if (! result.deletedCount) {
			throw new Error("Cannot delete non-existent object with id "+ id);
		}
	}

	/**
	 * List all objects in database
	 */
	async listObjects(collectionName, query = {}) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections[collectionName].find(query).toArray((err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}


	/**
	 * Operations on "managedOrders"
	 */
	async insertManagedOrder(managedOrder) {
		return await this.insertObject("managedOrders", managedOrder, Schema.managedOrder);
	}
	async getManagedOrder(id) {
		return await this.getObject("managedOrders", id);
	}
	async updateManagedOrder(id, managedOrder) {
		return await this.updateObject("managedOrders", id, managedOrder, Schema.managedOrder);
	}
	async deleteManagedOrder(id) {
		return await this.deleteObject("managedOrders", id);
	}
	async listManagedOrders(query = {}) {
		return await this.listObjects("managedOrders", query);
	}

	/**
	 * Operations on "managedPositions"
	 */
	async insertManagedPosition(managedPosition) {
		return await this.insertObject("managedPositions", managedPosition, Schema.managedPosition);
	}
	async getManagedPosition(id) {
		return await this.getObject("managedPositions", id);
	}
	async updateManagedPosition(id, managedPosition) {
		return await this.updateObject("managedPositions", id, managedPosition, Schema.managedPosition);
	}
	async deleteManagedPosition(id) {
		return await this.deleteObject("managedPositions", id);
	}
	async listManagedPositions(query = {}) {
		return await this.listObjects("managedPositions", query);
	}

}

module.exports = Database;
