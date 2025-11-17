import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { authApi } from '../services/authApi';

interface GovernmentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GovernmentAuthModal = ({ isOpen, onClose, onSuccess }: GovernmentAuthModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hardcoded government credentials for prototype
  const GOVT_EMAIL = 'govt@admin.com';
  const GOVT_PASSWORD = 'admin123';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.governmentAuthorize(email.trim(), password);
      if (response.success && response.user) {
        toast.success('Government authorization successful');
        onSuccess();
        setEmail('');
        setPassword('');
        onClose();
      } else {
        toast.error(response.message || 'Invalid government credentials');
      }
    } catch (error) {
      toast.error('Failed to authorize government access');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md card shadow-card p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center text-2xl">
            🏛️
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-ink-700">Government Authorization</h2>
            <p className="text-sm text-ink-400 mt-1">
              Enter verified credentials to unlock government-only actions.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">
          <p className="font-medium">Demo credentials</p>
          <p className="text-xs mt-1">
            {GOVT_EMAIL} / {GOVT_PASSWORD}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="govt-email" className="text-sm font-medium text-ink-500">
              Email
            </label>
            <input
              id="govt-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-shadow"
              placeholder="govt@admin.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="govt-password" className="text-sm font-medium text-ink-500">
              Password
            </label>
            <div className="relative">
              <input
                id="govt-password"
                type={showPassword ? 'text' : 'password'}
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
            <p className="text-xs text-ink-400">Only authorized officials may proceed.</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-ink-500 border border-surface-200 rounded-lg hover:border-ink-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying…' : 'Authorize access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GovernmentAuthModal;

