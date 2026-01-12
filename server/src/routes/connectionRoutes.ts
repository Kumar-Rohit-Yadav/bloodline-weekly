import express from 'express';
import { protect } from '../middlewares/auth';
import { sendConnectionRequest, respondToConnection, getMyConnections, getPendingRequests, deleteConnection } from '../controllers/connectionController';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getMyConnections)
    .post(sendConnectionRequest);

router.get('/pending', getPendingRequests);

router.route('/:id')
    .put(respondToConnection)
    .delete(deleteConnection);

export default router;
