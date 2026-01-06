# 🔧 MongoDB Atlas Connection Fix - Step by Step

## Problem: MongoDB is not connecting

Since you're using **MongoDB Atlas** (cloud), you don't need to install MongoDB locally. The issue is likely one of these:

1. ❌ Missing `.env` file
2. ❌ Wrong password in connection string
3. ❌ IP address not whitelisted in MongoDB Atlas
4. ❌ Network/firewall issues

---

## ✅ Solution: Follow these steps

### Step 1: Create `.env` file in `server/` directory

1. Navigate to the `server` folder
2. Create a new file named `.env` (not `.env.txt`, just `.env`)
3. Copy this content into it:

```env
MONGO_URI=mongodb+srv://1by23cs002:YOUR_PASSWORD_HERE@cluster0.vdahqj1.mongodb.net/pothole-detection?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
FRONTEND_URL=http://localhost:3000
```

4. **Replace `YOUR_PASSWORD_HERE`** with your actual MongoDB Atlas database password

### Step 2: Get your MongoDB Atlas password

If you forgot your password:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign in with your account
3. Click on **Database Access** (left sidebar)
4. Find user `1by23cs002`
5. Click **Edit** → **Edit Password**
6. Either:
   - Use your existing password (if you remember it)
   - Or create a new password (click "Edit Password" → "Autogenerate Secure Password" or set your own)

### Step 3: Whitelist your IP address

**This is CRITICAL!** MongoDB Atlas blocks connections from IPs that aren't whitelisted.

1. In MongoDB Atlas dashboard, click **Network Access** (left sidebar)
2. Click **Add IP Address** button
3. You have two options:

   **Option A: Allow from anywhere (for development only):**
   - Click **Allow Access from Anywhere**
   - IP Address: `0.0.0.0/0`
   - ⚠️ **Warning:** Only use this for development/testing!

   **Option B: Add your current IP (recommended):**
   - Click **Add Current IP Address**
   - This automatically adds your current IP
   - Click **Confirm**

4. Wait 1-2 minutes for the change to take effect

### Step 4: Test the connection

1. Make sure your `.env` file has the correct password
2. Start your backend server:

```bash
cd server
npm run dev
```

3. Look for these messages:

✅ **Success:**
```
✅ MongoDB connected successfully
📊 Database: pothole-detection
🚀 Server running on http://localhost:5000
```

❌ **Error:** If you see connection errors, check the error message:
- `authentication failed` → Wrong password in `.env`
- `IP not whitelisted` → Add your IP in Network Access
- `timeout` → Check internet connection or increase timeout

### Step 5: Verify connection string format

Your connection string should look like this:
```
mongodb+srv://1by23cs002:ACTUAL_PASSWORD@cluster0.vdahqj1.mongodb.net/pothole-detection?retryWrites=true&w=majority&appName=Cluster0
```

**Important:**
- Replace `ACTUAL_PASSWORD` with your real password
- If your password has special characters, you may need to URL-encode them:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `%` becomes `%25`
  - `&` becomes `%26`
  - etc.

---

## 🧪 Quick Test

After setting up `.env`, test the connection:

```bash
cd server
node -e "require('dotenv').config(); console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ Missing')"
```

This will tell you if the `.env` file is being read correctly.

---

## 🐛 Common Issues & Fixes

### Issue 1: "authentication failed"
**Fix:** 
- Double-check your password in `.env`
- Make sure there are no extra spaces
- Try resetting the password in MongoDB Atlas

### Issue 2: "IP not whitelisted" or "connection timeout"
**Fix:**
- Go to MongoDB Atlas → Network Access
- Add your IP address (or use 0.0.0.0/0 for development)
- Wait 1-2 minutes

### Issue 3: "Cannot find module 'dotenv'"
**Fix:**
```bash
cd server
npm install
```

### Issue 4: ".env file not found"
**Fix:**
- Make sure the file is named exactly `.env` (not `.env.txt`)
- Make sure it's in the `server/` directory (same folder as `index.js`)
- On Windows, if you can't create `.env`, create it in a text editor and save as "All Files" type with name `.env`

### Issue 5: Password has special characters
**Fix:**
- URL-encode special characters in your password
- Or change your MongoDB password to one without special characters

---

## 📝 Checklist

Before running the server, make sure:

- [ ] `.env` file exists in `server/` directory
- [ ] `.env` contains `MONGO_URI` with your actual password
- [ ] Your IP address is whitelisted in MongoDB Atlas
- [ ] You've waited 1-2 minutes after whitelisting IP
- [ ] Backend dependencies are installed (`npm install` in server folder)

---

## 🆘 Still Not Working?

If you're still having issues:

1. **Check the exact error message** when you run `npm run dev`
2. **Verify your MongoDB Atlas cluster is running:**
   - Go to MongoDB Atlas dashboard
   - Check if your cluster shows "Running" status
3. **Test connection from MongoDB Atlas:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Compare it with your `.env` file

---

## ✅ Success Indicators

When everything is working, you should see:

```
✅ MongoDB connected successfully
📊 Database: pothole-detection
🚀 Server running on http://localhost:5000
📡 Health check: http://localhost:5000/health
```

Then you can test the API:
- Open browser: `http://localhost:5000/health`
- Should return: `{"status":"OK","message":"Server is running"}`

