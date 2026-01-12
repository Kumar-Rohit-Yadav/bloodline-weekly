import express from 'express';
import { getMessages, getConnectionMessages } from '../controllers/messageController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.use(protect);

router.get('/:requestId', getMessages);
router.get('/connection/:connectionId', getConnectionMessages);

export default router;
