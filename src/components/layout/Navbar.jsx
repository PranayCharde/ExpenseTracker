import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Menu, 
  Settings as SettingsIcon, 
  LogOut, 
  Moon, 
  Sun, 
  CheckCircle2, 
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { settings, toggleDarkMode } = useSettings();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <nav className="h-18 sm:h-20 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 transition-all">
      {/* Left: Mobile Menu Toggle & Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full group">
          <Search 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors" 
            size={18} 
          />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions, categories..." 
            className="w-full bg-gray-50/80 border border-transparent rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 transition-all"
          />
        </form>
      </div>

      {/* Right: Quick actions, notifications, user avatar */}
      <div className="flex items-center gap-2 sm:gap-4 ml-3">
        {/* Dark Mode Quick Toggle */}
        <button
          onClick={toggleDarkMode}
          title={settings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 sm:p-2.5 text-gray-500 hover:bg-gray-50 hover:text-brand-primary rounded-xl transition-colors"
        >
          {settings.darkMode ? <Sun size={19} className="text-amber-500" /> : <Moon size={19} />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setNotificationsOpen(prev => !prev)}
            className="p-2 sm:p-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl relative transition-colors"
            aria-label="View notifications"
          >
            <Bell size={19} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full ring-2 ring-white"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-88 max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
                <span className="text-[10px] font-bold bg-blue-50 text-brand-primary px-2 py-0.5 rounded-full uppercase">Recent</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Cloud Sync Active</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Real-time sync with Google Firebase is connected.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Budget Tracker Ready</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Set monthly limits to keep your expenses on target.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-gray-200 hidden sm:block"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setProfileOpen(prev => !prev)}
            className="flex items-center gap-2.5 hover:bg-gray-50 p-1.5 sm:p-2 rounded-xl transition-all"
            aria-expanded={profileOpen}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-100 ring-2 ring-blue-50">
              {userInitial}
            </div>
            <div className="text-left hidden md:block">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                {userDisplayName}
              </h4>
              <p className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
                {user?.email}
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-400 transition-transform duration-200 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-56 max-w-xs bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 border-b border-gray-100 md:hidden">
                <p className="text-xs font-bold text-gray-900">{userDisplayName}</p>
                <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <SettingsIcon size={16} className="text-gray-400" />
                  Account Settings
                </button>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-danger hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;