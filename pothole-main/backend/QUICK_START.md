# 🚀 Quick Start - Get MongoDB Running in 3 Steps

## Step 1: Create `.env` File

**Option A: Using the helper script (Easiest)**
```bash
cd server
node create-env.js
```
Enter your MongoDB Atlas password when prompted.

**Option B: Manual creation**
1. Open a text editor (Notepad, VS Code, etc.)
2. Create a new file
3. Copy and paste this content (replace `YOUR_PASSWORD` with your actual password):

```env
MONGO_URI=mongodb+srv://1by23cs002:YOUR_PASSWORD@cluster0.vdahqj1.mongodb.net/pothole-detection?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
FRONTEND_URL=http://localhost:3000
```

4. Save the file as `.env` in the `server/` folder
   - **Important:** Save as "All Files" type, not ".txt"
   - File name should be exactly `.env` (not `.env.txt`)

## Step 2: Whitelist Your IP in MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and sign in
2. Click **Network Access** (left sidebar)
3. Click **Add IP Address** button
4. Click **Allow Access from Anywhere** (for development)
   - Or click **Add Current IP Address** for better security
5. Click **Confirm**
6. Wait 1-2 minutes for changes to take effect

## Step 3: Start the Server

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

---

## ❌ Still Not Working?

### Check 1: Is `.env` file in the right place?
- Should be in: `server/.env`
- Same folder as `server/index.js`

### Check 2: Is your password correct?
- Go to MongoDB Atlas → Database Access
- Find user `1by23cs002`
- Reset password if needed

### Check 3: Is your IP whitelisted?
- MongoDB Atlas → Network Access
- Your IP should be in the list (or 0.0.0.0/0 for "anywhere")

### Check 4: What error are you seeing?
Run the server and check the error message:
```bash
cd server
npm run dev
```

Common errors:
- `authentication failed` → Wrong password
- `IP not whitelisted` → Add your IP in Network Access
- `.env file not found` → Create `.env` in server/ folder

---

## 📖 Need More Help?

See `server/MONGODB_FIX.md` for detailed troubleshooting.

