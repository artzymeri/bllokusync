const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/database');
const db = require('./models');
const { runMigrations } = require('./utils/migrationRunner');
const paymentReminderScheduler = require('./schedulers/paymentReminder.scheduler');
const authRoutes = require('./routes/auth.routes');
const propertyRoutes = require('./routes/property.routes');
const userRoutes = require('./routes/user.routes');
const registerRequestRoutes = require('./routes/registerRequest.routes');
const cityRoutes = require('./routes/city.routes');
const problemOptionRoutes = require('./routes/problemOption.routes');
const reportRoutes = require('./routes/report.routes');
const complaintRoutes = require('./routes/complaint.routes');
const suggestionRoutes = require('./routes/suggestion.routes');
const tenantPaymentRoutes = require('./routes/tenantPayment.routes');
const spendingConfigRoutes = require('./routes/spendingConfig.routes');
const monthlyReportRoutes = require('./routes/monthlyReport.routes');
const tenantDashboardRoutes = require('./routes/tenantDashboard.routes');
const propertyManagerDashboardRoutes = require('./routes/propertyManagerDashboard.routes');
const paymentReminderRoutes = require('./routes/paymentReminder.routes');
const pushTokenRoutes = require('./routes/pushToken.routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://bllokusync.com',
      'https://www.bllokusync.com',
      process.env.FRONTEND_URL
    ].filter(Boolean)
  : ['http://localhost:3333', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection and sync
const initializeDatabase = async () => {
  await connectDB();

  // Run pending migrations first
  await runMigrations();

  // Sync all models with database
  // Changed from { alter: true } to { alter: false } to prevent index duplication
  // Use migrations for schema changes in production
  await db.sequelize.sync({ alter: false });
  console.log('Database synced successfully');
  
  // Start payment reminder scheduler
  paymentReminderScheduler.start();
};

initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/register-requests', registerRequestRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/problem-options', problemOptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/tenant-payments', tenantPaymentRoutes);
app.use('/api/spending-configs', spendingConfigRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);
app.use('/api/tenant-dashboard', tenantDashboardRoutes);
app.use('/api/property-manager-dashboard', propertyManagerDashboardRoutes);
app.use('/api/payment-reminders', paymentReminderRoutes);
app.use('/api/push-tokens', pushTokenRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Apartment Management API' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    message: 'Apartment Management API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      note: 'Most endpoints require authentication'
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    hint: req.path.includes('/api/auth/login')
      ? 'This endpoint requires a POST request, not GET. Use your login form or a tool like Postman/curl.'
      : 'Please check the API documentation for available endpoints.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
