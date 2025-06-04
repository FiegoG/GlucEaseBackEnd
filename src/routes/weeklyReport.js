// routes/weeklyReport.js
const express = require('express');
const router = express.Router();
const dummyReportController = require('../controllers/dummyReportController');
const auth = require('../middleware/auth');

// Get latest weekly report (untuk ditampilkan di halaman utama)
router.get('/latest/:userId', auth, dummyReportController.getLatestWeeklyReport);

// Get weekly reports history (untuk melihat laporan sebelumnya)
router.get('/history/:userId', auth, dummyReportController.getWeeklyReportsHistory);

// Get specific weekly report by ID
router.get('/:userId/:reportId', auth, dummyReportController.getWeeklyReportById);

// Manual generate weekly report (untuk testing atau generate manual)
router.post('/generate/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const reportId = await dummyReportController.generateUserWeeklyReport(userId);
        
        res.json({
            success: true,
            message: 'Weekly report generated successfully',
            data: { reportId }
        });
    } catch (error) {
        console.error('Error generating manual weekly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating weekly report',
            error: error.message
        });
    }
});

module.exports = router;