/**
 * User-related REST routes
 */
import express from 'express';

import Log from '../../logging';

function userRoutes(server) {

	const router = express.Router();

	router.get('/users', async (req, res, next) => {
		try {
			const users = await server.userManager.listUserDetails();
			res.json(users);
		} catch (err) {
			next(err);
		}
	});

	router.get('/users/:id', async (req, res, next) => {
		try {
			const id = req.params.id;

			if (! id) {
				throw new Error("'id' required");
			}

			const userDetails = await server.userManager.getUserDetails(id);
			if (! userDetails) {
				res.status(404).send("No user details found with id "+ id);
				return;
			}

			res.json(userDetails);

		} catch (err) {
			next(err);
		}
	});

	router.post('/users', async (req, res, next) => {
		try {
			const userDetails = req.body;
			const id = await server.userManager.createUser(userDetails);
			res.json({id: id});
		} catch (err) {
			next(err);
		}
	});

	return router;
}

export default userRoutes;
