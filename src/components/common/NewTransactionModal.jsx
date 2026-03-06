import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Upload,
  Layers,
  Check
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import { twMerge } from 'tailwind-merge';

const NewTransactionModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('expense');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal - Slide over from right */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8 overflow-y-auto animate-in slide-in-from-right duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">New Transaction</h2>
            <p className="text-xs text-gray-400 font-medium tracking-tight">Record a new expense or income</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Amount</label>
            <div className="relative group">
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-300 group-focus-within:text-brand-primary transition-colors">$</span>
               <input 
                 type="text" 
                 placeholder="0.00" 
                 className="w-full text-5xl font-extrabold text-gray-900 bg-gray-50/50 border-none rounded-2xl py-10 pl-16 pr-6 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none placeholder:text-gray-200"
               />
            </div>
          </div>

          {/* Type Toggle */}
          <div className="flex bg-gray-50 p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab('expense')}
               className={twMerge(
                 "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                 activeTab === 'expense' ? "bg-white text-brand-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
             >Expense</button>
             <button 
               onClick={() => setActiveTab('income')}
               className={twMerge(
                 "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                 activeTab === 'income' ? "bg-white text-brand-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
             >Income</button>
             <button 
               onClick={() => setActiveTab('transfer')}
               className={twMerge(
                 "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                 activeTab === 'transfer' ? "bg-white text-brand-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
             >Transfer</button>
          </div>

          {/* Category Select */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
             <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors">
                   <Layers size={18} />
                </div>
                <select className="input-standard appearance-none pl-12 h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-900 focus:bg-white pr-10">
                   <option>Select Category</option>
                   <option>Shopping</option>
                   <option>Dining</option>
                   <option>Food</option>
                   <option>Transport</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
             </div>
          </div>

          {/* Calendar Picker - Mock Photo 1 */}
          <div className="space-y-4">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Date</label>
             <div className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <button className="p-1 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronLeft size={18} /></button>
                   <h4 className="text-sm font-bold text-gray-900 leading-tight">October 2023</h4>
                   <button className="p-1 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronRight size={18} /></button>
                </div>
                {/* Calendar Grid Mock */}
                <div className="grid grid-cols-7 gap-y-4 text-center">
                   {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                     <span key={d} className="text-[10px] font-bold text-gray-300 uppercase">{d}</span>
                   ))}
                   {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                     <button 
                       key={d} 
                       className={twMerge(
                         "w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-colors mx-auto",
                         d === 5 ? "bg-brand-primary text-white shadow-md shadow-blue-100" : "text-gray-500 hover:bg-gray-50"
                       )}
                     >
                       {d}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
             <textarea 
               placeholder="What was this for?" 
               className="w-full h-32 input-standard bg-gray-50/50 border-gray-100 focus:bg-white p-4 resize-none"
             ></textarea>
          </div>

          {/* Attachment */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receipt Attachment</label>
             <div className="border-2 border-dashed border-gray-100 rounded-2xl p-10 flex flex-col items-center justify-center text-center group hover:border-brand-primary transition-all cursor-pointer bg-gray-50/30 hover:bg-blue-50/30">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-brand-primary transition-colors mb-4">
                   <Upload size={24} />
                </div>
                <p className="text-[11px] font-bold text-gray-900 mb-1">Upload Receipt</p>
                <p className="text-[10px] text-gray-400 font-medium">PNG, JPG or PDF up to 10MB</p>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
             <Button variant="secondary" className="flex-1 py-4 font-bold rounded-xl" onClick={onClose}>Cancel</Button>
             <Button className="flex-2 py-4 font-bold rounded-xl shadow-xl shadow-blue-200" onClick={onClose}>Save Transaction</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTransactionModal;
