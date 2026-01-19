import express from 'express';
import { protect } from '../middlewares/auth';
import { createAppointment, getMyAppointments, updateAppointmentStatus, deleteAppointment } from '../controllers/appointmentController';

const router = express.Router();

router.use(protect); // All appointment routes are protected

router.post('/', createAppointment);
router.get('/me', protect, getMyAppointments);
router.put('/:id/status', protect, updateAppointmentStatus);
router.delete('/:id', protect, deleteAppointment);

export default router;
