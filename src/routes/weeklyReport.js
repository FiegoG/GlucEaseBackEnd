// routes/weeklyReport.js
const express = require('express');
const router = express.Router();
const weeklyReportController = require('../controllers/weeklyReportController');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

// Get weekly sugar intake summary
router.get('/sugar-intake/:userId', auth, weeklyReportController.getWeeklySugarIntake);

// Get weekly blood sugar summary  
router.get('/blood-sugar/:userId', auth, weeklyReportController.getWeeklyBloodSugar);

// Generate AI analysis for sugar intake
router.get('/analysis/sugar-intake/:userId', auth, weeklyReportController.generateSugarIntakeAnalysis);

// Generate AI analysis for blood sugar
router.get('/analysis/blood-sugar/:userId', auth, weeklyReportController.generateBloodSugarAnalysis);

// Get complete weekly report
router.get('/complete/:userId', auth, weeklyReportController.getCompleteWeeklyReport);

module.exports = router;