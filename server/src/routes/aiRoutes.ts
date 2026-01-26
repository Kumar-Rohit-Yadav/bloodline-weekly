import express, { Request, Response } from 'express';
import { analyzeSeverity } from '../services/aiService';
import { protect } from '../middlewares/auth';

const router = express.Router();

// @desc    Analyze blood request severity using AI
// @route   POST /api/ai/analyze-severity
// @access  Private
router.post('/analyze-severity', protect, async (req: Request, res: Response) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a description for analysis'
            });
        }

        const result = await analyzeSeverity(description);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message || 'AI Analysis failed'
        });
    }
});

export default router;
