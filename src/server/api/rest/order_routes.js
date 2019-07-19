/**
 * Order-related REST routes
 */
import express from 'express';

import Log from '../../logging';

function orderRoutes(server) {

	const router = express.Router();

	router.get('/orders', async (req, res, next) => {
		try {
			const orders = await server.orderManager.listOpenManagedOrders();
			res.json(orders);
		} catch (err) {
			next(err);
		}
	});

	router.get('/orders/:id', async (req, res, next) => {
		try {
			const id = req.params.id;

			if (! id) {
				throw new Error("'id' required");
			}

			const order = await server.orderManager.getManagedOrder(id);
			if (! order) {
				res.status(404).send("No order found with id "+ id);
				return;
			}

			res.json(order);

		} catch (err) {
			next(err);
		}
	});

	router.post('/orders', async (req, res, next) => {
		try {
			const order = req.body;
			const id = await server.orderManager.createManagedOrder(order);
			res.json({id: id});
		} catch (err) {
			next(err);
		}
	});

	return router;
}

export default orderRoutes;
