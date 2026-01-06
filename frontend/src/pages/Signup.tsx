import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await signup(name, email, password);
      toast.success('Account created successfully! Please login.');
      navigate('/login');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create account. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50 to-surface-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-8 shadow-card bg-gradient-to-br from-primary-600 to-primary-500 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">
            Join the platform
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            Create your citizen or operator account in minutes.
          </h1>
          <p className="mt-4 text-white/80 text-sm">
            Use this portal to upload dashcam videos, monitor pothole remediation,
            and collaborate with local authorities for faster fixes.
          </p>
          <div className="mt-8 grid gap-4">
            {['Secure storage', 'Government-grade dashboard', 'Automatic alerts'].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1 text-lg">✅</span>
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-8 shadow-card bg-white">
          <div className="space-y-2 text-center">
            <p className="text-sm uppercase tracking-wide text-primary-500 font-semibold">
              Create account
            </p>
            <h2 className="text-2xl font-semibold text-ink-700">
              Start detecting potholes
            </h2>
            <p className="text-sm text-ink-400">
              Access the dashboard, upload videos, and receive remediation reports.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-ink-500">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-shadow"
                placeholder="Alex Roadway"
              />
            </div>

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
              <label htmlFor="password" className="text-sm font-medium text-ink-500">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 pr-10 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-shadow"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-ink-400 hover:text-primary-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-ink-400">
                Use a unique password to protect your infrastructure data.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white shadow-floating hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-500">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
