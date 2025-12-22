import express from 'express';
import { getRecommendedRequests, getNearbyDonors } from '../controllers/matchController';
import { protect, authorize } from '../middlewares/auth';

const router = express.Router();

router.use(protect);

router.get('/requests', authorize('donor'), getRecommendedRequests);
router.get('/donors/:requestId', authorize('hospital', 'admin'), getNearbyDonors);

export default router;
