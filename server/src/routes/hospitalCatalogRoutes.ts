import express from 'express';
import { getHospitalCatalog, searchHospitals } from '../controllers/hospitalCatalogController';

const router = express.Router();

router.get('/catalog', getHospitalCatalog);
router.get('/search', searchHospitals);

export default router;
