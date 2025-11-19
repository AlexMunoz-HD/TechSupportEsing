const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const assetsRoutes = require('./routes/assets');
const auditRoutes = require('./routes/audit');
const employeesRoutes = require('./routes/employees');
const onboardingRoutes = require('./routes/onboarding');
const offboardingRoutes = require('./routes/offboarding');
const preferencesRoutes = require('./routes/preferences');
const usersRoutes = require('./routes/users');
const jumpcloudRoutes = require('./routes/jumpcloud');
const { initializeDatabase } = require('./config/database');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:3003"],
    methods: ["GET", "POST"]
  }
});

// Trust proxy for rate limiting behind reverse proxy (Nginx)
app.set('trust proxy', true);

const PORT = process.env.PORT || 3001;

// Security middleware - configure helmet to allow images
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:3001", "http://localhost:3003"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:3003"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 1000) // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files - serve uploads directory (MUST be before the charset middleware)
const path = require('path');
const mime = require('mime-types');

app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath, stat) => {
    // Set correct Content-Type for images
    const contentType = mime.lookup(filePath);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    // Allow CORS for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath, stat) => {
    const contentType = mime.lookup(filePath);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Set charset to UTF-8 for JSON responses only (skip for static files)
app.use((req, res, next) => {
  // Skip charset header for static files (images, etc.)
  if (req.path.startsWith('/api/uploads/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/offboarding', offboardingRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/jumpcloud', jumpcloudRoutes);
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/documents', require('./routes/signature'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Dashboard API available at http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });
