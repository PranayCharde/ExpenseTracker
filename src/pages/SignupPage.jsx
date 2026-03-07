import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Wallet, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to create an account. ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 font-sans">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary rounded-2xl text-white shadow-xl shadow-blue-100 ring-8 ring-blue-50 mb-6">
            <Wallet size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Join SpendWise</h1>
          <p className="text-gray-500 font-medium mt-2">Start your journey to financial freedom</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-danger text-xs font-bold p-4 rounded-xl border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input 
                label="Full Name"
                type="text"
                placeholder="Alex Johnson"
                icon={User}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input 
                label="Email Address"
                type="email"
                placeholder="mail@example.com"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input 
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-4 rounded-2xl font-bold shadow-lg shadow-blue-100" 
              disabled={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              {loading ? 'Creating Account...' : 'Get Started Now'}
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-white px-4 text-gray-400">Or join with</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={async () => {
                try {
                  setError('');
                  setLoading(true);
                  await googleLogin();
                  navigate('/dashboard');
                } catch (err) {
                  setError('Google signup failed.');
                  console.error(err);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl font-bold border-2 border-gray-50 flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-gray-700">Google Account</span>
            </button>
          </form>

          <div className="bg-gray-50/50 p-6 text-center border-t border-gray-100">
            <p className="text-sm font-medium text-gray-500">
              Already have an account? {' '}
              <Link to="/login" className="text-brand-primary font-bold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
