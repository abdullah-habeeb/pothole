# 🎯 MongoDB Setup - Step by Step

## ✅ YOUR ISSUE: MongoDB Not Running

Your error shows: `connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017`

**This means MongoDB is not running on port 27017.**

---

## 🚀 QUICKEST FIX (Choose ONE):

### ✨ Option A: MongoDB Atlas (Cloud - Recommended - 5 minutes)

**Best for:** Quick setup, no installation needed

1. **Go to:** https://www.mongodb.com/cloud/atlas/register
2. **Sign up** for free account
3. **Create Free Cluster:**
   - Click "Build a Database"
   - Choose **FREE (M0)** tier
   - Choose any region (closest to you)
   - Click "Create Cluster"

4. **Set up Database User:**
   - Click "Database Access" (left menu)
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `potholeuser` (or any name)
   - Password: Create a strong password (save it!)
   - Click "Add User"

5. **Allow Network Access:**
   - Click "Network Access" (left menu)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

6. **Get Connection String:**
   - Click "Database" (left menu)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like):
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

7. **Update your `.env` file:**
   
   Open `server/.env` and replace with:
   ```env
   MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pothole-detection?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```
   
   **Important:** 
   - Replace `YOUR_USERNAME` with the username you created (step 4)
   - Replace `YOUR_PASSWORD` with the password you created (step 4)
   - Replace `cluster0.xxxxx` with your actual cluster address
   - Add `/pothole-detection` before the `?` in the connection string

8. **Restart your server:**
   ```bash
   cd server
   npm run dev
   ```

9. **You should see:**
   ```
   ✅ MongoDB connected successfully
   📊 Database: pothole-detection
   🚀 Server running on http://localhost:5000
   ```

10. **Test signup** at http://localhost:3000/signup - It works! ✅

---

### 💻 Option B: Local MongoDB (Windows)

**Best for:** Already have MongoDB installed

#### Check if MongoDB is installed:

1. Press `Win + R`
2. Type: `services.msc`
3. Press Enter
4. Look for "MongoDB" in the list

#### If MongoDB EXISTS:

1. **Start MongoDB Service:**
   - Find "MongoDB" in Services
   - Right-click → Start
   - Status should change to "Running"

2. **Verify .env file exists:**
   - Go to `server/.env`
   - Should contain:
     ```env
     MONGO_URI=mongodb://localhost:27017/pothole-detection
     JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
     PORT=5000
     FRONTEND_URL=http://localhost:3000
     ```

3. **Restart server:**
   ```bash
   cd server
   npm run dev
   ```

#### If MongoDB DOES NOT EXIST:

1. **Install MongoDB:**
   - Download: https://www.mongodb.com/try/download/community
   - Choose: Windows x64
   - Run installer
   - Choose "Complete" installation
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Check "Install MongoDB Compass" (optional GUI)
   - Click Install

2. **After installation:**
   - MongoDB will start automatically
   - Verify: Open Services (`services.msc`) and check "MongoDB" is running

3. **Verify .env file:**
   - Ensure `server/.env` exists with correct MONGO_URI (see above)

4. **Restart server:**
   ```bash
   cd server
   npm run dev
   ```

---

## ✅ VERIFICATION

### Check Server Logs:

After starting your server, you should see:
```
✅ MongoDB connected successfully
📊 Database: pothole-detection
🚀 Server running on http://localhost:5000
```

### Test MongoDB Connection:

Open a new terminal and run:
```bash
mongosh
```

If it connects successfully, MongoDB is working! Type `exit` to quit.

### Test Signup:

1. Go to http://localhost:3000/signup
2. Fill in the form:
   - Name: Your Name
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
3. Click "Sign up"
4. Should redirect to dashboard! ✅

---

## 🔍 TROUBLESHOOTING

### Still Getting Connection Error?

1. **Check if .env file exists:**
   ```bash
   cd server
   dir .env
   ```
   If not found, create it manually (copy from `env.example.txt`)

2. **Verify MongoDB is running:**
   - Windows: Open Services and check "MongoDB" status
   - Command: `sc query MongoDB`

3. **Check port 27017:**
   ```bash
   netstat -ano | findstr :27017
   ```
   Should show MongoDB listening

4. **Try different connection string:**
   - If `localhost` doesn't work, try `127.0.0.1`
   - Update `.env`: `MONGO_URI=mongodb://127.0.0.1:27017/pothole-detection`

5. **For Atlas (Cloud):**
   - Verify username and password are correct
   - Check Network Access allows 0.0.0.0/0
   - Verify connection string has database name: `/pothole-detection?`

---

## 📝 SUMMARY

**Your problem:** MongoDB is not running

**Solution:** 
- **Easiest:** Use MongoDB Atlas (Option A) - 5 minutes, no installation
- **If you have MongoDB:** Start the service (Option B)

**After fixing:** Your signup will work perfectly! 🎉

---

## 🆘 Still Need Help?

Check these files for more details:
- `server/QUICK_FIX.md` - Quick solutions
- `server/FIX_MONGODB.md` - Detailed troubleshooting
- `server/README.md` - Backend documentation

