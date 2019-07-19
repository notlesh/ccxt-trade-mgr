/**
 * Position-related REST routes
 */
import express from 'express';

import Log from '../../logging';

function positionRoutes(server) {

	const router = express.Router();

	router.get('/positions', async (req, res, next) => {
		try {
			const positions = await server.positionManager.listOpenManagedPositions();
			res.json(positions);
		} catch (err) {
			next(err);
		}
	});

	router.get('/positions/:id', async (req, res, next) => {
		try {
			const id = req.params.id;

			if (! id) {
				throw new Error("'id' required");
			}

			const position = await server.positionManager.getManagedPosition(id);
			if (! position) {
				res.status(404).send("No position found with id "+ id);
				return;
			}

			res.json(position);

		} catch (err) {
			next(err);
		}
	});

	router.post('/positions', async (req, res, next) => {
		try {
			const position = req.body;
			const id = await server.positionManager.openManagedPosition(position);
			res.json({id: id});
		} catch (err) {
			next(err);
		}
	});

	return router;
}

export default positionRoutes;
