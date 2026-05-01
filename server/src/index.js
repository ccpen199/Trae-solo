require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 8765;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"]
    }
  }
}));

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8766',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

const userRoutes = require('./routes/users');
const questionRoutes = require('./routes/questions');
const answerRoutes = require('./routes/answers');
const knowledgeRoutes = require('./routes/knowledge');
const archiveRoutes = require('./routes/archives');

app.use('/api/v1/users', strictLimiter, userRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/answers', answerRoutes);
app.use('/api/v1/knowledge', knowledgeRoutes);
app.use('/api/v1/archives', archiveRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'qa-community-api',
      version: '1.0.0'
    }
  });
});

app.get('/api/v1/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'QA Community API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      mongodbUri: process.env.MONGODB_URI ? 'configured' : 'not configured',
      redisUrl: process.env.REDIS_URL ? 'configured' : 'not configured',
      rabbitmqUrl: process.env.RABBITMQ_URL ? 'configured' : 'not configured',
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8766',
      timestamp: new Date().toISOString()
    }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  const statusCode = error.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  QA Community API Server`);
      console.log(`========================================`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Port: ${PORT}`);
      console.log(`  CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:8766'}`);
      console.log(`========================================`);
      console.log(`  API Endpoints:`);
      console.log(`  - GET  /health`);
      console.log(`  - GET  /api/v1/status`);
      console.log(`  - POST /api/v1/users/register`);
      console.log(`  - POST /api/v1/users/login`);
      console.log(`  - GET  /api/v1/users/me`);
      console.log(`  - GET  /api/v1/questions`);
      console.log(`  - POST /api/v1/questions`);
      console.log(`  - GET  /api/v1/knowledge/search`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

module.exports = app;
