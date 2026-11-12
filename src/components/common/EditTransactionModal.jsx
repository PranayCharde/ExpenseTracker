import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Upload, 
  Layers, 
  Trash2,
  FileText,
  AlertCircle,
  Eye,
  Camera,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import Button from '../common/Button';
import { twMerge } from 'tailwind-merge';
import { db, auth, storage } from '../../firebase';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCurrency } from '../../hooks/useCurrency';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/constants';
import { compressReceiptImage } from '../../utils/receiptHelper';
import { format } from 'date-fns';

const EditTransactionModal = ({ isOpen, onClose, transaction, onTransactionUpdated }) => {
  const { symbol: CURRENCY_SYMBOL } = useCurrency();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Shopping');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  
  // Receipt management
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Prepopulate form when transaction changes
  useEffect(() => {
    if (isOpen && transaction) {
      const isIncome = transaction.amount > 0;
      const tab = isIncome ? 'income' : 'expense';
      setActiveTab(tab);
      setAmount(Math.abs(transaction.amount).toString());
      setDescription(transaction.description || '');

      // Parse date
      let parsedDate = new Date();
      if (transaction.parsedDate instanceof Date && !isNaN(transaction.parsedDate)) {
        parsedDate = transaction.parsedDate;
      } else if (transaction.date?.toDate) {
        parsedDate = transaction.date.toDate();
      } else if (transaction.date) {
        parsedDate = new Date(transaction.date);
      }
      setDateStr(format(parsedDate, 'yyyy-MM-dd'));

      // Category matching
      const currentList = tab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      const txCategory = transaction.category || '';

      if (currentList.includes(txCategory) && txCategory !== 'Other') {
        setCategory(txCategory);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(txCategory === 'Other' ? '' : txCategory);
      }

      // Receipt
      setExistingReceiptUrl(transaction.receiptUrl || null);
      setReceiptPreview(transaction.receiptUrl || null);
      setReceiptFile(null);
      setRemoveReceipt(false);
      setErrorMessage('');
      setUploadStatus('');
    }
  }, [isOpen, transaction]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const currentList = tab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (category !== 'Other' && !currentList.includes(category)) {
      setCategory(tab === 'income' ? 'Salary' : 'Shopping');
    }
  };

  const processSelectedFile = (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Receipt file size must be less than 10MB.');
      return;
    }

    setReceiptFile(file);
    setRemoveReceipt(false);
    setErrorMessage('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setExistingReceiptUrl(null);
    setRemoveReceipt(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setDateStr(d.toISOString().split('T')[0]);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount.');
      return;
    }

    const user = auth.currentUser;
    if (!user || !transaction?.id) {
      setErrorMessage('User session or transaction identifier not found.');
      return;
    }

    if (category === 'Other' && !customCategory.trim()) {
      setErrorMessage('Please specify your custom category.');
      return;
    }

    setLoading(true);

    try {
      let finalReceiptUrl = existingReceiptUrl;

      if (removeReceipt) {
        finalReceiptUrl = null;
      } else if (receiptFile) {
        setUploadStatus('Processing new receipt...');

        let base64Fallback = null;
        try {
          base64Fallback = await compressReceiptImage(receiptFile, 1200, 0.8);
        } catch (compErr) {
          console.warn("Compression warning, using direct preview", compErr);
          base64Fallback = receiptPreview;
        }

        setUploadStatus('Uploading receipt to cloud...');
        try {
          const safeName = receiptFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${safeName}`);
          const snapshot = await uploadBytes(fileRef, receiptFile);
          finalReceiptUrl = await getDownloadURL(snapshot.ref);
        } catch (storageErr) {
          console.warn("Cloud Storage error; using local/base64 backup to ensure receipt is saved:", storageErr);
          finalReceiptUrl = base64Fallback;
        }
      }

      setUploadStatus('Updating ledger record...');

      const [year, month, day] = dateStr.split('-').map(Number);
      const transactionDate = new Date(year, month - 1, day, 12, 0, 0);

      const isExpense = activeTab === 'expense';
      const finalAmount = isExpense ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

      const finalCategory = (category === 'Other' && customCategory.trim()) 
        ? customCategory.trim() 
        : category.trim();

      const updateData = {
        amount: finalAmount,
        type: activeTab,
        category: finalCategory,
        description: description.trim() || finalCategory,
        receiptUrl: finalReceiptUrl,
        date: Timestamp.fromDate(transactionDate),
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'users', user.uid, 'transactions', transaction.id), updateData);

      onTransactionUpdated?.();
      onClose();
    } catch (err) {
      console.error('Error updating transaction:', err);
      setErrorMessage(err.message || 'Failed to update transaction.');
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  if (!isOpen || !transaction) return null;

  const currentCategories = activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto z-10 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between pb-5 border-b border-gray-100 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
              <Edit3 size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                Edit Transaction
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Update record in your personal cloud ledger
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-danger text-xs font-bold flex items-center gap-2 border border-red-100">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5 flex-1 flex flex-col">
          {/* Type Toggle */}
          <div className="flex bg-gray-100/80 p-1.5 rounded-2xl">
            <button 
              type="button"
              onClick={() => handleTabChange('expense')}
              className={twMerge(
                "flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all",
                activeTab === 'expense' 
                  ? "bg-white text-danger shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Expense (-)
            </button>
            <button 
              type="button"
              onClick={() => handleTabChange('income')}
              className={twMerge(
                "flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all",
                activeTab === 'income' 
                  ? "bg-white text-green-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Income (+)
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Amount ({CURRENCY_SYMBOL})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">
                {CURRENCY_SYMBOL}
              </span>
              <input 
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 text-2xl font-black bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all text-gray-900"
              />
            </div>
          </div>

          {/* Category Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Category
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Layers size={18} />
              </div>
              <select 
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== 'Other') {
                    setCustomCategory('');
                  }
                }}
                className="w-full appearance-none pl-11 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
              >
                {currentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Custom Category Input if "Other" is selected */}
            {category === 'Other' && (
              <div className="pt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[11px] font-bold text-brand-primary uppercase tracking-wider flex items-center justify-between">
                  <span>Custom Category Name</span>
                  <span className="text-[10px] text-gray-400 font-normal lowercase">(where did you spend/earn?)</span>
                </label>
                <input 
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Gym, Books, Electronics, Pet Food..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all placeholder:text-gray-400"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Description / Note
            </label>
            <input 
              type="text"
              placeholder="e.g. Grocery store, dinner bill, invoice #104..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Date
              </label>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => handleQuickDate(0)} 
                  className="text-[11px] font-bold text-brand-primary hover:underline"
                >
                  Today
                </button>
                <span className="text-gray-300">•</span>
                <button 
                  type="button" 
                  onClick={() => handleQuickDate(1)} 
                  className="text-[11px] font-bold text-gray-500 hover:underline"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <div className="relative">
              <input 
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
              />
            </div>
          </div>

          {/* Receipt Section */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Receipt / Invoice</span>
              {receiptPreview && (
                <button 
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="text-[11px] text-danger font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </label>

            {receiptPreview ? (
              <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={receiptPreview} 
                    alt="Receipt Thumbnail" 
                    className="w-14 h-14 object-cover rounded-xl border border-blue-200 shrink-0" 
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {receiptFile ? receiptFile.name : 'Receipt Document'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={12} /> {receiptFile ? 'New file ready to upload' : 'Attached in ledger'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-bold text-brand-primary bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors shrink-0"
                >
                  Replace
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center hover:border-brand-primary hover:bg-blue-50/20 transition-all cursor-pointer bg-gray-50/40"
              >
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-brand-primary mb-2">
                  <Upload size={18} />
                </div>
                <p className="text-xs font-bold text-gray-800">
                  Click to attach receipt or invoice
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  JPG, PNG, WebP up to 10MB
                </p>
              </div>
            )}

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 mt-auto flex items-center gap-3 border-t border-gray-100">
            <Button 
              type="button"
              variant="secondary" 
              className="flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-100"
              disabled={loading}
            >
              {loading ? (uploadStatus || 'Saving...') : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;

