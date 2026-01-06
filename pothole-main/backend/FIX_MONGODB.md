# 🔧 MongoDB Connection Fix Guide

## Problem
Your server is showing: `MongooseServerSelectionError: connect ECONNREFUSED ::1:27017`

This means **MongoDB is not running** on your computer.

## Solution Options

### Option 1: Start MongoDB Locally (Windows)

#### Step 1: Check if MongoDB is Installed
Open Command Prompt (as Administrator) and run:
```bash
mongod --version
```

If you get an error, MongoDB is not installed. Skip to **Option 2** or install MongoDB Community Edition.

#### Step 2: Start MongoDB Service

**Method A: Using Services (Easiest)**
1. Press `Win + R` to open Run dialog
2. Type `services.msc` and press Enter
3. Find "MongoDB" in the list
4. Right-click → Start
5. Verify status changes to "Running"

**Method B: Using Command Prompt (as Administrator)**
```bash
net start MongoDB
```

**Method C: Start MongoDB Manually**
If MongoDB is installed but not as a service:
```bash
mongod --dbpath "C:\data\db"
```
(You may need to create the `C:\data\db` directory first)

### Option 2: Use MongoDB Atlas (Cloud - Recommended for Quick Setup)

This is the **easiest solution** if you don't have MongoDB installed.

#### Step 1: Create Free MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free" or "Sign Up"
3. Create a free account

#### Step 2: Create a Free Cluster
1. After signing in, click "Build a Database"
2. Choose "FREE" (M0) tier
3. Choose a cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to you
5. Click "Create Cluster" (takes 3-5 minutes)

#### Step 3: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

#### Step 4: Update Your .env File
1. Open `server/.env` file (create it if it doesn't exist)
2. Replace `MONGO_URI` with your Atlas connection string:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pothole-detection?retryWrites=true&w=majority
   ```
   **Important:** Replace `username` and `password` with your actual credentials!

3. Make sure to set up database access user in Atlas:
   - Go to "Database Access" in Atlas
   - Add a new database user
   - Create username and password
   - Use these in your connection string

4. Allow network access:
   - Go to "Network Access" in Atlas
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (or add your IP)

#### Step 5: Restart Your Server
```bash
cd server
npm run dev
```

### Option 3: Install MongoDB Community Edition (Windows)

If you want to use local MongoDB:

1. **Download MongoDB:**
   - Go to https://www.mongodb.com/try/download/community
   - Select Windows x64
   - Click Download

2. **Install MongoDB:**
   - Run the installer
   - Choose "Complete" installation
   - Check "Install MongoDB as a Service"
   - Keep default settings

3. **Start MongoDB:**
   - After installation, MongoDB should start automatically
   - Or use: `net start MongoDB` (as Administrator)

4. **Verify Installation:**
   ```bash
   mongod --version
   ```

## Verify MongoDB is Running

After starting MongoDB, verify it's working:

### Test Connection
Open a new terminal and run:
```bash
mongosh
```
If it connects, MongoDB is running! Type `exit` to quit.

### Check Service Status (Windows)
```bash
sc query MongoDB
```

## Quick Test

Once MongoDB is running, restart your backend server:
```bash
cd server
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
📊 Database: pothole-detection
🚀 Server running on http://localhost:5000
```

## Still Having Issues?

1. **Check if port 27017 is in use:**
   ```bash
   netstat -ano | findstr :27017
   ```

2. **Check MongoDB logs:**
   - Windows: `C:\Program Files\MongoDB\Server\<version>\log\mongod.log`

3. **Try different connection string:**
   - If `localhost` doesn't work, try `127.0.0.1`
   - Update `MONGO_URI` in `.env` to: `mongodb://127.0.0.1:27017/pothole-detection`

4. **Verify .env file exists:**
   - Make sure `server/.env` file exists
   - Should contain: `MONGO_URI=...`

## Recommended Solution

For development, I recommend **MongoDB Atlas (Option 2)** because:
- ✅ No installation needed
- ✅ Works immediately
- ✅ Free tier available
- ✅ Accessible from anywhere
- ✅ No configuration issues

Once you have MongoDB running (local or Atlas), your signup will work perfectly!

