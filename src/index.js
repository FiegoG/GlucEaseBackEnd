// src/index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');

const articleRoutes = require('./routes/article');
const sugarIntakeRoutes = require('./routes/sugarIntake');
const bloodSugarRoutes = require('./routes/bloodSugar');
const weeklyReportRoutes = require('./routes/weeklyReport');
const missionRoutes = require('./routes/mission');
const rewardRoutes = require('./routes/reward');
const consultationRoutes = require('./routes/consultation');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();
app.use(bodyParser.json());

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/articles', articleRoutes);
app.use('/api/sugar-tracker', sugarIntakeRoutes); 
app.use('/api/blood-sugar', bloodSugarRoutes); 
app.use('/api/weekly-report', weeklyReportRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'GlucEase API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan'
    });
});

// error handler sederhana
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
