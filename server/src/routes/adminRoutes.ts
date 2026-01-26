import express from 'express';
import {
    getUsers,
    verifyUser,
    getPlatformStats,
    updateUser,
    deleteUser,
    getAllRequests,
    deleteRequest
} from '../controllers/adminController';
import { getProfileChangeRequests, reviewProfileChangeRequest } from '../controllers/profileChangeController';
import { protect, authorize } from '../middlewares/auth';

const router = express.Router();

// All routes here are protected and restricted to Admin
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.get('/stats', getPlatformStats);
router.put('/verify/:id', verifyUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/requests', getAllRequests);
router.delete('/requests/:id', deleteRequest);

// Profile change requests
router.get('/profile-change-requests', getProfileChangeRequests);
router.post('/profile-change-requests/:id/review', reviewProfileChangeRequest);

export default router;
