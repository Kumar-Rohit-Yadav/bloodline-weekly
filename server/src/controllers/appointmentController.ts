import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import User from '../models/User';

export const createAppointment = async (req: Request, res: Response) => {
    try {
        const { hospitalId, bloodType, scheduledAt, notes } = req.body;

        // Verify hospital exists
        const hospital = await User.findById(hospitalId);
        if (!hospital || hospital.role !== 'hospital') {
            return res.status(404).json({ success: false, error: 'Hospital not found' });
        }

        const appointment = await Appointment.create({
            donor: (req as any).user.id,
            hospital: hospitalId,
            bloodType,
            scheduledAt,
            notes
        });

        res.status(201).json({ success: true, data: appointment });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getMyAppointments = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;

        let query = {};
        if (role === 'donor') {
            query = { donor: userId };
        } else if (role === 'hospital') {
            query = { hospital: userId };
        }

        const appointments = await Appointment.find(query)
            .populate('donor', 'name profileImage location')
            .populate('hospital', 'name facilityName location address')
            .sort({ scheduledAt: 1 });

        res.status(200).json({ success: true, data: appointments });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        // REALISM CHECK: Only allow status change to 'Confirmed' if scheduled time has passed
        if (status === 'Confirmed') {
            const now = new Date();
            const scheduledTime = new Date(appointment.scheduledAt);
            if (now < scheduledTime) {
                return res.status(400).json({
                    success: false,
                    error: `Cannot confirm appointment before the scheduled time (${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                });
            }
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json({ success: true, data: appointment });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const deleteAppointment = async (req: Request, res: Response) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        const userId = (req as any).user.id;

        // Both donor and hospital involved can cancel
        if (appointment.donor.toString() !== userId && appointment.hospital.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'Not authorized to cancel this appointment' });
        }

        await appointment.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
