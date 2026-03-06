import React from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Settings as SettingsIcon, 
  LogOut, 
  Info,
  ChevronRight,
  Globe,
  CircleHelp
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { twMerge } from 'tailwind-merge';

const SettingsItem = ({ Icon, label, active = false }) => ( // eslint-disable-line no-unused-vars
  <button className={twMerge(
    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
    active ? "bg-brand-primary text-white shadow-lg shadow-blue-100" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
  )}>
    <Icon size={20} />
    <span className="text-sm font-bold">{label}</span>
  </button>
);

const Settings = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 text-left">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Settings</h1>
        <p className="text-gray-500 font-medium">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-2">
           <SettingsItem Icon={User} label="Profile" active />
           <SettingsItem Icon={Shield} label="Security" />
           <SettingsItem Icon={Bell} label="Notifications" />
           <SettingsItem Icon={SettingsIcon} label="Preferences" />
           
           <div className="h-px bg-gray-100 my-4"></div>
           
           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-red-50 transition-all duration-200 group">
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="text-sm font-bold">Sign Out</span>
           </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8">
           {/* Section 1: Personal Info */}
           <Card className="relative overflow-visible">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-lg font-extrabold text-gray-900">Personal Information</h3>
                    <p className="text-xs text-gray-400 font-medium tracking-tight">Update your public profile and contact details.</p>
                 </div>
                 <Button className="rounded-xl px-8 shadow-md shadow-blue-100">Save Changes</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <Input label="Full Name" placeholder="Alex Johnson" />
                 <Input label="Email Address" placeholder="alex.j@spendwise.com" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Base Currency</label>
                    <div className="relative">
                       <select className="input-standard appearance-none bg-gray-50/30 border-gray-100 focus:bg-white pr-10">
                          <option>USD - US Dollar ($)</option>
                          <option>EUR - Euro (€)</option>
                          <option>GBP - British Pound (£)</option>
                       </select>
                       <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                 </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Timezone</label>
                    <div className="relative">
                       <select className="input-standard appearance-none bg-gray-50/30 border-gray-100 focus:bg-white pr-10">
                          <option>Eastern Standard Time (GMT-5)</option>
                          <option>Pacific Standard Time (GMT-8)</option>
                          <option>Universal Coordinated Time (UTC)</option>
                       </select>
                       <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                 </div>
              </div>
           </Card>

           {/* Section 2: Display Preferences */}
           <Card>
              <h3 className="text-lg font-extrabold text-gray-900 mb-6">Display Preferences</h3>
              
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <h4 className="text-sm font-bold text-gray-900 leading-tight">Dark Mode</h4>
                       <p className="text-[11px] text-gray-400 font-medium">Switch between light and dark visual themes.</p>
                    </div>
                    <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer p-1 transition-colors">
                       <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                 </div>

                 <div className="h-px bg-gray-50"></div>

                 <div className="flex items-center justify-between">
                    <div>
                       <h4 className="text-sm font-bold text-gray-900 leading-tight">Email Alerts</h4>
                       <p className="text-[11px] text-gray-400 font-medium">Receive weekly summaries of your spending.</p>
                    </div>
                    <div className="w-12 h-6 bg-brand-primary rounded-full relative cursor-pointer p-1 transition-colors">
                       <div className="w-4 h-4 bg-white rounded-full shadow-sm ml-auto"></div>
                    </div>
                 </div>
              </div>
           </Card>

           {/* Section 3: Profile Completeness - Info Box */}
           <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                 <Info size={20} />
              </div>
              <div className="space-y-3">
                 <div>
                    <h4 className="text-sm font-bold text-blue-900 leading-tight">Profile Completeness</h4>
                    <p className="text-xs text-blue-700/70 font-medium leading-relaxed mt-1">
                       Your profile is 85% complete. Connect your bank account to unlock advanced data visualization and automated tracking.
                    </p>
                 </div>
                 <button className="text-xs font-extrabold text-brand-primary flex items-center gap-1 group">
                    Complete Profile <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
