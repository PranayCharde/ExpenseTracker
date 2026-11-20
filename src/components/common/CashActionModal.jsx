import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Upload, 
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Banknote,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  Wallet
} from 'lucide-react';
import Button from './Button';
import { twMerge } from 'tailwind-merge';
import { db, storage } from '../../firebase';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../hooks/useCurrency';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/constants';
import { compressReceiptImage } from '../../utils/receiptHelper';
import { uploadReceiptToCloudinary } from '../../services/cloudinaryService';

const CASH_EXPENSE_CATEGORIES = [
  'Food',
  'Dining',
  'Transport',
  'Shopping',
  'Groceries',
  'Entertainment',
  'Medical',
  'Tea & Snacks',
  'Personal',
  'Other'
];

const CASH_INCOME_CATEGORIES = [
  'ATM Withdrawal',
  'Salary',
  'Received from Friend',
  'Allowance / Pocket Money',
  'Refund',
  'Other'
];

const DENOMINATION_NOTES = [
  { value: 500, label: '₹500', color: 'bg-stone-50 border-stone-200 text-stone-800' },
  { value: 200, label: '₹200', color: 'bg-amber-50 border-amber-200 text-amber-900' },
  { value: 100, label: '₹100', color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
  { value: 50, label: '₹50', color: 'bg-cyan-50 border-cyan-200 text-cyan-900' },
  { value: 20, label: '₹20', color: 'bg-orange-50 border-orange-200 text-orange-900' },
  { value: 10, label: '₹10', color: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
];

const CashActionModal = ({ 
  isOpen, 
  onClose, 
  mode = 'expense', // 'expense' or 'income'
  currentWalletDenominations = {},
  currentWalletBalance = 0,
  onSuccess 
}) => {
  const { user } = useAuth();
  const { symbol: CURRENCY_SYMBOL, formatCurrency } = useCurrency();
  const fileInputRef = useRef(null);

  const [inputMethod, setInputMethod] = useState('notes'); // 'notes' or 'direct'
  const [directAmount, setDirectAmount] = useState('');
  const [selectedNotes, setSelectedNotes] = useState({
    500: '',
    200: '',
    100: '',
    50: '',
    20: '',
    10: '',
    coins: ''
  });

  const [category, setCategory] = useState(mode === 'expense' ? 'Food' : 'ATM Withdrawal');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputMethod('notes');
      setDirectAmount('');
      setSelectedNotes({
        500: '',
        200: '',
        100: '',
        50: '',
        20: '',
        10: '',
        coins: ''
      });
      setCategory(mode === 'expense' ? 'Food' : 'ATM Withdrawal');
      setCustomCategory('');
      setDescription('');
      setDateStr(new Date().toISOString().split('T')[0]);
      setReceiptFile(null);
      setReceiptPreview(null);
      setErrorMessage('');
      setLoading(false);
    }
  }, [isOpen, mode]);

  // Calculate notes total
  const notesCalculatedTotal = useMemo(() => {
    const notesSum = DENOMINATION_NOTES.reduce((sum, item) => {
      const count = parseInt(selectedNotes[item.value], 10) || 0;
      return sum + (count * item.value);
    }, 0);
    const coinsSum = parseFloat(selectedNotes.coins) || 0;
    return notesSum + coinsSum;
  }, [selectedNotes]);

  // Final amount to save
  const finalAmount = useMemo(() => {
    if (inputMethod === 'notes') {
      return notesCalculatedTotal;
    }
    return parseFloat(directAmount) || 0;
  }, [inputMethod, notesCalculatedTotal, directAmount]);

  // Remaining wallet balance projection
  const projectedWalletBalance = useMemo(() => {
    if (mode === 'expense') {
      return Math.max(0, currentWalletBalance - finalAmount);
    }
    return currentWalletBalance + finalAmount;
  }, [mode, currentWalletBalance, finalAmount]);

  // Notes summary string (e.g. "1 × ₹100, 1 × ₹10")
  const notesSummary = useMemo(() => {
    if (inputMethod !== 'notes' || notesCalculatedTotal === 0) return null;
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
  }, [inputMethod, notesCalculatedTotal, selectedNotes, CURRENCY_SYMBOL]);

  const handleNoteStep = (val, delta) => {
    const current = parseInt(selectedNotes[val], 10) || 0;
    const available = parseInt(currentWalletDenominations?.[val], 10) || 0;

    let next = current + delta;
    if (next < 0) next = 0;

    // In expense mode, warn/cap if exceeding available notes
    if (mode === 'expense' && available > 0 && next > available) {
      // Allow user to still enter if they want, but don't auto-increase
      next = available;
    }

    setSelectedNotes(prev => ({
      ...prev,
      [val]: next === 0 ? '' : next
    }));
  };

  const handleNoteDirectChange = (val, rawVal) => {
    const clean = rawVal === '' ? '' : Math.max(0, parseInt(rawVal, 10) || 0);
    setSelectedNotes(prev => ({
      ...prev,
      [val]: clean
    }));
  };

  const handleCoinsChange = (e) => {
    const val = e.target.value;
    const clean = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    setSelectedNotes(prev => ({
      ...prev,
      coins: clean
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Receipt file size must be less than 10MB.');
      return;
    }

    setReceiptFile(file);
    setErrorMessage('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReceiptPreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (finalAmount <= 0) {
      setErrorMessage('Please specify an amount greater than 0.');
      return;
    }

    if (mode === 'expense' && finalAmount > currentWalletBalance && currentWalletBalance > 0) {
      const proceed = window.confirm(
        `You are logging an expense of ${formatCurrency(finalAmount)}, which is more than your recorded wallet cash of ${formatCurrency(currentWalletBalance)}. Proceed anyway?`
      );
      if (!proceed) return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      let receiptUrl = null;
      if (receiptFile) {
        try {
          let fileToUpload = receiptFile;
          if (receiptFile.type.startsWith('image/')) {
            fileToUpload = await compressReceiptImage(receiptFile);
          }
          const cloudRes = await uploadReceiptToCloudinary(fileToUpload);
          if (cloudRes.success && cloudRes.url) {
            receiptUrl = cloudRes.url;
            console.log('[CashAction] Stored receipt in Cloudinary:', receiptUrl);
          }
        } catch (uploadErr) {
          console.warn("[CashAction] Cloudinary upload notice:", uploadErr);
        }
      }

      const chosenCategory = category === 'Other' && customCategory.trim() 
        ? customCategory.trim() 
        : category;

      const txAmount = mode === 'expense' 
        ? -Math.abs(finalAmount) 
        : Math.abs(finalAmount);

      const txData = {
        amount: txAmount,
        category: chosenCategory,
        description: description.trim() || (mode === 'expense' ? `${chosenCategory} in cash` : 'Cash added to wallet'),
        paymentMethod: 'Cash',
        date: dateStr,
        createdAt: serverTimestamp(),
        notesSummary: notesSummary || null,
        receiptUrl: receiptUrl || null
      };

      // 1. Add transaction to Firestore
      await addDoc(collection(db, 'users', user.uid, 'transactions'), txData);

      // 2. If user used the note picker, calculate updated denominations & save
      if (inputMethod === 'notes') {
        const updatedDenoms = {};
        DENOMINATION_NOTES.forEach(note => {
          const currentCount = parseInt(currentWalletDenominations?.[note.value], 10) || 0;
          const delta = parseInt(selectedNotes[note.value], 10) || 0;
          const nextCount = mode === 'expense' 
            ? Math.max(0, currentCount - delta)
            : currentCount + delta;
          updatedDenoms[note.value] = nextCount;
        });

        const currentCoins = parseFloat(currentWalletDenominations?.coins) || 0;
        const deltaCoins = parseFloat(selectedNotes.coins) || 0;
        updatedDenoms.coins = mode === 'expense'
          ? Math.max(0, currentCoins - deltaCoins)
          : currentCoins + deltaCoins;

        await setDoc(doc(db, 'users', user.uid), {
          physicalWallet: {
            amount: projectedWalletBalance,
            denominations: updatedDenoms,
            updatedAt: serverTimestamp()
          }
        }, { merge: true });
      }

      if (onSuccess) {
        onSuccess(
          mode === 'expense'
            ? `Logged ${formatCurrency(finalAmount)} cash spent! Wallet now has ${formatCurrency(projectedWalletBalance)}.`
            : `Added ${formatCurrency(finalAmount)} cash to wallet! Wallet now has ${formatCurrency(projectedWalletBalance)}.`
        );
      }

      onClose();
    } catch (err) {
      console.error("Error logging cash transaction:", err);
      setErrorMessage("Failed to record cash transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose} 
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-3">
            <div className={twMerge(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
              mode === 'expense' ? "bg-red-50 text-danger" : "bg-emerald-50 text-emerald-700"
            )}>
              {mode === 'expense' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                {mode === 'expense' ? 'Spend Cash from Wallet' : 'Add Cash to Wallet'}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Wallet Cash currently: <strong className="text-emerald-800">{formatCurrency(currentWalletBalance)}</strong>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-danger animate-in fade-in">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Method Tabs (Notes Picker vs Direct Amount) */}
          <div className="flex items-center justify-between bg-gray-100 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setInputMethod('notes')}
              className={twMerge(
                "flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5",
                inputMethod === 'notes' ? "bg-white text-emerald-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Coins size={14} className="text-emerald-600" />
              <span>{mode === 'expense' ? 'Pick Bills Spent' : 'Pick Bills Added'}</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMethod('direct')}
              className={twMerge(
                "flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5",
                inputMethod === 'direct' ? "bg-white text-emerald-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Banknote size={14} className="text-emerald-600" />
              <span>Type Total Amount</span>
            </button>
          </div>

          {/* Amount Display Hero */}
          <div className={twMerge(
            "p-4 rounded-2xl border text-center transition-all",
            mode === 'expense' ? "bg-red-50/50 border-red-100" : "bg-emerald-50/50 border-emerald-100"
          )}>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
              {mode === 'expense' ? 'Cash Amount to Deduct' : 'Cash Amount to Add'}
            </span>
            <div className="flex items-center justify-center gap-1 text-3xl font-black mt-1">
              <span className={mode === 'expense' ? 'text-danger' : 'text-emerald-700'}>
                {mode === 'expense' ? '-' : '+'}
                {formatCurrency(finalAmount)}
              </span>
            </div>
            {notesSummary && (
              <p className="text-xs font-bold text-gray-600 mt-1">
                Bills: <span className="text-emerald-800">{notesSummary}</span>
              </p>
            )}
            <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
              Wallet after: <strong className="text-gray-900">{formatCurrency(projectedWalletBalance)}</strong>
            </p>
          </div>

          {/* Input Method 1: Notes Picker */}
          {inputMethod === 'notes' ? (
            <div className="space-y-3 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-700">
                  {mode === 'expense' ? 'Select Notes You Gave' : 'Select Notes You Received'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' })}
                  className="text-[11px] font-bold text-gray-400 hover:text-danger flex items-center gap-1"
                >
                  <RotateCcw size={11} /> Clear
                </button>
              </div>

              {/* Note Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DENOMINATION_NOTES.map(note => {
                  const available = parseInt(currentWalletDenominations?.[note.value], 10) || 0;
                  const picked = selectedNotes[note.value] ?? '';
                  const isAvailable = available > 0 || mode === 'income';

                  return (
                    <div 
                      key={note.value}
                      className={twMerge(
                        "p-2.5 rounded-xl border bg-white flex flex-col justify-between shadow-2xs transition-all",
                        note.color,
                        !isAvailable && mode === 'expense' && "opacity-50 grayscale"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <span>{note.label}</span>
                        {mode === 'expense' && (
                          <span className="text-[10px] text-gray-500 font-semibold" title="In your wallet">
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
                          className="w-full text-center py-1 text-xs font-black bg-gray-50 rounded-lg border border-gray-200 text-gray-900"
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

              {/* Coins input */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700">Coins & Change ({CURRENCY_SYMBOL})</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={selectedNotes.coins}
                  onChange={handleCoinsChange}
                  placeholder="0.00"
                  className="w-24 text-right px-2.5 py-1 text-xs font-black bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          ) : (
            /* Input Method 2: Direct Amount */
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Amount ({CURRENCY_SYMBOL})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-extrabold text-base">
                  {CURRENCY_SYMBOL}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={directAmount}
                  onChange={(e) => setDirectAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required={inputMethod === 'direct'}
                />
              </div>
            </div>
          )}

          {/* Category & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {(mode === 'expense' ? CASH_EXPENSE_CATEGORIES : CASH_INCOME_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {category === 'Other' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Specify Category
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Street food, Parking, Auto"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Description / Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={mode === 'expense' ? 'e.g. Lunch with team, Auto to station' : 'e.g. Withdrew from SBI ATM'}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Receipt Upload (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Receipt / Bill Photo (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {receiptPreview ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <img src={receiptPreview} alt="Receipt preview" className="w-9 h-9 object-cover rounded-lg" />
                  <span className="text-xs font-bold text-emerald-900 truncate max-w-[200px]">
                    {receiptFile?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                  className="p-1 text-danger hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 text-xs font-bold text-gray-600 transition-colors"
              >
                <Upload size={14} />
                <span>Attach Receipt Image</span>
              </button>
            )}
          </div>

          {/* Submit buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="rounded-xl px-4 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || finalAmount <= 0}
              className={twMerge(
                "rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md",
                mode === 'expense' 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-100" 
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
              )}
            >
              {loading ? 'Recording...' : mode === 'expense' 
                ? `Confirm Spend (-${formatCurrency(finalAmount)})` 
                : `Confirm Add (+${formatCurrency(finalAmount)})`
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashActionModal;

