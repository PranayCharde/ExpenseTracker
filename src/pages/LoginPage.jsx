import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Wallet, ArrowRight, Eye, EyeOff, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState({ type: '', text: '' });
  const [resetLoading, setResetLoading] = useState(false);

  const { login, googleLogin, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Access temporarily disabled due to many failed attempts. Reset your password or try later.');
      } else {
        setError(err.message || 'Failed to sign in. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await googleLogin();
      navigate('/dashboard');
    } catch (err) {
      console.error("Google sign in error:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign in was cancelled or failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;

    setResetLoading(true);
    setResetStatus({ type: '', text: '' });

    try {
      await resetPassword(resetEmail);
      setResetStatus({ 
        type: 'success', 
        text: `Password reset link sent to ${resetEmail}. Check your inbox!` 
      });
    } catch (err) {
      setResetStatus({ 
        type: 'error', 
        text: err.message || 'Failed to send reset email.' 
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/70 p-4 font-sans">
      <div className="max-w-md w-full animate-in fade-in duration-500">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" to="/" showText={false} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Sign in to manage your smart ledger</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-danger text-xs font-bold border border-red-100 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle password view"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <button 
                type="button" 
                onClick={() => {
                  setResetEmail(email);
                  setResetStatus({ type: '', text: '' });
                  setResetModalOpen(true);
                }}
                className="text-brand-primary hover:underline ml-auto"
              >
                Forgot Password?
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3.5 rounded-xl font-bold shadow-lg shadow-blue-100" 
              disabled={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-white px-3 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign in with Google
          </button>

          <p className="text-center text-xs text-gray-500 font-medium mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-primary font-bold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setResetModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Reset Password</h3>
              <button onClick={() => setResetModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-900 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {resetStatus.text && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-bold border ${
                resetStatus.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-danger border-red-200'
              }`}>
                {resetStatus.text}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Registered Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <Button type="submit" disabled={resetLoading} className="w-full py-3 rounded-xl font-bold text-xs">
                {resetLoading ? 'Sending Link...' : 'Send Password Reset Link'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;