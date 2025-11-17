import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import GovernmentAuthModal from './GovernmentAuthModal';
import AdminAuthModal from './AdminAuthModal';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [showGovtModal, setShowGovtModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/upload', label: 'Upload Video', icon: '📤' },
    { path: '/map', label: 'Map View', icon: '🗺️' },
    { path: '/admin', label: 'Admin Panel', icon: '⚙️' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="text-2xl font-bold text-primary-600">
                  🕳️ Pothole Detection
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user?.isAdmin && (
                <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium">
                  🔐 Admin
                </div>
              )}
              {user?.isGovernmentAuthorized ? (
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                  🏛️ Government Authorized
                </div>
              ) : (
                <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                  🏛️ Government Unauthorized
                </div>
              )}
              <button
                onClick={() => setShowGovtModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
              >
                {user?.isGovernmentAuthorized ? 'Government Panel' : 'Government Authorization'}
              </button>
              {!user?.isAdmin && (
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 transition-colors"
                >
                  Admin Authorization
                </button>
              )}
              <span className="text-sm text-gray-700">
                {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <GovernmentAuthModal
        isOpen={showGovtModal}
        onClose={() => setShowGovtModal(false)}
        onSuccess={async () => {
          await refreshUser();
        }}
      />
      <AdminAuthModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={async () => {
          await refreshUser();
        }}
      />
    </div>
  );
};

export default Layout;

