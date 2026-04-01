import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  PieChart, 
  Settings, 
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SidebarItem = ({ Icon, label, to, badge }) => ( // eslint-disable-line no-unused-vars
  <NavLink
    to={to}
    className={({ isActive }) => twMerge(
      'flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group',
      isActive 
        ? 'bg-blue-50 text-brand-primary font-semibold shadow-sm shadow-blue-100/50' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    )}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className="group-hover:text-brand-primary transition-colors" />
      <span className="text-sm tracking-tight">{label}</span>
    </div>
    {badge && (
      <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase">
        {badge}
      </span>
    )}
  </NavLink>
);

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col p-4 z-40">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-6 mb-4">
        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50">
          <Wallet size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">SpendWise</h1>
          <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">Smart Tracking</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        <SidebarItem Icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
        <SidebarItem Icon={Receipt} label="Transactions" to="/transactions" />
        <SidebarItem Icon={Wallet} label="Budgets" to="/budgets" />
        <SidebarItem Icon={PieChart} label="Reports" to="/reports" />
        <SidebarItem Icon={Settings} label="Settings" to="/settings" />
      </nav>

      {/* Upgrade Card - as seen in Photo 7 */}
      {/* <div className="mt-auto mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-20 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
          <Sparkles className="text-brand-primary" size={48} />
        </div>
        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Pro Plan</h4>
        <p className="text-[11px] text-blue-700 font-medium leading-relaxed mb-4">Get advanced analytics and insights.</p>
        <button className="w-full py-2 bg-brand-primary text-white text-[11px] font-bold rounded-lg shadow-md shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-wider">
          Upgrade Now
        </button>
      </div> */}

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-danger transition-colors cursor-pointer group w-full text-left"
      >
        <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    </aside>
  );
};

export default Sidebar;
