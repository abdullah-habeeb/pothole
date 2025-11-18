import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import GovernmentAuthModal from './GovernmentAuthModal';
import AdminAuthModal from './AdminAuthModal';
import { govRequestApi } from '../services/govRequestApi';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [showGovtModal, setShowGovtModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Check for pending government request
  const { data: govRequest } = useQuery({
    queryKey: ['myGovRequest'],
    queryFn: govRequestApi.getMyRequest,
    enabled: !!user && !user.isGovernmentAuthorized,
    refetchInterval: 30000, // Check every 30 seconds
  });

  const govRequestStatus = govRequest?.request?.status;
  const hasPendingRequest = govRequestStatus === 'pending';
  const isGovAuthorized = user?.isGovernmentAuthorized || false;
  const isAdmin = user?.isAdmin || false;

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
    { path: '/upload', label: 'Upload', icon: '📤' },
    { path: '/map', label: 'Map', icon: '🗺️' },
    ...(isGovAuthorized ? [{ path: '/assignments', label: 'Assignments', icon: '📋' }] : []),
    ...(isAdmin ? [{ path: '/admin-panel', label: 'Admin Panel', icon: '🔐' }] : []),
    { path: '/admin', label: 'Admin', icon: '⚙️' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-shell">
      <div className="bg-white/90 backdrop-blur border-b border-surface-200 shadow-subtle sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="sm:hidden p-2 rounded-lg border border-surface-200 text-ink-500 hover:text-primary-600 hover:border-primary-200 transition-colors"
                onClick={() => setIsMobileNavOpen((prev) => !prev)}
                aria-label="Toggle navigation"
              >
                <span className="block w-5 border-t-2 border-current mb-1" />
                <span className="block w-4 border-t-2 border-current" />
              </button>
              <Link to="/dashboard" className="flex items-center gap-2 text-xl font-semibold text-primary-700">
                <span className="text-2xl">🕳️</span>
                <span>Pothole Detection</span>
              </Link>
              <div className="hidden sm:flex items-center gap-1 ml-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-ink-500 hover:text-primary-600 hover:bg-surface-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                    ✅ Admin Authorized
                  </span>
                )}
                {isGovAuthorized && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                    ✅ Government Authorized
                  </span>
                )}
                {hasPendingRequest && !isGovAuthorized && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100">
                    ⏳ Government Request Pending
                  </span>
                )}
                {!isGovAuthorized && !hasPendingRequest && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                    ❌ Government Unauthorized
                  </span>
                )}
              </div>

              <div className="hidden md:flex items-center gap-2">
                {isGovAuthorized && (
                  <Link
                    to="/assignments"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Gov Panel
                  </Link>
                )}
                {!isGovAuthorized && !hasPendingRequest && (
                  <button
                    onClick={() => setShowGovtModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Request Gov Access
                  </button>
                )}
                {isAdmin && (
                  <Link
                    to="/admin-panel"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                {!isAdmin && (
                  <button
                    onClick={() => setShowAdminModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Admin Authorization
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 pl-3 border-l border-surface-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-ink-700 leading-tight">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-ink-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium text-ink-500 border border-surface-200 rounded-lg hover:text-primary-600 hover:border-primary-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile nav */}
          {isMobileNavOpen && (
            <div className="sm:hidden pb-4 border-t border-surface-200">
              <nav className="flex flex-col gap-1 pt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-ink-500 hover:bg-surface-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                {isGovAuthorized && (
                  <Link
                    to="/assignments"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium text-center"
                  >
                    Gov Panel
                  </Link>
                )}
                {!isGovAuthorized && !hasPendingRequest && (
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setShowGovtModal(true);
                    }}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium"
                  >
                    Request Gov Access
                  </button>
                )}
                {isAdmin && (
                  <Link
                    to="/admin-panel"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium text-center"
                  >
                    Admin Panel
                  </Link>
                )}
                {!isAdmin && (
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setShowAdminModal(true);
                    }}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium"
                  >
                    Admin Authorization
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>

      <main className="relative">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary-50/80 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <Outlet />
        </div>
      </main>

      <GovernmentAuthModal
        isOpen={showGovtModal}
        onClose={() => setShowGovtModal(false)}
        onSuccess={async () => {
          await refreshUser();
          // Refetch request status
          setTimeout(() => {
            window.location.reload();
          }, 1000);
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

