import express from 'express';
import { getInventory, updateInventory, getMyRequests, getPublicInventory, logManualDonation, generateMissionQR } from '../controllers/hospitalController';
import { protect, authorize } from '../middlewares/auth';

const router = express.Router();

router.use(protect);

// Publicly available to all logged-in users
router.get('/public-inventory', getPublicInventory);

// Hospital only routes
router.get('/inventory', authorize('hospital'), getInventory);
router.put('/inventory', authorize('hospital'), updateInventory);
router.get('/my-requests', authorize('hospital'), getMyRequests);
router.post('/log-donation', authorize('hospital'), logManualDonation);
router.get('/generate-qr/:requestId', authorize('hospital'), generateMissionQR);

export default router;
