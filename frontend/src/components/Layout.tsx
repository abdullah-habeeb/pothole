import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  // Define nav items based on role
  const getNavItems = () => {
    const items = [];
    const role = user?.role;

    // Common items
    if (role === 'citizen') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/map', label: 'Map', icon: '🗺️' },
        { path: '/upload', label: 'Upload', icon: '📤' },
      );
    } else if (role === 'government') {
      items.push(
        { path: '/dashboard/gov', label: 'Dashboard', icon: '📊' },
        { path: '/map', label: 'Map', icon: '🗺️' },
        { path: '/assignments', label: 'Assignments', icon: '📋' },
      );
    } else if (role === 'contractor') {
      items.push(
        { path: '/dashboard/contractor', label: 'Assignments', icon: '📋' },
        { path: '/map', label: 'Map', icon: '🗺️' },
      );
    } else if (role === 'admin') {
      items.push(
        { path: '/dashboard/admin', label: 'Admin Dashboard', icon: '🔐' },
        { path: '/map', label: 'Map', icon: '🗺️' },
        { path: '/upload', label: 'Upload (All)', icon: '📤' },
        { path: '/assignments', label: 'Assignments', icon: '📋' },
      );
    }

    return items;
  };

  const navItems = getNavItems();
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
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
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
                {user?.role && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize 
                        ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      user.role === 'government' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        user.role === 'contractor' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          'bg-gray-50 text-gray-700 border-gray-100'
                    }`}>
                    {user.role} Account
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pl-3 border-l border-surface-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-ink-700 leading-tight">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-ink-400 capitalize">{user?.role}</p>
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-ink-500 hover:bg-surface-100'
                      }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
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
    </div>
  );
};

export default Layout;
