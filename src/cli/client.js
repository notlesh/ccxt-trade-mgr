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

	async listPositions() {
		const that = this;
		return new Promise(function(resolve, reject) {
			that.client.request('listPositions', [], function(err, response) {
				if (err) reject(err);
				resolve(response.result);
			});
		});
	}

	async openPosition(position) {
		throw new Error("Implement me!");
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
