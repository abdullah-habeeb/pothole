import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { authApi } from '../services/authApi';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminAuthModal = ({ isOpen, onClose, onSuccess }: AdminAuthModalProps) => {
  const [passkey, setPasskey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.adminAuthorize(passkey);
      if (response.success && response.user) {
        toast.success('Admin authorization successful');
        onSuccess();
        setPasskey('');
        onClose();
      } else {
        toast.error(response.message || 'Invalid admin passkey');
      }
    } catch (error) {
      toast.error('Failed to authorize admin access');
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
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center text-2xl">
            🔐
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-ink-700">Admin Authorization</h2>
            <p className="text-sm text-ink-400 mt-1">
              Secure the console by confirming the admin passkey.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="admin-passkey" className="text-sm font-medium text-ink-500">
              Admin Passkey
            </label>
            <input
              id="admin-passkey"
              type="password"
              required
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-shadow"
              placeholder="Enter admin passkey"
            />
            <p className="text-xs text-ink-400">
              Contact the platform owner if you do not have a passkey.
            </p>
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
              className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying…' : 'Authorize access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAuthModal;

