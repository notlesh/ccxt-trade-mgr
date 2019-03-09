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
					self.dbCollections.orders = self.db.collection("orders");
					self.dbCollections.positions = self.db.collection("positions");
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
	 * Operations on "orders"
	 */
	async insertOrder(order) {
		await Schema.order.validate(order);
		const result = await this.dbCollections.orders.insertOne(order);
		return result.insertedId;
	}
	async updateOrder(id, order) {
		const self = this;
		return new Promise((resolve, reject) => {
			try {
				self.dbCollections.orders.updateOne({_id : id}, {$set: order} );
				resolve();
			} catch(e) {
				reject(e);
			}
		});
	}
	async getOrder(id) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.orders.find(ObjectId(id)).toArray((err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}
	async listOrders(query = {}) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.orders.find(query).toArray((err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}
	async deleteOrder(id) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.orders.deleteOne({_id : id}, (err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}

	/**
	 * Operations on "positions"
	 */
	async insertPosition(position) {
		await Schema.position.validate(position);
		const result = await this.dbCollections.positions.insertOne(position);
		return result.insertedId;
	}
	async updatePosition(id, position) {
		const self = this;
		return new Promise((resolve, reject) => {
			try {
				self.dbCollections.positions.updateOne({_id : id}, {$set: position} );
				resolve();
			} catch(e) {
				reject(e);
			}
		});
	}
	async getPosition(id) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.positions.find(ObjectId(id)).toArray((err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}
	async listPositions(query = {}) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.positions.find(query).toArray((err, docs) => {
				if (err) {
					reject(err);
				} else {
					resolve(docs);
				}
			});
		});
	}
	async deletePosition(id) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.dbCollections.positions.deleteOne({_id : id}, (err, docs) => {
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
