/**
 * This file contains the UserManager, which is responsible for handling logic
 * on interaction with user info.
 */
import assert from 'assert';

import Log from './logging';

class UserManager {

	constructor(database) {
		this.database = database;
	}

	/**
	 * Creates a new user, ensuring all required "new user" logic is handled
	 */
	async createUser(userDetails) {
		// TODO: send intro email, create other user objects, etc.
		return await this.database.insertUserDetails(userDetails);
	}
	async listUserDetails() {
		return await this.database.listUserDetails();
	}
	async getUserDetails(id) {
		return await this.database.getUserDetails(id);
	}
}

export default UserManager;
