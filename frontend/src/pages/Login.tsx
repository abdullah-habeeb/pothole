import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (error: unknown) {
      let errorMessage = 'Invalid email or password';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      // Handle specific error cases
      if (errorMessage.includes('503') || errorMessage.includes('unavailable')) {
        errorMessage = 'Backend service is temporarily unavailable. Please try again in a moment.';
      } else if (errorMessage.includes('Network') || errorMessage.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on port 5000.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-surface-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-8 shadow-card bg-gradient-to-br from-white to-primary-50">
          <div className="flex items-center gap-3 text-primary-700">
            <span className="text-3xl">🕳️</span>
            <div>
              <p className="text-sm uppercase tracking-wide text-primary-500">
                Pothole Detection
              </p>
              <h1 className="text-2xl font-semibold">Smart Infrastructure Portal</h1>
            </div>
          </div>
          <ul className="mt-8 space-y-4 text-sm text-ink-500">
            <li className="flex items-start gap-3">
              <span className="text-primary-500 mt-1">•</span>
              Real-time pothole analytics for government agencies.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-500 mt-1">•</span>
              Upload dashcam videos and view detections instantly.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-500 mt-1">•</span>
              Secure admin workflows for contractor assignment.
            </li>
          </ul>
          <div className="mt-8 rounded-2xl bg-white/70 border border-surface-200 px-5 py-4">
            <p className="text-sm font-semibold text-ink-600">Need an account?</p>
            <p className="text-xs text-ink-400 mt-1">
              Reach out to infrastructure@city.gov to request access or{' '}
              <Link to="/signup" className="text-primary-600 font-medium">
                create a citizen account
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="card p-8 shadow-card">
          <div className="space-y-2 text-center">
            <p className="text-sm uppercase tracking-wide text-primary-500 font-semibold">
              Welcome back
            </p>
            <h2 className="text-2xl font-semibold text-ink-700">
              Sign in to continue
            </h2>
            <p className="text-sm text-ink-400">
              Use your registered email and password to access the dashboard.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink-500">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-shadow"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-ink-500">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 pr-10 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-shadow"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-ink-400 hover:text-primary-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white shadow-floating hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

