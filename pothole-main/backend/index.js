import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './auth/auth.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import potholeRoutes from './routes/pothole.routes.js';
import govRequestRoutes from './routes/govRequest.routes.js';
import contractorAssignmentRoutes from './routes/contractorAssignment.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS with better error handling
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:3001', 'http://localhost:3000']
  : ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/potholes', potholeRoutes);
app.use('/api/gov-requests', govRequestRoutes);
app.use('/api/contractor-assignments', contractorAssignmentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    mongodb: isMongoConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    message: 'API is running',
    mongodb: isMongoConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check environment variables (remove in production)
if (process.env.NODE_ENV === 'development') {
  app.get('/debug/env', (req, res) => {
    res.json({
      hasMongoUri: !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      port: process.env.PORT,
      frontendUrl: process.env.FRONTEND_URL,
      mongoUriPreview: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 30) + '...' : 'not set'
    });
  });
}

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://1by23cs002:<db_password>@cluster0.vdahqj1.mongodb.net/pothole-detection?retryWrites=true&w=majority&appName=Cluster0';

// Helper to check MongoDB connection
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Start server first (don't wait for MongoDB)
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
});

// Connect to MongoDB with retry logic
const connectMongoDB = async () => {
  try {
    if (MONGO_URI.includes('<db_password>')) {
      console.warn('\n⚠️  WARNING: MONGO_URI contains placeholder. Using fallback connection.');
      console.warn('   → Create .env file in backend/ directory with your actual MONGO_URI');
      return;
    }
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('\n❌ MongoDB connection error:', error.message);
    console.error('\n🔧 MongoDB Atlas Troubleshooting:');
    console.error('1. Check if .env file exists in backend/ directory');
    console.error('2. Verify MONGO_URI in .env has your actual password');
    console.error('3. Whitelist your IP in MongoDB Atlas → Network Access');
    console.error('4. Verify your MongoDB Atlas cluster is running');
    console.error('\n⚠️  Server is running but some routes may not work until MongoDB is connected\n');
    
    // Retry connection after 30 seconds
    setTimeout(() => {
      console.log('🔄 Retrying MongoDB connection...');
      connectMongoDB();
    }, 30000);
  }
};

// Initial connection attempt
connectMongoDB();

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app;

