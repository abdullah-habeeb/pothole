#!/usr/bin/env node

/**
 * Test MongoDB Atlas connection
 * Run: node test-connection.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

console.log('\n🔍 Testing MongoDB Atlas Connection...\n');

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file!');
  console.error('   Make sure .env file exists in server/ directory');
  process.exit(1);
}

// Check if password placeholder is still there
if (MONGO_URI.includes('<db_password>')) {
  console.error('❌ Connection string still contains <db_password> placeholder!');
  console.error('   Replace <db_password> with your actual MongoDB Atlas password in .env file');
  process.exit(1);
}

console.log('✅ .env file found');
console.log(`📝 Connection string format: ${MONGO_URI.substring(0, 50)}...`);
console.log('\n⏳ Attempting to connect to MongoDB Atlas...\n');

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => {
    console.log('✅ SUCCESS! MongoDB connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log('\n🎉 Your MongoDB connection is working correctly!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed!\n');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting:\n');
    
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('1. ❌ Wrong password!');
      console.error('   → Check your password in .env file');
      console.error('   → Go to MongoDB Atlas → Database Access → Reset password if needed');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('2. ❌ IP address not whitelisted!');
      console.error('   → Go to MongoDB Atlas → Network Access');
      console.error('   → Click "Add IP Address" → "Allow Access from Anywhere"');
      console.error('   → Wait 1-2 minutes for changes to take effect');
    } else if (error.message.includes('timeout')) {
      console.error('3. ❌ Connection timeout!');
      console.error('   → Check your internet connection');
      console.error('   → Verify MongoDB Atlas cluster is running');
      console.error('   → Check if IP is whitelisted');
    } else {
      console.error('4. ❌ Other error - see details above');
    }
    
    console.error('\n📖 See server/MONGODB_FIX.md for detailed help\n');
    process.exit(1);
  });

