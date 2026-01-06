#!/usr/bin/env node

/**
 * Helper script to create .env file for MongoDB Atlas connection
 * Run: node create-env.js
 */

import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createEnvFile() {
  console.log('\n🔧 MongoDB Atlas .env File Creator\n');
  console.log('This will help you create the .env file with your MongoDB Atlas credentials.\n');

  const password = await question('Enter your MongoDB Atlas password: ');
  
  if (!password || password.trim() === '') {
    console.error('\n❌ Password cannot be empty!');
    rl.close();
    process.exit(1);
  }

  // URL encode the password in case it has special characters
  const encodedPassword = encodeURIComponent(password.trim());

  const envContent = `# MongoDB Atlas Connection String
MONGO_URI=mongodb+srv://1by23cs002:${encodedPassword}@cluster0.vdahqj1.mongodb.net/pothole-detection?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret Key (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
`;

  const envPath = path.join(__dirname, '.env');

  try {
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
      const overwrite = await question('\n⚠️  .env file already exists. Overwrite? (y/n): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('\n❌ Cancelled. .env file not created.');
        rl.close();
        return;
      }
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('\n✅ .env file created successfully!');
    console.log(`📁 Location: ${envPath}`);
    console.log('\n⚠️  IMPORTANT: Make sure to whitelist your IP in MongoDB Atlas:');
    console.log('   1. Go to MongoDB Atlas → Network Access');
    console.log('   2. Click "Add IP Address" → "Allow Access from Anywhere" (for development)');
    console.log('   3. Or add your current IP address');
    console.log('\n🚀 Now you can start the server with: npm run dev\n');
  } catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
    process.exit(1);
  }

  rl.close();
}

createEnvFile();

