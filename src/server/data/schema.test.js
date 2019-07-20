import Joi from 'joi';

import Schema from './schema';

describe("schema", () => {
	it("should validate a valid userDetails object", () => {
		const userDetails = {
			username: "Stephen",
			email: "valid@email.com",
			passwordHash: "notreallyhashed",
		};

		const results = Schema.userDetails.validate(userDetails);
		expect(results.error).toBe(null);
	});

	it("should fail an invalid email address", () => {
		const userDetails = {
			username: "Stephen",
			email: "invalid",
			passwordHash: "notreallyhashed",
		};

		const results = Schema.userDetails.validate(userDetails);
		expect(results.error).toBeTruthy();
		expect(results.error.details[0].message)
			.toEqual('"email" must be a valid email');
	});

	it("should fail with unrecognized fields", () => {
		const userDetails = {
			username: "Stephen",
			email: "valid@email.com",
			passwordHash: "notreallyhashed",
			extra: "garbage",
		};
		const results = Schema.userDetails.validate(userDetails);
		expect(results.error).toBeTruthy();
		expect(results.error.details[0].message)
			.toEqual('"extra" is not allowed');
	});
});
