/**
 * Client functionality -- talks to server via JSON RPC API
 */

const jayson = require('jayson');

class Client {

	constructor(host, port) {
		this.client = jayson.client.http({
			host: host,
			port: port
		});
	}

	/**
	 * Order-related operations
	 */
	async listOrders() {
		const that = this;
		return new Promise(function(resolve, reject) {
			that.client.request('listOrders', [], function(err, response) {
				if (err) reject(err);
				resolve(response.result);
			});
		});
	}
	async getOrder(id) {
		const that = this;
		return new Promise(function(resolve, reject) {
			that.client.request('getOrder', [id], function(err, response) {
				if (err) reject(err);
				resolve(response.result);
			});
		});
	}
	async createOrder(order) {
		const that = this;
		return new Promise(function(resolve, reject) {
			that.client.request('createOrder', [order], function(err, response) {
				if (err) reject(err);
				resolve(response);
			});
		});
	}

	/**
	 * Position-related operations
	 */
	async listPositions() {
		const that = this;
		return new Promise(function(resolve, reject) {
			that.client.request('listPositions', [], function(err, response) {
				if (err) reject(err);
				resolve(response.result);
			});
		});
	}
	async getPosition(id) {
		const that = this;
		return new Promise(function(resolve, reject) {
			that.client.request('getPosition', [id], function(err, response) {
				if (err) reject(err);
				resolve(response.result);
			});
		});
	}
	async openPosition(position) {
		const that = this;
		return new Promise(function(resolve, reject) {
			that.client.request('openPosition', [position], function(err, response) {
				if (err) reject(err);
				resolve(response);
			});
		});
	}

	async getLatestPriceData() {
		const that = this;
		return new Promise(function(resolve, reject) {
			that.client.request('getLatestPriceData', [], function(err, response) {
				if (err) reject(err);
				resolve(response.result);
			});
		});
	}

};

module.exports = Client;
