import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './utils/dbInit';
import { connectRedis } from './config/redis';
import { createDatabaseIfNotExists } from './config/database';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

import userRoutes from './routes/userRoutes';
import bookRoutes from './routes/bookRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import newsRoutes from './routes/newsRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 12219;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:22191';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:22191'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Bookstore API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Bookstore API',
    endpoints: {
      users: '/api/users',
      books: '/api/books',
      cart: '/api/cart',
      orders: '/api/orders',
      news: '/api/news',
      admin: '/api/admin'
    }
  });
});

app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('=== Starting Bookstore Backend Server ===');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Port:', PORT);

    console.log('\n1. Checking/creating database...');
    try {
      await createDatabaseIfNotExists();
    } catch (error) {
      console.warn('⚠ Error checking database:', error);
    }

    console.log('\n2. Initializing database tables...');
    try {
      await initDatabase();
      console.log('✓ Database initialized successfully');
    } catch (dbError) {
      console.warn('⚠ Database initialization may have issues:', dbError);
      console.warn('⚠ Please ensure PostgreSQL is running and database "bookstore" exists');
      console.warn('⚠ You can create the database manually with: CREATE DATABASE bookstore;');
    }

    console.log('\n3. Connecting to Redis...');
    try {
      const redisClient = await connectRedis();
      if (redisClient) {
        console.log('✓ Redis connected successfully');
      } else {
        console.log('⚠ Redis not connected, running in degraded mode (cart will use DB only)');
      }
    } catch (redisError) {
      console.log('⚠ Redis connection failed, running in degraded mode');
    }

    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ API endpoint: http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`========================================`);
      console.log('\nDefault Admin Account:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
      console.log('\nFrontend URL:', FRONTEND_URL);
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
