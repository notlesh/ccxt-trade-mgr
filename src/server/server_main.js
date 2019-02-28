#!/usr/bin/env node

/**
 * Main entry point fer server
 */
const Server = require('./server');

const main = function() {
	const server = new Server();
	server.start();
}
main();

