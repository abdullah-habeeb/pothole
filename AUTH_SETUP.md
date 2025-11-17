# MongoDB Authentication System - Setup Guide

## ✅ Implementation Complete

The authentication system has been fully implemented with:
- ✅ Backend: Node.js + Express with MongoDB Atlas
- ✅ Frontend: React + TypeScript with Login and Signup pages
- ✅ JWT token storage in localStorage
- ✅ ProtectedRoute wrapper for authenticated pages
- ✅ Logout functionality in navbar

## 📁 Updated Folder Structure

```
pothole-detection-frontend/
├── server/
│   ├── auth/
│   │   ├── auth.controller.js      # Signup, Login, GetMe endpoints
│   │   ├── auth.middleware.js       # JWT authentication middleware
│   │   ├── auth.model.js            # Re-exports User model
│   │   └── auth.routes.js           # Auth route definitions
│   ├── models/
│   │   └── User.js                  # User Mongoose model (name, email, password)
│   ├── middleware/
│   │   └── auth.js                  # Alternative auth middleware
│   ├── index.js                     # Main server file with MongoDB connection
│   ├── package.json                 # Backend dependencies
│   └── env.example.txt              # Environment variables template
├── src/
│   ├── pages/
│   │   ├── Login.tsx                 # Login page
│   │   └── Signup.tsx                # Signup page
│   ├── context/
│   │   └── AuthContext.tsx          # Authentication context provider
│   ├── components/
│   │   ├── ProtectedRoute.tsx       # Route protection wrapper
│   │   └── Layout.tsx                # Navbar with logout button
│   ├── services/
│   │   ├── authApi.ts               # Auth API calls
│   │   └── apiClient.ts             # Axios client with token interceptor
│   └── router/
│       └── AppRouter.tsx             # Routes with ProtectedRoute applied
├── vite.config.ts                    # Vite config with API proxy
└── package.json                      # Frontend dependencies
```

## 🚀 Setup Instructions

### Step 1: Backend Setup

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Create `.env` file in the `server` directory:**
   ```bash
   # Copy the example file
   cp env.example.txt .env
   ```

4. **Edit `.env` file and replace `<db_password>` with your actual MongoDB Atlas password:**
   ```env
   MONGO_URI=mongodb+srv://1by23cs002:YOUR_ACTUAL_PASSWORD@cluster0.vdahqj1.mongodb.net/pothole-detection?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

   The server should start on `http://localhost:5000` and connect to MongoDB Atlas.

### Step 2: Frontend Setup

1. **Navigate to the root directory (if not already there):**
   ```bash
   cd ..
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

   The frontend should start on `http://localhost:3000`.

## 🔐 Authentication Flow

### Signup Flow:
1. User fills out form (name, email, password)
2. Frontend calls `POST /api/auth/signup`
3. Backend validates, hashes password, saves user
4. User redirected to login page

### Login Flow:
1. User enters email and password
2. Frontend calls `POST /api/auth/login`
3. Backend validates credentials
4. JWT token returned and stored in localStorage
5. User redirected to dashboard

### Protected Routes:
- `/dashboard` - Protected
- `/map` - Protected
- `/upload` - Protected
- `/admin` - Protected
- `/login` - Public
- `/signup` - Public

## 🧪 Testing the System

1. **Start both servers:**
   - Backend: `cd server && npm run dev`
   - Frontend: `npm run dev` (in root directory)

2. **Test Signup:**
   - Navigate to `http://localhost:3000/signup`
   - Fill in name, email, and password (min 6 characters)
   - Submit form
   - Should redirect to login page

3. **Test Login:**
   - Navigate to `http://localhost:3000/login`
   - Enter email and password from signup
   - Submit form
   - Should redirect to dashboard

4. **Test Protected Routes:**
   - Try accessing `http://localhost:3000/dashboard` without logging in
   - Should redirect to login page
   - After login, should access dashboard successfully

5. **Test Logout:**
   - Click "Logout" button in navbar
   - Should clear token and redirect to login

## 🔧 API Endpoints

### Public Endpoints:
- `POST /api/auth/signup` - Register new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### Protected Endpoints (require Bearer token):
- `GET /api/auth/me` - Get current user info

## 📝 Important Notes

1. **MongoDB Atlas Password:** Make sure to replace `<db_password>` in the `.env` file with your actual MongoDB Atlas password.

2. **JWT Secret:** Change the `JWT_SECRET` in production to a secure random string.

3. **CORS:** The backend is configured to accept requests from `http://localhost:3000`. Update `FRONTEND_URL` in `.env` if your frontend runs on a different port.

4. **Token Storage:** JWT tokens are stored in `localStorage` and automatically included in API requests via the `apiClient` interceptor.

5. **Password Hashing:** Passwords are automatically hashed using bcryptjs before saving to the database.

## 🐛 Troubleshooting

### MongoDB Connection Issues:
- Verify your MongoDB Atlas password is correct
- Check that your IP address is whitelisted in MongoDB Atlas
- Ensure the connection string format is correct

### Authentication Issues:
- Check browser console for errors
- Verify backend server is running on port 5000
- Check that the JWT token is being stored in localStorage
- Verify API proxy is working in `vite.config.ts`

### CORS Issues:
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that backend CORS middleware is configured correctly

## ✅ System Status

All components are implemented and ready to use:
- ✅ User model with password hashing
- ✅ Signup endpoint with validation
- ✅ Login endpoint with JWT generation
- ✅ Protected routes middleware
- ✅ Frontend login/signup pages
- ✅ Auth context for state management
- ✅ ProtectedRoute component
- ✅ Logout functionality
- ✅ Token storage and automatic inclusion in requests

