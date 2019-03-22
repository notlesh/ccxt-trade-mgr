/**
 * This file contains the CCXT data engine. This functionality will 
 * periodically query exchange information needed to update trades.
 *
 */
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const assert = require('assert');

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

	async open() {
		const self = this;
		if (! this.connected) {

			// dbClient.connect() isn't thenable, so we need to wrap in a promise
			return new Promise(function(resolve, reject) {
				console.log("Connecting...");
				const client = new MongoClient(mongoUrl);
				client.connect(function(err) {
					assert.equal(null, err);
					console.log("Connected!");

					self.db = client.db(dbName);
					self.dbCollections.managedOrders = self.db.collection("managedOrders");
					self.dbCollections.managedPositions = self.db.collection("managedPositions");
					resolve();

				});
			});
		}
	}

	async close() {
		if (! this.connected) {
			this.dbClient.close();
			this.connected = false;
		}
	}

	// TODO: reduce code duplication here -- can we generate CRUDL functions automatically?

	/**
	 * Operations on "managedOrders"
	 */
	async insertManagedOrder(managedOrder) {
		await Schema.managedOrder.validate(managedOrder);
		const result = await this.dbCollections.managedOrders.insertOne(managedOrder);
		return result.insertedId;
	}
	async updateManagedOrder(id, managedOrder) {
		const self = this;
		return new Promise((resolve, reject) => {
			try {
				self.dbCollections.managedOrders.updateOne({_id : id}, {$set: managedOrder} );
				resolve();
			} catch(e) {
				reject(e);
			}
		});
	}
	async getManagedOrder(id) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.managedOrders.find(ObjectId(id)).toArray((err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}
	async listManagedOrders(query = {}) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.managedOrders.find(query).toArray((err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}
	async deleteManagedOrder(id) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.managedOrders.deleteOne({_id : id}, (err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}

	/**
	 * Operations on "managedPositions"
	 */
	async insertManagedPosition(managedPosition) {
		await Schema.managedPosition.validate(managedPosition);
		const result = await this.dbCollections.managedPositions.insertOne(managedPosition);
		return result.insertedId;
	}
	async updateManagedPosition(id, managedPosition) {
		const self = this;
		return new Promise((resolve, reject) => {
			try {
				self.dbCollections.managedPositions.updateOne({_id : id}, {$set: managedPosition} );
				resolve();
			} catch(e) {
				reject(e);
			}
		});
	}
	async getManagedPosition(id) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.managedPositions.find(ObjectId(id)).toArray((err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}
	async listManagedPositions(query = {}) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.managedPositions.find(query).toArray((err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}
	async deleteManagedPosition(id) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.managedPositions.deleteOne({_id : id}, (err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}

}

module.exports = Database;
