import express from 'express';
import {
    getUserNotifications,
    markNotificationRead,
    markAllRead
} from '../controllers/notificationController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getUserNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markNotificationRead);

export default router;
