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
import { db, auth, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCurrency } from '../../hooks/useCurrency';

const NewTransactionModal = ({ isOpen, onClose }) => {
  const { symbol: CURRENCY_SYMBOL } = useCurrency();
  const [activeTab, setActiveTab] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Shopping');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Date Picker State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  if (!isOpen) return null;

  // Calendar Helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isSelected = (day) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === viewDate.getMonth() && 
           selectedDate.getFullYear() === viewDate.getFullYear();
  };

  const handleDateSelect = (day) => {
    setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    console.log("Starting handleSave...");
    if (!amount || isNaN(amount)) {
      alert("Please enter a valid amount.");
      return;
    }
    
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user found in handleSave");
        alert("You must be logged in to save transactions.");
        setLoading(false);
        return;
      }

      console.log("User authenticated:", user.uid);

      let receiptUrl = '';
      if (receiptFile) {
        console.log("Found receipt file, starting upload:", receiptFile.name);
        try {
          const fileRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${receiptFile.name}`);
          const snapshot = await uploadBytes(fileRef, receiptFile);
          receiptUrl = await getDownloadURL(snapshot.ref);
          console.log("File uploaded successfully, URL:", receiptUrl);
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          alert("Failed to upload the receipt photo. " + (uploadError.code === 'storage/unauthorized' ? "Permission denied." : "Check if Storage is enabled in your Firebase Console."));
          setLoading(false);
          return;
        }
      }

      console.log("Preparing transaction data...");
      const transactionData = {
        userId: user.uid,
        amount: parseFloat(amount) * (activeTab === 'expense' ? -1 : 1),
        type: activeTab,
        category,
        description,
        receiptUrl,
        date: selectedDate,
        createdAt: serverTimestamp(),
      };

      console.log("Adding document to Firestore subcollection...");
      const docRef = await addDoc(collection(db, 'users', user.uid, 'transactions'), transactionData);
      console.log("Document added with ID:", docRef.id);
      
      onClose();
      // Reset form
      setAmount('');
      setCategory('Shopping');
      setDescription('');
      setReceiptFile(null);
      setSelectedDate(new Date());
    } catch (error) {
      console.error('General error in handleSave:', error);
      alert("Error saving transaction: " + error.message);
    } finally {
      console.log("Finished handleSave attempt.");
      setLoading(false);
    }
  };

  const days = Array.from({ length: getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth()) }, (_, i) => i);

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
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-300 group-focus-within:text-brand-primary transition-colors">{CURRENCY_SYMBOL}</span>
               <input 
                 type="text" 
                 placeholder="0.00" 
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
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
                <select 
                  className="input-standard appearance-none pl-12 h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-900 focus:bg-white pr-10"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                   <option>Shopping</option>
                   <option>Dining</option>
                   <option>Food</option>
                   <option>Transport</option>
                   <option>Rent</option>
                   <option>Salary</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
             </div>
          </div>

          {/* Calendar Picker */}
          <div className="space-y-4">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Date</label>
             <div className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronLeft size={18} /></button>
                   <h4 className="text-sm font-bold text-gray-900 leading-tight">
                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                   </h4>
                   <button onClick={handleNextMonth} className="p-1 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronRight size={18} /></button>
                </div>
                <div className="grid grid-cols-7 gap-y-4 text-center">
                   {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                     <span key={`${d}-${i}`} className="text-[10px] font-bold text-gray-300 uppercase">{d}</span>
                   ))}
                   {emptyDays.map((_, i) => (
                     <div key={`empty-${i}`} />
                   ))}
                   {days.map(d => (
                     <button 
                       key={d} 
                       onClick={() => handleDateSelect(d)}
                       className={twMerge(
                         "w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-colors mx-auto",
                         isSelected(d) ? "bg-brand-primary text-white shadow-md shadow-blue-100" : "text-gray-500 hover:bg-gray-50"
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
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               className="w-full h-32 input-standard bg-gray-50/50 border-gray-100 focus:bg-white p-4 resize-none"
             ></textarea>
          </div>

          {/* Attachment */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receipt Attachment</label>
             <div 
               onClick={() => document.getElementById('receipt-upload').click()}
               className={twMerge(
                 "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center group transition-all cursor-pointer",
                 receiptFile ? "border-brand-primary bg-blue-50/30" : "border-gray-100 bg-gray-50/30 hover:border-brand-primary hover:bg-blue-50/30"
               )}
             >
                <input 
                  id="receipt-upload"
                  type="file" 
                  className="hidden" 
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
                <div className={twMerge(
                  "w-12 h-12 rounded-xl shadow-sm border flex items-center justify-center transition-colors mb-4",
                  receiptFile ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-gray-400 border-gray-100 group-hover:text-brand-primary"
                )}>
                   {receiptFile ? <Check size={24} /> : <Upload size={24} />}
                </div>
                <p className="text-[11px] font-bold text-gray-900 mb-1">
                  {receiptFile ? receiptFile.name : 'Upload Receipt'}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {receiptFile ? `${(receiptFile.size / 1024 / 1024).toFixed(2)} MB` : 'PNG, JPG or PDF up to 10MB'}
                </p>
                {receiptFile && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setReceiptFile(null);
                    }}
                    className="mt-4 text-[10px] font-bold text-danger uppercase tracking-widest hover:underline"
                  >Remove File</button>
                )}
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
             <Button variant="secondary" className="flex-1 py-4 font-bold rounded-xl" onClick={onClose} disabled={loading}>Cancel</Button>
             <Button 
               className="flex-2 py-4 font-bold rounded-xl shadow-xl shadow-blue-200" 
               onClick={handleSave}
               disabled={loading}
             >
               {loading ? 'Saving...' : 'Save Transaction'}
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTransactionModal;
