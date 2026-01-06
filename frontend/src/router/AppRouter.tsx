import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RoleBasedGuard from '../components/RoleBasedGuard';
import Welcome from '../pages/Welcome';
import AuthHub from '../pages/AuthHub';
import GovWaiting from '../pages/GovWaiting';
import MapView from '../pages/MapView';
import Dashboard from '../pages/Dashboard';
import Assignments from '../pages/Assignments';
import Layout from '../components/Layout';
import UploadVideo from '../pages/UploadVideo';
import GovDashboard from '../pages/dashboards/GovDashboard';
import ContractorDashboard from '../pages/dashboards/ContractorDashboard';
import AdminDashboard from '../pages/dashboards/AdminDashboard';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<AuthHub />} />
        <Route path="/waiting" element={<GovWaiting />} />

        {/* Legacy redirects */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />

        {/* Protected Routes Wrapper */}
        <Route element={<Layout />}>

          {/* Citizen Routes */}
          <Route
            path="/dashboard"
            element={
              <RoleBasedGuard allowedRoles={['citizen', 'government', 'contractor', 'admin']}>
                <Dashboard />
              </RoleBasedGuard>
            }
          />

          <Route
            path="/dashboard/gov"
            element={
              <RoleBasedGuard allowedRoles={['government', 'admin']}>
                <GovDashboard />
              </RoleBasedGuard>
            }
          />

          <Route
            path="/dashboard/contractor"
            element={
              <RoleBasedGuard allowedRoles={['contractor', 'admin']}>
                <ContractorDashboard />
              </RoleBasedGuard>
            }
          />

          <Route
            path="/dashboard/admin"
            element={
              <RoleBasedGuard allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleBasedGuard>
            }
          />

          {/* Functional Use Cases */}
          <Route
            path="/upload"
            element={
              <RoleBasedGuard allowedRoles={['citizen', 'government', 'admin']}>
                <UploadVideo />
              </RoleBasedGuard>
            }
          />

          <Route
            path="/map"
            element={
              <RoleBasedGuard allowedRoles={['citizen', 'government', 'contractor', 'admin']}>
                <MapView />
              </RoleBasedGuard>
            }
          />

          <Route
            path="/assignments"
            element={
              <RoleBasedGuard allowedRoles={['government', 'admin']}>
                <Assignments />
              </RoleBasedGuard>
            }
          />

          <Route path="/admin-panel" element={<Navigate to="/dashboard/admin" replace />} />
          <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

