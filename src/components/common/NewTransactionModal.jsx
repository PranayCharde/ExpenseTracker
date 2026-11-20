import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Upload, 
  Layers, 
  Trash2,
  FileText,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Camera,
  Banknote,
  Coins,
  RotateCcw,
  Smartphone,
  CreditCard,
  Building2,
  Sparkles,
  Loader2
} from 'lucide-react';
import Button from '../common/Button';
import { twMerge } from 'tailwind-merge';
import { db, auth, storage } from '../../firebase';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCurrency } from '../../hooks/useCurrency';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';
import { compressReceiptImage, compressReceiptToBlob } from '../../utils/receiptHelper';
import { scanWebReceipt, warmupReceiptScanner } from '../../utils/receiptScannerService';
import { uploadReceiptToCloudinary } from '../../services/cloudinaryService';

const DENOMINATION_NOTES = [
  { value: 500, label: '₹500', color: 'bg-stone-50 border-stone-200 text-stone-800' },
  { value: 200, label: '₹200', color: 'bg-amber-50 border-amber-200 text-amber-900' },
  { value: 100, label: '₹100', color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
  { value: 50, label: '₹50', color: 'bg-cyan-50 border-cyan-200 text-cyan-900' },
  { value: 20, label: '₹20', color: 'bg-orange-50 border-orange-200 text-orange-900' },
  { value: 10, label: '₹10', color: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
];

const NewTransactionModal = ({ 
  isOpen, 
  onClose, 
  defaultType = 'expense', 
  defaultPaymentMethod = 'Online / UPI', 
  onTransactionAdded 
}) => {
  const { symbol: CURRENCY_SYMBOL } = useCurrency();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState(defaultType); // 'expense' or 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(defaultType === 'income' ? 'Salary' : 'Shopping');
  const [customCategory, setCustomCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [receiptScanResult, setReceiptScanResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cash denomination notes state
  const [cashInputMode, setCashInputMode] = useState('notes'); // 'notes' or 'direct'
  const [selectedNotes, setSelectedNotes] = useState({
    500: '',
    200: '',
    100: '',
    50: '',
    20: '',
    10: '',
    coins: ''
  });
  const [walletDenominations, setWalletDenominations] = useState({});
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (isOpen) {
      warmupReceiptScanner();
      setActiveTab(defaultType);
      setCategory(defaultType === 'income' ? 'Salary' : 'Shopping');
      setCustomCategory('');
      setPaymentMethod(defaultPaymentMethod);
      setCashInputMode('notes');
      setSelectedNotes({
        500: '',
        200: '',
        100: '',
        50: '',
        20: '',
        10: '',
        coins: ''
      });
      setAmount('');
      setDescription('');
      setDateStr(new Date().toISOString().split('T')[0]);
      setReceiptFile(null);
      setReceiptPreview(null);
      setReceiptScanResult(null);
      setScanningReceipt(false);
      setScanProgress(0);
      setIsDragging(false);
      setErrorMessage('');
      setUploadStatus('');

      // Fetch user's physical wallet denominations and balance
      const currentUser = auth.currentUser;
      if (currentUser) {
        getDoc(doc(db, 'users', currentUser.uid))
          .then((snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.physicalWallet) {
                setWalletDenominations(data.physicalWallet.denominations || {});
                setWalletBalance(parseFloat(data.physicalWallet.amount) || 0);
              }
            }
          })
          .catch((err) => console.warn('Could not load physical wallet data:', err));
      }
    }
  }, [isOpen, defaultType, defaultPaymentMethod]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCategory(tab === 'income' ? 'Salary' : 'Shopping');
    setCustomCategory('');
  };

  // Calculate notes sum
  const notesCalculatedTotal = useMemo(() => {
    const notesSum = DENOMINATION_NOTES.reduce((sum, item) => {
      const count = parseInt(selectedNotes[item.value], 10) || 0;
      return sum + (count * item.value);
    }, 0);
    const coinsSum = parseFloat(selectedNotes.coins) || 0;
    return notesSum + coinsSum;
  }, [selectedNotes]);

  const handleNoteStep = (val, delta) => {
    const current = parseInt(selectedNotes[val], 10) || 0;
    const available = parseInt(walletDenominations?.[val], 10) || 0;

    let next = current + delta;
    if (next < 0) next = 0;
    if (activeTab === 'expense' && available > 0 && next > available) {
      next = available;
    }

    const updated = {
      ...selectedNotes,
      [val]: next === 0 ? '' : next
    };
    setSelectedNotes(updated);

    const notesSum = DENOMINATION_NOTES.reduce((sum, item) => {
      const count = parseInt(updated[item.value], 10) || 0;
      return sum + (count * item.value);
    }, 0);
    const coinsSum = parseFloat(updated.coins) || 0;
    const newTotal = notesSum + coinsSum;
    setAmount(newTotal > 0 ? newTotal.toString() : '');
  };

  const handleNoteDirectChange = (val, rawVal) => {
    const clean = rawVal === '' ? '' : Math.max(0, parseInt(rawVal, 10) || 0);
    const updated = {
      ...selectedNotes,
      [val]: clean
    };
    setSelectedNotes(updated);

    const notesSum = DENOMINATION_NOTES.reduce((sum, item) => {
      const count = parseInt(updated[item.value], 10) || 0;
      return sum + (count * item.value);
    }, 0);
    const coinsSum = parseFloat(updated.coins) || 0;
    const newTotal = notesSum + coinsSum;
    setAmount(newTotal > 0 ? newTotal.toString() : '');
  };

  const handleCoinsChange = (e) => {
    const val = e.target.value;
    const clean = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    const updated = {
      ...selectedNotes,
      coins: clean
    };
    setSelectedNotes(updated);

    const notesSum = DENOMINATION_NOTES.reduce((sum, item) => {
      const count = parseInt(updated[item.value], 10) || 0;
      return sum + (count * item.value);
    }, 0);
    const coinsSum = parseFloat(updated.coins) || 0;
    const newTotal = notesSum + coinsSum;
    setAmount(newTotal > 0 ? newTotal.toString() : '');
  };

  const handleClearNotes = () => {
    setSelectedNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
    if (cashInputMode === 'notes') {
      setAmount('');
    }
  };

  const notesSummary = useMemo(() => {
    if (paymentMethod !== 'Cash' || notesCalculatedTotal === 0) return null;
    const parts = [];
    DENOMINATION_NOTES.forEach(note => {
      const count = parseInt(selectedNotes[note.value], 10) || 0;
      if (count > 0) {
        parts.push(`${count} × ${note.label}`);
      }
    });
    const coins = parseFloat(selectedNotes.coins) || 0;
    if (coins > 0) {
      parts.push(`${CURRENCY_SYMBOL}${coins.toFixed(2)} coins`);
    }
    return parts.join(', ');
  }, [paymentMethod, notesCalculatedTotal, selectedNotes, CURRENCY_SYMBOL]);

  const projectedWalletBalance = useMemo(() => {
    const parsed = parseFloat(amount) || 0;
    if (activeTab === 'expense') {
      return Math.max(0, walletBalance - parsed);
    }
    return walletBalance + parsed;
  }, [activeTab, walletBalance, amount]);

  const processSelectedFile = async (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Receipt file size must be less than 10MB.');
      return;
    }

    setReceiptFile(file);
    setErrorMessage('');
    setReceiptScanResult(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }

    // AI OCR Scan & Auto-Fill
    setScanningReceipt(true);
    setScanProgress(0);
    try {
      const scanRes = await scanWebReceipt(file, (p) => setScanProgress(p));
      if (scanRes.success && scanRes.data) {
        const d = scanRes.data;
        if (d.amount) {
          setAmount(d.amount.toString());
          setCashInputMode('direct');
        }
        if (d.merchant) {
          setDescription(d.merchant);
        }
        if (d.category) {
          const allCats = activeTab === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
          if (allCats.includes(d.category)) {
            setCategory(d.category);
            setCustomCategory('');
          }
        }
        if (d.date) {
          setDateStr(d.date);
        }
        if (d.paymentMethod) {
          setPaymentMethod(d.paymentMethod);
        }

        setReceiptScanResult({
          amount: d.amount,
          merchant: d.merchant,
          category: d.category,
          date: d.date
        });
      }
    } catch (scanErr) {
      console.warn("Web receipt scan warning:", scanErr);
    } finally {
      setScanningReceipt(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptScanResult(null);
    setScanningReceipt(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setDateStr(d.toISOString().split('T')[0]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setErrorMessage('You must be signed in to add transactions.');
      return;
    }

    setLoading(true);

    try {
      let finalReceiptUrl = null;

      if (receiptFile) {
        setUploadStatus('Optimizing receipt...');

        // 1. Prepare ultra-lightweight compressed image (<120 KB)
        let base64Fallback = null;
        let blobToUpload = null;
        try {
          [base64Fallback, blobToUpload] = await Promise.all([
            compressReceiptImage(receiptFile, 1000, 0.75),
            compressReceiptToBlob(receiptFile, 1000, 0.75)
          ]);
        } catch (compErr) {
          console.warn("Compression warning, using fallback", compErr);
          base64Fallback = receiptPreview;
          blobToUpload = receiptFile;
        }

        // 2. Upload receipt image to Cloudinary
        setUploadStatus('Uploading receipt to Cloudinary...');
        try {
          const cloudRes = await uploadReceiptToCloudinary(blobToUpload || receiptFile);
          if (cloudRes.success && cloudRes.url) {
            finalReceiptUrl = cloudRes.url;
            console.log('[NewTx] Stored receipt in Cloudinary:', finalReceiptUrl);
          } else {
            console.warn('[NewTx] Cloudinary notice, using backup:', cloudRes.error);
            finalReceiptUrl = base64Fallback;
          }
        } catch (cloudErr) {
          console.warn("[NewTx] Cloudinary notice; using backup:", cloudErr);
          finalReceiptUrl = base64Fallback;
        }
      }

      setUploadStatus('Saving to ledger...');

      // Convert date string into Date object
      const [year, month, day] = dateStr.split('-').map(Number);
      const transactionDate = new Date(year, month - 1, day, 12, 0, 0);

    const isExpense = activeTab === 'expense';
    const finalAmount = isExpense ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

    if (category === 'Other' && !customCategory.trim()) {
      setErrorMessage('Please specify your custom category.');
      return;
    }

    const finalCategory = (category === 'Other' && customCategory.trim()) 
      ? customCategory.trim() 
      : category.trim();

    const transactionData = {
      userId: user.uid,
      amount: finalAmount,
      type: activeTab,
      category: finalCategory,
      paymentMethod: paymentMethod || 'Online / UPI',
      description: description.trim() || finalCategory,
      notesSummary: (paymentMethod === 'Cash' && notesSummary) ? notesSummary : null,
      receiptUrl: finalReceiptUrl || null,
      date: Timestamp.fromDate(transactionDate),
      createdAt: serverTimestamp(),
    };

      await addDoc(collection(db, 'users', user.uid, 'transactions'), transactionData);

      // If Cash and user used notes, update physicalWallet
      if (paymentMethod === 'Cash' && notesCalculatedTotal > 0 && cashInputMode === 'notes') {
        try {
          const updatedDenoms = {};
          DENOMINATION_NOTES.forEach(note => {
            const currentCount = parseInt(walletDenominations?.[note.value], 10) || 0;
            const delta = parseInt(selectedNotes[note.value], 10) || 0;
            const nextCount = isExpense 
              ? Math.max(0, currentCount - delta)
              : currentCount + delta;
            updatedDenoms[note.value] = nextCount;
          });

          const currentCoins = parseFloat(walletDenominations?.coins) || 0;
          const deltaCoins = parseFloat(selectedNotes.coins) || 0;
          updatedDenoms.coins = isExpense
            ? Math.max(0, currentCoins - deltaCoins)
            : currentCoins + deltaCoins;

          await setDoc(doc(db, 'users', user.uid), {
            physicalWallet: {
              amount: projectedWalletBalance,
              denominations: updatedDenoms,
              updatedAt: serverTimestamp()
            }
          }, { merge: true });
        } catch (walletErr) {
          console.warn('Could not sync physical wallet denominations:', walletErr);
        }
      }

      onTransactionAdded?.();
      onClose();
    } catch (err) {
      console.error('Error adding transaction:', err);
      setErrorMessage(err.message || 'Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  if (!isOpen) return null;

  const currentCategories = activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Drawer */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto z-10 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between pb-5 border-b border-gray-100 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
              {activeTab === 'expense' ? 'Record Expense' : 'Record Income'}
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Securely stored in your personal cloud ledger
            </p>
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
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-danger text-xs font-bold flex items-center gap-2 border border-red-100 animate-shake">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 flex-1 flex flex-col">
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

          {/* Payment Method Selector (Cash vs Online) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Payment Mode</span>
              <span className="text-[10px] text-brand-primary font-bold">
                {paymentMethod === 'Cash' ? '💵 Cash Expense' : '⚡ Digital / Online'}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Online / UPI', label: 'Online / UPI', icon: Smartphone, color: 'text-blue-500' },
                { id: 'Cash', label: 'Cash', icon: Banknote, color: 'text-emerald-500' },
                { id: 'Card', label: 'Card', icon: CreditCard, color: 'text-purple-500' },
                { id: 'Net Banking', label: 'Net Banking', icon: Building2, color: 'text-amber-500' }
              ].map((method) => {
                const IconComponent = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={twMerge(
                      "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition-all",
                      isSelected
                        ? "bg-brand-primary text-white border-brand-primary shadow-sm ring-2 ring-blue-100"
                        : "bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100/80 hover:border-gray-200"
                    )}
                  >
                    <IconComponent size={14} className={isSelected ? 'text-white' : method.color} />
                    <span className="truncate">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Denomination Notes Picker (when Cash selected) */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-3.5 p-3.5 sm:p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Cash Input Mode Toggle */}
              <div className="flex bg-white/90 p-1 rounded-xl border border-emerald-100 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCashInputMode('notes')}
                  className={twMerge(
                    "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                    cashInputMode === 'notes'
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-emerald-700"
                  )}
                >
                  <Banknote size={14} />
                  <span>Select Notes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCashInputMode('direct')}
                  className={twMerge(
                    "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                    cashInputMode === 'direct'
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-emerald-700"
                  )}
                >
                  <span>Type Total Amount</span>
                </button>
              </div>

              {cashInputMode === 'notes' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <Banknote size={15} className="text-emerald-600" />
                      {activeTab === 'expense' ? 'Select Notes You Gave' : 'Select Notes You Received'}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearNotes}
                      className="text-[11px] font-bold text-gray-400 hover:text-danger flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw size={11} /> Clear
                    </button>
                  </div>

                  {/* Denomination Notes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DENOMINATION_NOTES.map(note => {
                      const available = parseInt(walletDenominations?.[note.value], 10) || 0;
                      const picked = selectedNotes[note.value] ?? '';
                      const isAvailable = available > 0 || activeTab === 'income';

                      return (
                        <div
                          key={note.value}
                          className={twMerge(
                            "p-2.5 rounded-xl border bg-white flex flex-col justify-between shadow-2xs transition-all",
                            note.color,
                            !isAvailable && activeTab === 'expense' && "opacity-60"
                          )}
                        >
                          <div className="flex items-center justify-between text-xs font-black">
                            <span>{note.label}</span>
                            {activeTab === 'expense' && (
                              <span className="text-[10px] text-gray-500 font-semibold" title="Available in wallet">
                                ({available} left)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-2">
                            <button
                              type="button"
                              onClick={() => handleNoteStep(note.value, -1)}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 font-black text-xs text-gray-700 flex items-center justify-center transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={picked}
                              onChange={(e) => handleNoteDirectChange(note.value, e.target.value)}
                              placeholder="0"
                              className="w-full text-center py-1 text-xs font-black bg-gray-50 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleNoteStep(note.value, 1)}
                              className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 font-black text-xs text-emerald-800 flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coins Input Row */}
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Coins size={14} className="text-amber-500" />
                      Coins ({CURRENCY_SYMBOL})
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={selectedNotes.coins}
                      onChange={handleCoinsChange}
                      placeholder="0.00"
                      className="w-24 px-2.5 py-1 text-xs font-bold text-right bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Notes Summary & Wallet Projection */}
                  <div className="pt-1 flex flex-col gap-1 text-[11px]">
                    {notesSummary && (
                      <p className="font-bold text-emerald-800">
                        Bills: <span>{notesSummary}</span>
                      </p>
                    )}
                    {walletBalance > 0 && (
                      <p className="font-semibold text-gray-500">
                        Wallet balance: <strong>{CURRENCY_SYMBOL}{walletBalance.toFixed(2)}</strong> → after: <strong className="text-emerald-700">{CURRENCY_SYMBOL}{projectedWalletBalance.toFixed(2)}</strong>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 italic">
                  Direct amount mode active. The amount entered in the field above will be recorded.
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Description / Note (Optional)
            </label>
            <input 
              type="text"
              placeholder="e.g. Grocery store, dinner bill, invoice #104..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
            />
          </div>

          {/* Date Picker with Quick Selectors */}
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
                  className="text-[11px] font-bold text-gray-500 hover:text-brand-primary"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input 
              type="date"
              required
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
            />
          </div>

          {/* Receipt / Invoice Attachment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon size={15} className="text-brand-primary" />
                Receipt / Invoice (Optional)
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} /> AI Auto-Read
              </span>
            </div>

            {/* AI Scanning Status */}
            {scanningReceipt && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold text-emerald-800">
                <div className="flex items-center gap-2.5 truncate">
                  <Loader2 size={16} className="animate-spin text-emerald-600 shrink-0" />
                  <span className="truncate">
                    AI Reading receipt & extracting data... {scanProgress > 0 ? `(${scanProgress}%)` : ''}
                  </span>
                </div>
                {scanProgress > 0 && (
                  <div className="w-20 bg-emerald-200/70 rounded-full h-1.5 overflow-hidden shrink-0">
                    <div 
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-200" 
                      style={{ width: `${scanProgress}%` }} 
                    />
                  </div>
                )}
              </div>
            )}

            {/* AI Success Result */}
            {receiptScanResult && !scanningReceipt && (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold text-emerald-900 animate-in fade-in">
                <div className="flex items-center gap-2 truncate">
                  <Sparkles size={16} className="text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Auto-filled: {receiptScanResult.amount ? `₹${receiptScanResult.amount}` : ''} {receiptScanResult.merchant ? `• ${receiptScanResult.merchant}` : ''} ({receiptScanResult.category})
                  </span>
                </div>
                <span className="text-[10px] uppercase font-black bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-md shrink-0">
                  Auto-Read
                </span>
              </div>
            )}

            {/* Hidden File Input */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*,application/pdf"
              onChange={handleFileChange} 
              className="hidden" 
            />

            {receiptFile ? (
              /* Attached Preview Card */
              <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3 overflow-hidden">
                  {receiptPreview ? (
                    <img 
                      src={receiptPreview} 
                      alt="Receipt preview" 
                      className="w-14 h-14 rounded-xl object-cover border border-blue-200 shrink-0 bg-white shadow-sm" 
                    />
                  ) : (
                    <div className="w-14 h-14 bg-white text-brand-primary rounded-xl flex items-center justify-center shrink-0 border border-blue-200">
                      <FileText size={24} />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 truncate">{receiptFile.name}</p>
                    <p className="text-[11px] text-gray-500">{(receiptFile.size / 1024).toFixed(1)} KB • Attached</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] font-bold text-brand-primary hover:underline mt-0.5"
                    >
                      Change photo
                    </button>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="p-2 text-gray-400 hover:text-danger hover:bg-red-50 rounded-xl transition-colors shrink-0"
                  title="Remove receipt"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              /* Upload / Drop Area */
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={twMerge(
                  "flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center",
                  isDragging 
                    ? "border-brand-primary bg-blue-50/60 scale-[0.99]" 
                    : "border-gray-200 hover:border-brand-primary bg-gray-50/50 hover:bg-blue-50/30"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center mb-2 shadow-sm">
                  <Upload size={18} />
                </div>
                <p className="text-xs font-bold text-gray-800">
                  Click to select photo or drag & drop here
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Supports PNG, JPG, JPEG, WebP, PDF up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-3 mt-auto">
            <Button 
              type="submit" 
              className="w-full py-4 rounded-2xl font-bold shadow-lg shadow-blue-100" 
              disabled={loading}
            >
              {loading 
                ? (uploadStatus || 'Saving...') 
                : activeTab === 'expense' ? 'Save Expense' : 'Save Income'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTransactionModal;