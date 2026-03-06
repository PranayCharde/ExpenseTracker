import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions, bills..." 
            className="w-full bg-gray-50/50 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl relative transition-colors group">
          <Bell size={20} className="group-hover:shake" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white"></span>
        </button>

        <div className="h-8 w-[1px] bg-gray-100"></div>

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-xl transition-all">
          <div className="text-right">
            <h4 className="text-sm font-bold text-gray-900 leading-tight group-hover:text-brand-primary transition-colors">Alex Morgan</h4>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Personal Account</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-indigo-400 p-0.5">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" 
              alt="Avatar" 
              className="w-full h-full rounded-full bg-white object-cover shadow-inner"
            />
          </div>
          <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
