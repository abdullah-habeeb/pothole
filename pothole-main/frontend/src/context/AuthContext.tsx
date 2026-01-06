import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../services/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await authApi.getMe();
          if (response.success && response.user) {
            setUser(response.user);
            setToken(storedToken);
          } else {
            // Invalid token, remove it
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    if (response.success && response.token && response.user) {
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await authApi.signup({ name, email, password });
    if (response.success && response.token && response.user) {
      // If signup returns token, store it (optional - user can login separately)
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
    } else if (!response.success) {
      throw new Error(response.message || 'Signup failed');
    }
  };

  const logout = async () => {
    await authApi.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    signup,
    logout,
    loading,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

