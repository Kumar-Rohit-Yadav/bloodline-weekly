import { Request, Response } from 'express';
import VerifiedHospital from '../models/VerifiedHospital';

// @desc    Get all verified hospitals in the catalog
// @route   GET /api/hospitals/catalog
// @access  Public
export const getHospitalCatalog = async (req: Request, res: Response) => {
    try {
        const hospitals = await VerifiedHospital.find({}).sort('name');
        res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Search hospitals by name
// @route   GET /api/hospitals/search?name=...
// @access  Public
export const searchHospitals = async (req: Request, res: Response) => {
    try {
        const { name } = req.query;
        const query = name ? { name: { $regex: name, $options: 'i' } } : {};
        const hospitals = await VerifiedHospital.find(query).sort('name');
        res.status(200).json({ success: true, data: hospitals });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
