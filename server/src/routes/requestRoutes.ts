import express from 'express';
import {
    createRequest,
    getMyRequests,
    getNearbyRequests,
    pledgeToRequest,
    getMyHistory,
    verifyMissionQR,
    getRequestById,
    fulfillRequestDirectly,
    deleteRequest
} from '../controllers/requestController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.route('/')
    .post(protect, createRequest)
    .get(protect, getMyRequests);

router.get('/nearby', protect, getNearbyRequests);
router.get('/history', protect, getMyHistory);

router.route('/:id')
    .get(protect, getRequestById)
    .delete(protect, deleteRequest);

router.post('/:id/fulfill-direct', protect, fulfillRequestDirectly);
router.put('/:id/pledge', protect, pledgeToRequest);
router.post('/:id/verify-qr', protect, verifyMissionQR);

export default router;
