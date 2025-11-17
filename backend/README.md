# Pothole Detection Backend

Backend server for the Pothole Detection Platform with MongoDB authentication.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Create `.env` file:**
   Create a `.env` file in the `server` directory with the following:
   ```env
   MONGO_URI=mongodb://localhost:27017/pothole-detection
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Run the server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /auth/signup` - Register a new user
  - Body: `{ name, email, password }`
  
- `POST /auth/login` - Login user
  - Body: `{ email, password }` or `{ username, password }`
  
- `GET /auth/me` - Get current user (Protected)
  - Headers: `Authorization: Bearer <token>`
  
- `POST /auth/logout` - Logout user (Protected)
  - Headers: `Authorization: Bearer <token>`

## Environment Variables

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

