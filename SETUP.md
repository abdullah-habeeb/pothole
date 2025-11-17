# Quick Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (installed and running locally)
- npm or yarn

## Step-by-Step Setup

### 1. Backend Setup (Terminal 1)

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file (copy from env.example.txt)
# On Windows:
copy env.example.txt .env
# On Linux/Mac:
cp env.example.txt .env

# Edit .env file and update MongoDB URI if needed
# Default: mongodb://localhost:27017/pothole-detection

# Start MongoDB (if not already running)
# On Windows (if installed as service, it should auto-start)
# On Linux/Mac:
sudo systemctl start mongod
# OR
mongod

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### 2. Frontend Setup (Terminal 2)

```bash
# Navigate to project root
cd ..

# Install dependencies (if not already done)
npm install

# Start frontend dev server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 3. Testing the Authentication

1. Open `http://localhost:3000` in your browser
2. You'll be redirected to `/login` if not authenticated
3. Click "Sign up" to create a new account
4. Fill in:
   - Name
   - Email
   - Password (min. 6 characters)
   - Confirm Password
5. After signup, you'll be automatically logged in and redirected to dashboard
6. You can now access all protected routes

### 4. Creating a Government User

To create a government user with admin access, you can:

1. Use MongoDB Compass or MongoDB shell
2. Connect to your database
3. Navigate to the `users` collection
4. Update a user document and set `isGovernment: true`

Or use MongoDB shell:
```bash
mongosh pothole-detection
db.users.updateOne({ email: "your-email@example.com" }, { $set: { isGovernment: true } })
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or check service status
- Verify MongoDB URI in `.env` file
- Default port is 27017

### Port Already in Use
- Backend (5000): Change `PORT` in `server/.env`
- Frontend (3000): Vite will auto-select another port

### CORS Errors
- Ensure `FRONTEND_URL` in `server/.env` matches your frontend URL
- Default: `http://localhost:3000`

### JWT Token Issues
- Clear browser localStorage: `localStorage.clear()`
- Logout and login again

## API Testing

You can test the backend API using curl or Postman:

### Signup
```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Current User (Protected)
```bash
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

After successful authentication setup:
1. Your existing pothole detection features remain intact
2. All protected routes require authentication
3. Admin panel (`/admin`) requires government user flag
4. Continue building your pothole management features

