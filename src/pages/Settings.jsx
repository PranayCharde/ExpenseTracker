import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Settings as SettingsIcon, 
  LogOut, 
  Info,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile, updateEmail } from 'firebase/auth';

const SettingsItem = ({ icon: Icon, label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={twMerge(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
      active ? "bg-brand-primary text-white shadow-lg shadow-blue-100 dark:shadow-none" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    )}
  >
    <Icon size={20} />
    <span className="text-sm font-bold">{label}</span>
  </button>
);

const Settings = () => {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('GMT-5');
  const [darkMode, setDarkMode] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  
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
          setCurrency(data.currency || 'USD');
          setTimezone(data.timezone || 'GMT-5');
          setDarkMode(data.darkMode || false);
          setEmailAlerts(data.emailAlerts !== undefined ? data.emailAlerts : true);
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
      // Update Auth Profile if needed
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }
      if (email !== user.email) {
        await updateEmail(user, email);
      }

      // Update Firestore User Document using setDoc with merge
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        email,
        currency,
        timezone,
        darkMode,
        emailAlerts
      }, { merge: true });

      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleEmailAlerts = () => setEmailAlerts(!emailAlerts);

  if (fetching) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 text-left">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Settings</h1>
        <p className="text-gray-500 font-medium">Manage your account preferences and sync with cloud</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-2">
           <SettingsItem icon={User} label="Profile" active />
           <SettingsItem icon={Shield} label="Security" />
           <SettingsItem icon={Bell} label="Notifications" />
           <SettingsItem icon={SettingsIcon} label="Preferences" />
           
           <div className="h-px bg-gray-100 my-4"></div>
           
           <button 
             onClick={logout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-red-50 transition-all duration-200 group text-left"
           >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="text-sm font-bold">Sign Out</span>
           </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8">
           {/* Section 1: Personal Info */}
           <form onSubmit={handleUpdateProfile}>
            <Card className="relative overflow-visible">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-extrabold text-gray-900">Personal Information</h3>
                        <p className="text-xs text-gray-400 font-medium tracking-tight">Your data is securely stored in Firebase Firestore.</p>
                    </div>
                    <Button type="submit" className="rounded-xl px-8 shadow-md shadow-blue-100" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                {message.text && (
                  <div className={twMerge(
                    "mb-6 p-4 rounded-xl text-sm font-bold",
                    message.type === 'success' ? "bg-green-50 text-green-600" : "bg-red-50 text-danger"
                  )}>
                    {message.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Input 
                      label="Full Name" 
                      placeholder="Alex Johnson" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <Input 
                      label="Email Address" 
                      placeholder="alex.j@spendwise.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Base Currency</label>
                        <div className="relative">
                            <select 
                              value={currency}
                              onChange={(e) => setCurrency(e.target.value)}
                              className="input-standard appearance-none bg-gray-50/30 border-gray-100 focus:bg-white pr-10"
                            >
                                <option value="USD">USD - US Dollar ($)</option>
                                <option value="EUR">EUR - Euro (€)</option>
                                <option value="GBP">GBP - British Pound (£)</option>
                                <option value="INR">INR - Indian Rupee (₹)</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Timezone</label>
                        <div className="relative">
                            <select 
                              value={timezone}
                              onChange={(e) => setTimezone(e.target.value)}
                              className="input-standard appearance-none bg-gray-50/30 border-gray-100 focus:bg-white pr-10"
                            >
                                <option value="GMT-5">Eastern Standard Time (GMT-5)</option>
                                <option value="GMT-8">Pacific Standard Time (GMT-8)</option>
                                <option value="UTC">Universal Coordinated Time (UTC)</option>
                                <option value="GMT+5:30">India Standard Time (GMT+5:30)</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Section 2: Display Preferences */}
            <Card className="mt-8">
                <h3 className="text-lg font-extrabold text-gray-900 mb-6">Display & Alerts</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">Dark Mode</h4>
                        <p className="text-[11px] text-gray-400 font-medium">Switch between light and dark visual themes.</p>
                      </div>
                      <div 
                        onClick={toggleDarkMode}
                        className={twMerge(
                          "w-12 h-6 rounded-full relative cursor-pointer p-1 transition-colors duration-300",
                          darkMode ? "bg-brand-primary" : "bg-gray-200"
                        )}
                      >
                        <div className={twMerge(
                          "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                          darkMode ? "translate-x-6" : "translate-x-0"
                        )}></div>
                      </div>
                  </div>

                  <div className="h-px bg-gray-50"></div>

                  <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">Email Alerts</h4>
                        <p className="text-[11px] text-gray-400 font-medium">Receive weekly summaries of your spending.</p>
                      </div>
                      <div 
                        onClick={toggleEmailAlerts}
                        className={twMerge(
                          "w-12 h-6 rounded-full relative cursor-pointer p-1 transition-colors duration-300",
                          emailAlerts ? "bg-brand-primary" : "bg-gray-200"
                        )}
                      >
                        <div className={twMerge(
                          "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                          emailAlerts ? "translate-x-6" : "translate-x-0"
                        )}></div>
                      </div>
                  </div>
                </div>
            </Card>
           </form>

           {/* Section 3: Firebase Verification Box */}
           <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                 <Shield size={20} />
              </div>
              <div className="space-y-3">
                 <div>
                    <h4 className="text-sm font-bold text-blue-900 leading-tight">Database Connected</h4>
                    <p className="text-xs text-blue-700/70 font-medium leading-relaxed mt-1">
                       Your preferences are synchronized with Google Cloud Firestore. Settings will persist across all your sessions.
                    </p>
                 </div>
                 <button className="text-xs font-extrabold text-brand-primary flex items-center gap-1 group">
                    Learn more about security <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
           </div>
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-8">
         <p>© 2024 SpendWise Inc. All rights reserved. Secure bank-level encryption.</p>
         <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900">Security Terms</a>
            <a href="#" className="hover:text-gray-900">API Documentation</a>
         </div>
      </footer>
    </div>
  );
};

export default Settings;
