/**
 * This file contains the CCXT data engine. This functionality will 
 * periodically query exchange information needed to update trades.
 *
 */
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

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
					self.dbCollections.positions = self.db.collection("positions");
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

	/**
	 * Operations on "positions"
	 */
	async insertPosition(position) {
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
			self.dbCollections.positions.find({_id: id}).toArray((err, docs) => {
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

}

module.exports = Database;
