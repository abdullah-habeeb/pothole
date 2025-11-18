import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import UploadVideo from '../pages/UploadVideo';
import MapView from '../pages/MapView';
import Dashboard from '../pages/Dashboard';
import Admin from '../pages/Admin';
import AdminPanel from '../pages/AdminPanel';
import Assignments from '../pages/Assignments';
import Layout from '../components/Layout';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="upload" element={<UploadVideo />} />
          <Route path="map" element={<MapView />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admin" element={<Admin />} />
          <Route path="admin-panel" element={<AdminPanel />} />
          <Route path="assignments" element={<Assignments />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

