import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Settings as SettingsIcon, 
  LogOut, 
  Check, 
  AlertCircle,
  Lock,
  Mail,
  Moon,
  Sun,
  Globe,
  Clock,
  Sparkles
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

const CURRENCY_OPTIONS = [
  { code: 'INR', name: 'Indian Rupee (₹)', symbol: '₹' },
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
  { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar (CA$)', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar (A$)', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen (¥)', symbol: '¥' }
];

const TIMEZONE_OPTIONS = [
  { value: 'GMT+5:30', label: 'India Standard Time (IST) GMT+5:30' },
  { value: 'GMT-8', label: 'Pacific Time (US & Canada) GMT-8' },
  { value: 'GMT-5', label: 'Eastern Time (US & Canada) GMT-5' },
  { value: 'GMT+0', label: 'London, UTC GMT+0' },
  { value: 'GMT+1', label: 'Central European Time GMT+1' },
  { value: 'GMT+8', label: 'Singapore, Beijing GMT+8' },
  { value: 'GMT+9', label: 'Tokyo, Japan GMT+9' }
];

const Settings = () => {
  const { user, logout, resetPassword, changePassword } = useAuth();
  
  // Tab state: 'profile', 'security', 'preferences', 'notifications'
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('GMT+5:30');
  const [darkMode, setDarkMode] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Security tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status message
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDisplayName(data.displayName || user.displayName || '');
          setCurrency(data.currency || 'INR');
          setTimezone(data.timezone || 'GMT+5:30');
          setDarkMode(data.darkMode || false);
          setEmailAlerts(data.emailAlerts !== undefined ? data.emailAlerts : true);
          setWeeklyDigest(data.weeklyDigest !== undefined ? data.weeklyDigest : true);
        }
      } catch (err) {
        console.error("Error fetching user settings:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }

      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        currency,
        timezone,
        darkMode,
        emailAlerts,
        weeklyDigest
      }, { merge: true });

      setMessage({ type: 'success', text: 'Profile & preferences saved to cloud successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error("Password change error:", err);
      setMessage({ 
        type: 'error', 
        text: err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Incorrect current password.' 
          : err.message || 'Failed to update password.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      setMessage({ type: 'success', text: `A password reset link has been sent to ${user.email}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to send reset email.' });
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-brand-primary border-t-transparent"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Account & App Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
          Customize your profile, base currency, security credentials, and app preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Navigation Tabs */}
        <div className="lg:col-span-3 space-y-1.5 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          {[
            { id: 'profile', label: 'Profile Information', icon: User },
            { id: 'preferences', label: 'Currency & Display', icon: SettingsIcon },
            { id: 'security', label: 'Security & Password', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage({ type: '', text: '' });
                }}
                className={twMerge(
                  "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs sm:text-sm font-bold text-left",
                  active 
                    ? "bg-brand-primary text-white shadow-md shadow-blue-100" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="h-px bg-gray-100 my-2" />

          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-danger hover:bg-red-50 text-xs sm:text-sm font-bold transition-all text-left"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-9 space-y-6">
          {message.text && (
            <div className={twMerge(
              "p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in",
              message.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-danger border border-red-200"
            )}>
              {message.type === 'success' ? <Check size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* TAB 1: Profile Information */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile}>
              <Card className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 mb-6 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Personal Profile</h3>
                    <p className="text-xs text-gray-400 font-medium">Your identity information across the application</p>
                  </div>
                  <Button type="submit" disabled={loading} className="rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-100 self-start sm:self-auto">
                    {loading ? 'Saving Changes...' : 'Save Profile'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Display Name</label>
                    <input 
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full px-4 py-3 bg-gray-100/70 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400">Authenticated with Firebase Auth</p>
                  </div>
                </div>
              </Card>
            </form>
          )}

          {/* TAB 2: Preferences (Currency, Timezone, Dark Mode) */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleUpdateProfile}>
              <Card className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Currency & Regional Preferences</h3>
                    <p className="text-xs text-gray-400 font-medium">Format currency symbols and time stamps correctly</p>
                  </div>
                  <Button type="submit" disabled={loading} className="rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-100 self-start sm:self-auto">
                    {loading ? 'Saving Preferences...' : 'Save Preferences'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Currency Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Base Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      {CURRENCY_OPTIONS.map(opt => (
                        <option key={opt.code} value={opt.code}>{opt.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-400">All charts, budgets, and ledgers format using this currency.</p>
                  </div>

                  {/* Timezone Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      {TIMEZONE_OPTIONS.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dark Mode Toggle */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Dark Theme</p>
                    <p className="text-xs text-gray-400">Reduce eye strain with dark interface styling</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setDarkMode(!darkMode)}
                    className={twMerge(
                      "w-12 h-6.5 rounded-full transition-colors relative focus:outline-none p-1",
                      darkMode ? "bg-brand-primary" : "bg-gray-200"
                    )}
                  >
                    <div className={twMerge(
                      "w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm",
                      darkMode ? "translate-x-5.5" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </Card>
            </form>
          )}

          {/* TAB 3: Security & Password */}
          {activeTab === 'security' && (
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="pb-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Security Credentials</h3>
                <p className="text-xs text-gray-400 font-medium">Protect your personal account with strong credentials</p>
              </div>

              {/* Password Change Form */}
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                  <input 
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                  <input 
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
                  <input 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <Button type="submit" disabled={loading} className="rounded-xl text-xs font-bold px-6">
                  {loading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>

              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Forgot Password or Need a Link?</h4>
                  <p className="text-xs text-gray-400">Receive a secure Firebase password reset email</p>
                </div>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleSendResetEmail}
                  className="rounded-xl text-xs font-bold"
                >
                  Send Reset Link
                </Button>
              </div>
            </Card>
          )}

          {/* TAB 4: Notifications */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleUpdateProfile}>
              <Card className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Notification Alerts</h3>
                    <p className="text-xs text-gray-400 font-medium">Control which alerts and emails you receive</p>
                  </div>
                  <Button type="submit" disabled={loading} className="rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-100 self-start sm:self-auto">
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Budget Limit Warning Alerts</p>
                      <p className="text-xs text-gray-400">Notify when expenses reach 80% or 100% of established limits</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEmailAlerts(!emailAlerts)}
                      className={twMerge(
                        "w-12 h-6.5 rounded-full transition-colors relative focus:outline-none p-1",
                        emailAlerts ? "bg-brand-primary" : "bg-gray-200"
                      )}
                    >
                      <div className={twMerge(
                        "w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm",
                        emailAlerts ? "translate-x-5.5" : "translate-x-0"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Weekly Summary Digest</p>
                      <p className="text-xs text-gray-400">Receive a weekly breakdown of savings and cash flow</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setWeeklyDigest(!weeklyDigest)}
                      className={twMerge(
                        "w-12 h-6.5 rounded-full transition-colors relative focus:outline-none p-1",
                        weeklyDigest ? "bg-brand-primary" : "bg-gray-200"
                      )}
                    >
                      <div className={twMerge(
                        "w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm",
                        weeklyDigest ? "translate-x-5.5" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                </div>
              </Card>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;