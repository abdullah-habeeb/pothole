import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './auth/auth.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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

// Start server first (don't wait for MongoDB)
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api/auth/*`);
});

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // Increased timeout for Atlas connection
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch((error) => {
    console.error('\n❌ MongoDB connection error:', error.message);
    console.error('\n🔧 MongoDB Atlas Troubleshooting:');
    console.error('1. Check if .env file exists in backend/ directory');
    console.error('2. Verify MONGO_URI in .env has your actual password (replace <db_password>)');
    console.error('3. Whitelist your IP in MongoDB Atlas:');
    console.error('   - Go to MongoDB Atlas → Network Access');
    console.error('   - Click "Add IP Address" → "Allow Access from Anywhere" (for dev)');
    console.error('   - Or add your current IP address');
    console.error('4. Verify your MongoDB Atlas cluster is running');
    console.error('5. Check if password has special characters (may need URL encoding)');
    console.error(`\n💡 Connection string format: mongodb+srv://USERNAME:PASSWORD@cluster...`);
    if (MONGO_URI.includes('<db_password>')) {
      console.error('\n⚠️  WARNING: Connection string still contains <db_password> placeholder!');
      console.error('   → Create .env file in backend/ directory with your actual password');
    }
    console.error('\n📖 See backend/MONGODB_FIX.md for detailed instructions\n');
    console.error('⚠️  Server is running but authentication routes will not work until MongoDB is connected\n');
  });

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

