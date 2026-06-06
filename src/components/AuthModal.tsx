import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signin') {
        const data = await api.login(email, password);
        onSuccess(data.user);
        onClose();
      } else if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name');
        const data = await api.register(email, password, name);
        onSuccess(data.user);
        onClose();
      } else {
        const data = await api.requestPasswordReset(email);
        setSuccessMsg(data.message);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md p-8 bg-white border border-neutral-100 shadow-2xl rounded-2xl z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 rounded-full transition-colors"
          aria-label="Close modal"
          id="btn-close-auth"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 font-sans">
            {mode === 'signin' && 'Sign In to NILS'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {mode === 'signin' && 'Access your orders, wishlist, and reviews.'}
            {mode === 'signup' && 'Join for a premium guest checkout and full history.'}
            {mode === 'forgot' && 'Provide your email in order to retrieve credentials.'}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 text-sm transition-all"
                  placeholder="e.g., Alexander Nils"
                  id="input-name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 text-sm transition-all"
                placeholder="you@example.com"
                id="input-email"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-neutral-500 hover:text-emerald-800 underline underline-offset-2"
                    id="btn-trigger-forgot"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 text-sm transition-all"
                  placeholder="••••••••"
                  id="input-password"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1b3b2b] hover:bg-[#12281d] text-white font-medium rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            id="btn-auth-submit"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : null}
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Send Reset Password Instructions'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-500 space-y-2">
          {mode === 'signin' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-medium text-emerald-800 hover:underline cursor-pointer"
                id="btn-goto-signup"
              >
                Sign up now
              </button>
            </p>
          )}

          {(mode === 'signup' || mode === 'forgot') && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-medium text-emerald-800 hover:underline cursor-pointer"
                id="btn-goto-signin"
              >
                Sign in here
              </button>
            </p>
          )}

          <p className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Secure encryption. Seed accounts available for simple testing.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
