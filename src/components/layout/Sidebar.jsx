import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  PieChart, 
  Settings, 
  LogOut,
  X,
  Sparkles,
  ShieldCheck,
  Banknote
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';

const SidebarItem = ({ icon: Icon, label, to, badge, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => twMerge(
      'flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm',
      isActive 
        ? 'bg-blue-50 text-brand-primary font-semibold shadow-sm shadow-blue-100/50' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    )}
  >
    <div className="flex items-center gap-3">
      {Icon && <Icon size={20} className="group-hover:text-brand-primary transition-colors" />}
      <span className="tracking-tight">{label}</span>
    </div>
    {badge && (
      <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase">
        {badge}
      </span>
    )}
  </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      onClose?.();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <aside 
      className={twMerge(
        'fixed inset-y-0 left-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col p-4 z-50 transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand & Mobile Close Button */}
      <div className="flex items-center justify-between px-2 py-3 mb-4">
        <Logo size="md" to="/dashboard" />

        {/* Close Button on Mobile */}
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto pt-2">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" onClick={onClose} />
        <SidebarItem icon={Receipt} label="Transactions" to="/transactions" onClick={onClose} />
        <SidebarItem icon={Banknote} label="Cash in Hand" to="/cash" onClick={onClose} />
        <SidebarItem icon={Wallet} label="Budgets" to="/budgets" onClick={onClose} />
        <SidebarItem icon={PieChart} label="Reports" to="/reports" onClick={onClose} />
        <SidebarItem icon={Settings} label="Settings" to="/settings" onClick={onClose} />
      </nav>

      {/* Cloud Security Indicator */}
      <div className="mt-auto mb-4 p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100/60">
        <div className="flex items-center gap-2 mb-1.5 text-brand-primary">
          <ShieldCheck size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Firebase Cloud</span>
        </div>
        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
          Your personal data is encrypted & synced across your devices.
        </p>
      </div>

      {/* User Info & Logout */}
      <div className="border-t border-gray-100 pt-3">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-danger hover:bg-red-50/50 rounded-xl transition-colors cursor-pointer group w-full text-left"
        >
          <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;