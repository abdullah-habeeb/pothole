# 🕳️ Pothole Detection Platform

A full-stack application for detecting and managing potholes with authentication, map visualization, and admin dashboard.

## 📁 Project Structure

```
pothole-detection-frontend/
├── frontend/                 # React + TypeScript frontend application
│   ├── src/                  # Source code
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context (Auth)
│   │   ├── services/        # API services
│   │   ├── router/          # React Router setup
│   │   └── utils/           # Utility functions
│   ├── index.html           # HTML entry point
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.ts       # Vite configuration
│   └── tsconfig.json        # TypeScript configuration
│
├── backend/                  # Node.js + Express backend
│   ├── auth/                # Authentication routes & controllers
│   ├── models/              # Mongoose models
│   ├── middleware/          # Express middleware
│   ├── routes/              # API routes
│   ├── index.js             # Server entry point
│   ├── package.json         # Backend dependencies
│   └── .env                 # Environment variables (create this)
│
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from env.example.txt)
# Edit .env and add your MongoDB Atlas connection string
# Replace <db_password> with your actual password

# Start the backend server
npm run dev
# or
npm start
```

The backend will run on `http://localhost:5000`

**Backend Environment Variables (.env):**
```env
MONGO_URI=mongodb+srv://1by23cs002:YOUR_PASSWORD@cluster0.vdahqj1.mongodb.net/pothole-detection?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📋 Available Scripts

### Backend (`backend/`)

- `npm start` - Start the production server
- `npm run dev` - Start the development server with auto-reload
- `npm run test-connection` - Test MongoDB Atlas connection
- `npm run create-env` - Interactive .env file creator

### Frontend (`frontend/`)

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Authentication

The application includes a complete authentication system:

- **Signup**: `POST /api/auth/signup`
- **Login**: `POST /api/auth/login`
- **Get Current User**: `GET /api/auth/me` (protected)

JWT tokens are stored in `localStorage` and automatically included in API requests.

### Protected Routes

The following routes require authentication:
- `/dashboard` - Dashboard page
- `/map` - Map view
- `/upload` - Upload video page
- `/admin` - Admin panel

Public routes:
- `/login` - Login page
- `/signup` - Signup page

## 🗄️ Database

The application uses **MongoDB Atlas** (cloud database). 

### Setting Up MongoDB Atlas

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create a database user
4. Whitelist your IP address (Network Access → Add IP Address)
5. Get your connection string
6. Update `MONGO_URI` in `backend/.env`

For detailed MongoDB setup instructions, see `backend/MONGODB_FIX.md`

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Leaflet** - Map component
- **Recharts** - Charts

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Health Check
- `GET /health` - Server health check

## 🔧 Development

### Running Both Servers

You need to run both frontend and backend servers simultaneously:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### API Proxy

The frontend is configured to proxy `/api/*` requests to `http://localhost:5000` via Vite's proxy configuration. This means:
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:5000`
- API calls from frontend automatically go to backend

## 📝 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB Atlas connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `PORT` | Server port | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend

The frontend uses Vite environment variables. Create `frontend/.env` if needed:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

1. **Check `.env` file exists** in `backend/` directory
2. **Verify password** in connection string
3. **Whitelist IP** in MongoDB Atlas → Network Access
4. **Test connection**: `cd backend && npm run test-connection`

See `backend/MONGODB_FIX.md` for detailed troubleshooting.

### Port Already in Use

If port 5000 or 3000 is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

### CORS Errors

Ensure `FRONTEND_URL` in `backend/.env` matches your frontend URL.

## 📚 Additional Documentation

- `backend/MONGODB_FIX.md` - MongoDB Atlas setup guide
- `backend/QUICK_START.md` - Quick MongoDB setup
- `AUTH_SETUP.md` - Authentication system documentation

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend server runs on `http://localhost:5000`
- [ ] Frontend server runs on `http://localhost:3000`
- [ ] MongoDB connection successful (check backend logs)
- [ ] Can access `/health` endpoint
- [ ] Can signup new user
- [ ] Can login with credentials
- [ ] Protected routes redirect to login when not authenticated
- [ ] Map page loads correctly
- [ ] Dashboard displays data

## 📄 License

ISC

## 👥 Author

Pothole Detection Platform

---

**Note**: Make sure both frontend and backend servers are running simultaneously for the application to work correctly.
