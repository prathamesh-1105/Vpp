const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Middleware imports
const tenantGuard = require('./middleware/tenant');

// Route imports
const authRouter = require('./routes/auth');
const timetableRouter = require('./routes/timetable');
const aiRouter = require('./routes/ai');
const careerRouter = require('./routes/career');
const navigationRouter = require('./routes/navigation');
const companionRouter = require('./routes/companion');
const analyticsRouter = require('./routes/analytics');
const recommendationsRouter = require('./routes/recommendations');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Register Global Middlewares
app.use(cors({
  origin: '*', // Allow all origins for dev/prototype access
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
}));
app.use(express.json());

// 2. Attach tenant boundary identifications globally
app.use(tenantGuard);

// 3. Mount Micro-Service Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/timetable', timetableRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/career', careerRouter);
app.use('/api/v1/navigation', navigationRouter);
app.use('/api/v1/companion', companionRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/recommendations', recommendationsRouter);

// 4. Default Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "CampusOS Multi-Tenant Node Server is active.",
    tenantContext: req.tenantId,
    timestamp: new Date().toISOString()
  });
});

// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "An unhandled server error occurred."
  });
});

// 6. Activate server listener port
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CampusOS API Backend active on port: ${PORT}`);
  console.log(`🌍 Default Tenancy isolated UUID contexts deployed.`);
  console.log(`🏫 Customized Branding: PVPPCOE Sion, Mumbai.`);
  console.log(`====================================================`);
});
