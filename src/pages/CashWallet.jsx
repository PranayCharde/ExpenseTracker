import React, { useEffect, useState, useMemo } from 'react';
import { 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Banknote,
  TrendingUp,
  Trash2,
  Plus,
  Search,
  X,
  ExternalLink,
  Eye,
  FileText,
  CheckCircle2,
  Edit3,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  PieChart as PieChartIcon,
  Calculator,
  AlertCircle,
  Coins,
  Sparkles,
  RotateCcw,
  Clock,
  Check
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EditTransactionModal from '../components/common/EditTransactionModal';
import CashActionModal from '../components/common/CashActionModal';
import { twMerge } from 'tailwind-merge';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../hooks/useCurrency';
import { format } from 'date-fns';

const CashWallet = () => {
  const { user } = useAuth();
  const { formatCurrency, symbol: CURRENCY_SYMBOL } = useCurrency();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashModalMode, setCashModalMode] = useState('expense'); // 'expense' or 'income'
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [sortBy, setSortBy] = useState('date-desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Physical Wallet States
  const [physicalWalletData, setPhysicalWalletData] = useState({
    amount: null,
    updatedAt: null,
    note: ''
  });
  const [hasInitializedWallet, setHasInitializedWallet] = useState(false);
  const [walletInputAmount, setWalletInputAmount] = useState('');
  const [walletNote, setWalletNote] = useState('');
  const [showDenominations, setShowDenominations] = useState(false);
  const [showRecount, setShowRecount] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const [denominations, setDenominations] = useState({
    500: '',
    200: '',
    100: '',
    50: '',
    20: '',
    10: '',
    coins: ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let jsDate = new Date();
        if (data.date?.toDate) {
          jsDate = data.date.toDate();
        } else if (data.createdAt?.toDate) {
          jsDate = data.createdAt.toDate();
        } else if (data.date) {
          jsDate = new Date(data.date);
        }

        return {
          id: docSnap.id,
          ...data,
          parsedDate: jsDate,
          dateStr: format(jsDate, 'MMM dd, yyyy')
        };
      });

      // Filter specifically for CASH transactions
      const cashOnly = txs.filter(tx => tx.paymentMethod === 'Cash');
      setTransactions(cashOnly);
      setLoading(false);
    }, (error) => {
      console.error("Cash transactions listener error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Listen to user document for physical wallet data
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.physicalWallet) {
          let updateDate = null;
          if (data.physicalWallet.updatedAt?.toDate) {
            updateDate = data.physicalWallet.updatedAt.toDate();
          } else if (data.physicalWallet.updatedAt) {
            updateDate = new Date(data.physicalWallet.updatedAt);
          }

          setPhysicalWalletData({
            amount: data.physicalWallet.amount ?? null,
            updatedAt: updateDate,
            note: data.physicalWallet.note || '',
            denominations: data.physicalWallet.denominations || null
          });

          if (data.physicalWallet.denominations) {
            setDenominations(data.physicalWallet.denominations);
          }

          if (!hasInitializedWallet) {
            if (data.physicalWallet.amount !== undefined && data.physicalWallet.amount !== null) {
              setWalletInputAmount(String(data.physicalWallet.amount));
            }
            if (data.physicalWallet.note) {
              setWalletNote(data.physicalWallet.note);
            }
            setHasInitializedWallet(true);
          }
        }
      }
    }, (error) => {
      console.error("Physical wallet listener error:", error);
    });

    return unsubscribe;
  }, [user, hasInitializedWallet]);

  // Cash statistics
  const stats = useMemo(() => {
    const cashIn = transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const cashOut = transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const cashBalance = cashIn - cashOut;

    return { cashIn, cashOut, cashBalance };
  }, [transactions]);

  // Cash Spending by Category breakdown
  const categoryBreakdown = useMemo(() => {
    const expenses = transactions.filter(t => t.amount < 0);
    const totalExp = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    if (totalExp === 0) return [];

    const map = {};
    expenses.forEach(t => {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + Math.abs(t.amount);
    });

    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / totalExp) * 100)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  // Filtered & Sorted Cash Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = searchTerm 
        ? (tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           tx.category?.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const matchCategory = filterCategory ? tx.category === filterCategory : true;
      const matchType = filterType === 'all' ? true : 
                        filterType === 'income' ? tx.amount > 0 : tx.amount < 0;
      return matchSearch && matchCategory && matchType;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return b.parsedDate - a.parsedDate;
      if (sortBy === 'date-asc') return a.parsedDate - b.parsedDate;
      if (sortBy === 'amount-desc') return Math.abs(b.amount) - Math.abs(a.amount);
      if (sortBy === 'amount-asc') return Math.abs(a.amount) - Math.abs(b.amount);
      return 0;
    });
  }, [transactions, searchTerm, filterCategory, filterType, sortBy]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categoriesList = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).filter(Boolean);
  }, [transactions]);

  // Active denominations in physical wallet
  const activeDenominations = useMemo(() => {
    return physicalWalletData.denominations || denominations;
  }, [physicalWalletData.denominations, denominations]);

  const openCashActionModal = (mode = 'expense') => {
    setCashModalMode(mode);
    setCashModalOpen(true);
  };

  // Denominations logic
  const denominationNotes = useMemo(() => [
    { value: 500, label: '₹500', color: 'bg-stone-50 border-stone-200 text-stone-800' },
    { value: 200, label: '₹200', color: 'bg-amber-50 border-amber-200 text-amber-900' },
    { value: 100, label: '₹100', color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
    { value: 50, label: '₹50', color: 'bg-cyan-50 border-cyan-200 text-cyan-900' },
    { value: 20, label: '₹20', color: 'bg-orange-50 border-orange-200 text-orange-900' },
    { value: 10, label: '₹10', color: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
  ], []);

  const calculateDenominationsTotal = (currentDenoms) => {
    const notesTotal = [500, 200, 100, 50, 20, 10].reduce((sum, val) => {
      const count = parseInt(currentDenoms[val], 10) || 0;
      return sum + (count * val);
    }, 0);
    const coinsTotal = parseFloat(currentDenoms.coins) || 0;
    return notesTotal + coinsTotal;
  };

  const handleDenominationChange = (val, newCount) => {
    const cleanCount = newCount === '' ? '' : Math.max(0, parseInt(newCount, 10) || 0);
    const updated = { ...denominations, [val]: cleanCount };
    setDenominations(updated);
    const total = calculateDenominationsTotal(updated);
    setWalletInputAmount(String(total));
  };

  const handleStepDenomination = (val, delta) => {
    const current = parseInt(denominations[val], 10) || 0;
    const nextVal = Math.max(0, current + delta);
    handleDenominationChange(val, nextVal === 0 ? '' : nextVal);
  };

  const handleCoinChange = (e) => {
    const rawVal = e.target.value;
    const cleanVal = rawVal === '' ? '' : Math.max(0, parseFloat(rawVal) || 0);
    const updated = { ...denominations, coins: cleanVal };
    setDenominations(updated);
    const total = calculateDenominationsTotal(updated);
    setWalletInputAmount(String(total));
  };

  const handleResetDenominations = () => {
    const resetState = {
      500: '',
      200: '',
      100: '',
      50: '',
      20: '',
      10: '',
      coins: ''
    };
    setDenominations(resetState);
    setWalletInputAmount('0');
  };

  const handleSavePhysicalWallet = async (e) => {
    if (e) e.preventDefault();
    if (!user) return;

    const numAmount = parseFloat(walletInputAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      setSyncMessage({ type: 'error', text: 'Please enter a valid cash amount.' });
      return;
    }

    setSyncLoading(true);
    setSyncMessage(null);

    try {
      const diff = numAmount - stats.cashBalance;
      if (Math.abs(diff) >= 0.01) {
        const isPositive = diff > 0;
        const adjustAmount = isPositive 
          ? Math.round(diff * 100) / 100 
          : -Math.round(Math.abs(diff) * 100) / 100;

        await addDoc(collection(db, 'users', user.uid, 'transactions'), {
          amount: adjustAmount,
          category: 'Wallet Balance',
          description: transactions.length === 0 
            ? `Initial physical wallet balance: ${formatCurrency(numAmount)}`
            : (isPositive 
                ? `Updated wallet cash (+${formatCurrency(diff)})` 
                : `Updated wallet cash (-${formatCurrency(Math.abs(diff))})`),
          paymentMethod: 'Cash',
          date: new Date().toISOString(),
          createdAt: serverTimestamp(),
          isReconciliation: true
        });
      }

      await setDoc(doc(db, 'users', user.uid), {
        physicalWallet: {
          amount: numAmount,
          updatedAt: serverTimestamp(),
          note: walletNote.trim(),
          denominations: denominations
        }
      }, { merge: true });

      setPhysicalWalletData({
        amount: numAmount,
        updatedAt: new Date(),
        note: walletNote.trim(),
        denominations: { ...denominations }
      });

      setSyncMessage({
        type: 'success',
        text: `Physical wallet balance successfully updated to ${formatCurrency(numAmount)}!`
      });

      setShowRecount(false);

      setTimeout(() => {
        setSyncMessage(null);
      }, 5000);
    } catch (err) {
      console.error("Error saving physical wallet:", err);
      setSyncMessage({ type: 'error', text: 'Failed to update physical wallet. Please try again.' });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this cash transaction record?")) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
      } catch (err) {
        console.error("Error deleting cash transaction:", err);
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No cash transactions to export.");
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Payment Mode', 'Type', 'Amount', 'Currency'];
    const rows = filteredTransactions.map(tx => [
      format(tx.parsedDate, 'yyyy-MM-dd'),
      `"${(tx.description || tx.category).replace(/"/g, '""')}"`,
      `"${tx.category.replace(/"/g, '""')}"`,
      `"Cash"`,
      tx.amount > 0 ? 'Cash In' : 'Cash Out',
      Math.abs(tx.amount).toFixed(2),
      CURRENCY_SYMBOL
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spendwise_cash_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Cash Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-700">
              <Banknote size={20} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Cash In Hand & Wallet
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Audit your physical cash spending, ATM withdrawals, and live cash in hand.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Button 
            variant="secondary" 
            icon={Download} 
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial rounded-xl text-xs sm:text-sm font-bold shadow-sm"
          >
            Export Cash CSV
          </Button>
          <Button 
            variant="secondary" 
            icon={Printer} 
            onClick={handlePrint}
            className="rounded-xl text-xs sm:text-sm font-bold shadow-sm p-2.5 sm:px-3"
            title="Print Cash Records"
          >
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button 
            icon={Plus} 
            onClick={() => openCashActionModal('expense')}
            className="flex-1 sm:flex-initial rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100"
          >
            Log Cash Expense
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CashActionModal 
        isOpen={cashModalOpen} 
        onClose={() => setCashModalOpen(false)} 
        mode={cashModalMode}
        currentWalletDenominations={activeDenominations}
        currentWalletBalance={stats.cashBalance}
        onSuccess={(msg) => {
          setSyncMessage({ type: 'success', text: msg });
          setTimeout(() => setSyncMessage(null), 5000);
        }}
      />

      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />

      {/* Notification / Success / Error Banner */}
      {syncMessage && (
        <div className={twMerge(
          "p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200",
          syncMessage.type === 'success' 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
            : "bg-red-50 text-danger border border-red-200"
        )}>
          <div className="flex items-center gap-2">
            {syncMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-danger shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSyncMessage(null)}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Physical Wallet Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -bottom-8 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-36 h-36 bg-emerald-400/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md text-white shadow-xs">
                <Wallet size={24} />
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                  <span>Physical Wallet Cash</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </span>
                <p className="text-xs text-emerald-100/80 font-medium">
                  Actual money in your physical leather wallet or pocket
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90">
                Current Wallet Balance
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mt-1">
                {formatCurrency(stats.cashBalance)}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm text-emerald-100 font-semibold border border-white/10">
                Total Spent: <strong className="text-white">{formatCurrency(stats.cashOut)}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm text-emerald-100 font-semibold border border-white/10">
                Total Added: <strong className="text-white">{formatCurrency(stats.cashIn)}</strong>
              </span>
              {physicalWalletData.updatedAt && (
                <span className="px-3 py-1.5 rounded-xl bg-black/15 backdrop-blur-sm text-emerald-200 font-medium">
                  Last counted: {format(physicalWalletData.updatedAt, 'MMM dd, hh:mm a')}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full lg:w-auto">
            {/* Spend Button */}
            <button
              type="button"
              onClick={() => openCashActionModal('expense')}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-emerald-950 font-black text-sm shadow-lg shadow-black/15 hover:bg-emerald-50 active:scale-98 transition-all"
            >
              <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <ArrowDownLeft size={16} />
              </span>
              <span>- Spend from Wallet</span>
            </button>

            {/* Add Cash Button */}
            <button
              type="button"
              onClick={() => openCashActionModal('income')}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-black text-sm border border-white/20 active:scale-98 transition-all"
            >
              <span className="w-6 h-6 rounded-lg bg-emerald-500/30 text-emerald-200 flex items-center justify-center">
                <ArrowUpRight size={16} />
              </span>
              <span>+ Add Cash to Wallet</span>
            </button>

            {/* Recount / Set Balance Button */}
            <button
              type="button"
              onClick={() => {
                setWalletInputAmount(String(stats.cashBalance || ''));
                setShowRecount(prev => !prev);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 text-xs font-bold transition-all"
            >
              <Edit3 size={14} />
              <span>{showRecount ? 'Close Recount Tool' : 'Recount / Set Starting Cash'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notes & Coins Breakdown Card (Always Visible) */}
      <Card className="p-5 sm:p-6 border-emerald-100/90 bg-white rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Coins size={18} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                  Notes & Coins in Your Wallet
                </h3>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {formatCurrency(stats.cashBalance)}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Exact physical currency breakdown currently in your pocket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => openCashActionModal('expense')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <ArrowDownLeft size={13} />
              <span>Spend Bills</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWalletInputAmount(String(stats.cashBalance || ''));
                setShowRecount(true);
                setShowDenominations(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <Edit3 size={13} />
              <span>Recount Notes</span>
            </button>
          </div>
        </div>

        {/* Visual Note Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {denominationNotes.map((note) => {
            const count = parseInt(activeDenominations?.[note.value], 10) || 0;
            const subtotal = count * note.value;
            const hasNotes = count > 0;
            return (
              <div 
                key={note.value}
                className={twMerge(
                  "p-3 rounded-2xl border transition-all flex flex-col justify-between",
                  hasNotes 
                    ? `${note.color} ring-1 ring-emerald-500/20 shadow-xs` 
                    : "bg-gray-50/60 border-gray-100 text-gray-400 opacity-60"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">{note.label}</span>
                  {hasNotes ? (
                    <span className="text-[11px] font-black px-1.5 py-0.5 rounded-md bg-white text-emerald-900 shadow-2xs border border-gray-200/50">
                      ×{count}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-300 font-semibold">0</span>
                  )}
                </div>
                <div className="mt-2.5">
                  <p className={twMerge(
                    "text-sm font-black",
                    hasNotes ? "text-gray-900" : "text-gray-400"
                  )}>
                    {formatCurrency(subtotal)}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500">
                    {count} {count === 1 ? 'bill' : 'bills'}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Coins Chip */}
          <div className={twMerge(
            "p-3 rounded-2xl border transition-all flex flex-col justify-between",
            (parseFloat(activeDenominations?.coins) || 0) > 0
              ? "bg-amber-50 border-amber-200 text-amber-900 ring-1 ring-amber-500/20 shadow-xs"
              : "bg-gray-50/60 border-gray-100 text-gray-400 opacity-60"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">Coins</span>
              <Coins size={14} className="text-amber-600" />
            </div>
            <div className="mt-2.5">
              <p className="text-sm font-black text-gray-900">
                {formatCurrency(parseFloat(activeDenominations?.coins) || 0)}
              </p>
              <p className="text-[10px] font-bold text-gray-500">
                Loose change
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recount & Set Wallet Balance Drawer */}
      {showRecount && (
        <Card className="p-5 sm:p-7 border-emerald-200 bg-white rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Calculator size={18} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                  Recount or Set Wallet Cash
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Type the exact money currently in your pocket to update your wallet balance.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRecount(false)}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSavePhysicalWallet} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Exact Cash Currently in Wallet
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-extrabold text-base">
                    {CURRENCY_SYMBOL}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={walletInputAmount}
                    onChange={(e) => setWalletInputAmount(e.target.value)}
                    placeholder="e.g. 700"
                    className="w-full pl-8 pr-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-extrabold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Wallet Label (Optional)
                </label>
                <input
                  type="text"
                  value={walletNote}
                  onChange={(e) => setWalletNote(e.target.value)}
                  placeholder="e.g. Pocket wallet, cash drawer"
                  className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Note Counter toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowDenominations(prev => !prev)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 py-1"
              >
                <Coins size={15} />
                <span>{showDenominations ? 'Hide bill counter' : 'Count with ₹500, ₹200, ₹100 bills & coins'}</span>
                {showDenominations ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            {/* Bill counter grid */}
            {showDenominations && (
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                  <span className="text-xs font-bold text-gray-700">Count Individual Notes</span>
                  <button
                    type="button"
                    onClick={handleResetDenominations}
                    className="text-[11px] font-bold text-gray-400 hover:text-danger flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {denominationNotes.map((note) => {
                    const count = denominations[note.value] ?? '';
                    const subtotal = (parseInt(count, 10) || 0) * note.value;
                    return (
                      <div key={note.value} className={twMerge("p-2.5 rounded-xl border bg-white shadow-2xs", note.color)}>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{note.label}</span>
                          <span className="text-[10px] text-gray-500">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            type="button"
                            onClick={() => handleStepDenomination(note.value, -1)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={count}
                            onChange={(e) => handleDenominationChange(note.value, e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1 text-xs font-bold bg-gray-50 rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleStepDenomination(note.value, 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-gray-200">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Coins & Loose Change</p>
                    <p className="text-[10px] text-gray-400">Total coin value in {CURRENCY_SYMBOL}</p>
                  </div>
                  <div className="relative w-full sm:w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                      {CURRENCY_SYMBOL}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={denominations.coins}
                      onChange={handleCoinChange}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg text-right"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowRecount(false)}
                className="rounded-xl px-4 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={syncLoading}
                className="rounded-xl px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100"
              >
                {syncLoading ? 'Saving...' : `Update Wallet to ${formatCurrency(parseFloat(walletInputAmount) || 0)}`}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Category Breakdown (If any expenses) */}
      {categoryBreakdown.length > 0 && (
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon size={16} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900">Where Does Your Cash Go?</h3>
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase">Top Categories</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800 truncate">{item.category}</span>
                  <span className="font-extrabold text-emerald-700">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-[11px] font-bold text-gray-500">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Cash History Card */}
      <Card className="p-4 sm:p-6">
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 mb-6">
          {/* Search bar */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search cash expenses, grocery, tea, auto..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
              {/* Category Filter */}
              <select 
                value={filterCategory} 
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">All Cash Categories</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Sort Dropdown */}
              <select 
                value={sortBy} 
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>

            {/* Type Selector (All / Cash In / Cash Out) */}
            <div className="flex items-center justify-between sm:justify-start bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => { setFilterType('all'); setCurrentPage(1); }} 
                className={twMerge(
                  "flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-center", 
                  filterType === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                All
              </button>
              <button 
                onClick={() => { setFilterType('income'); setCurrentPage(1); }} 
                className={twMerge(
                  "flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-center", 
                  filterType === 'income' ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Cash In (+)
              </button>
              <button 
                onClick={() => { setFilterType('expense'); setCurrentPage(1); }} 
                className={twMerge(
                  "flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-center", 
                  filterType === 'expense' ? "bg-white text-danger shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Cash Out (-)
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Banknote size={32} />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Cash Transactions Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {transactions.length === 0 
                ? "You haven't logged any cash transactions yet. Click below to record cash spending or cash withdrawals."
                : "No cash transactions match your search or filter criteria."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button 
                onClick={() => openCashActionModal('expense')}
                icon={Plus} 
                className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
              >
                Log First Cash Expense
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto min-h-[300px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-y border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="py-4 px-4 text-xs font-semibold text-gray-600 whitespace-nowrap">
                        {tx.dateStr}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={twMerge(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0",
                            tx.amount > 0 ? "bg-green-50 text-green-600" : "bg-emerald-50 text-emerald-700"
                          )}>
                            {tx.amount > 0 ? <TrendingUp size={16} /> : <Banknote size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight flex items-center gap-1.5">
                              <span>{tx.description || tx.category}</span>
                              {tx.receiptUrl && (
                                <span title="Receipt Attached" className="text-emerald-600 cursor-pointer" onClick={() => setSelectedReceipt(tx.receiptUrl)}>
                                  <FileText size={13} />
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                <Banknote size={10} /> Physical Cash
                              </span>
                              {tx.notesSummary && (
                                <span className="inline-flex items-center text-[10px] font-black text-emerald-950 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                                  {tx.notesSummary}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={tx.amount > 0 ? 'success' : 'info'}>
                          {tx.category}
                        </Badge>
                      </td>
                      <td className={twMerge(
                        "py-4 px-4 text-sm font-black text-right whitespace-nowrap",
                        tx.amount > 0 ? "text-green-600" : "text-danger"
                      )}>
                        {formatCurrency(tx.amount, { showSign: true })}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Completed
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right relative">
                        <div className="relative inline-block text-left">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenuId(prev => prev === tx.id ? null : tx.id);
                            }}
                            className={twMerge(
                              "p-1.5 rounded-lg transition-all",
                              activeActionMenuId === tx.id 
                                ? "bg-gray-200 text-gray-900" 
                                : "text-gray-400 hover:text-gray-800 hover:bg-gray-100"
                            )}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeActionMenuId === tx.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-30 cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(null);
                                }}
                              />
                              <div 
                                className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDetailTx(tx);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                >
                                  <Eye size={15} className="text-emerald-600" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTransaction(tx);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                >
                                  <Edit3 size={15} className="text-amber-500" />
                                  <span>Edit Transaction</span>
                                </button>

                                {tx.receiptUrl && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedReceipt(tx.receiptUrl);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                  >
                                    <FileText size={15} className="text-emerald-600" />
                                    <span>View Receipt</span>
                                  </button>
                                )}

                                <div className="my-1 border-t border-gray-100" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleDelete(tx.id);
                                  }}
                                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-danger hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                                >
                                  <Trash2 size={15} />
                                  <span>Delete Transaction</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 min-h-[220px]">
              {paginatedTransactions.map((tx) => (
                <div key={tx.id} className="py-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={twMerge(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        tx.amount > 0 ? "bg-green-50 text-green-600" : "bg-emerald-50 text-emerald-700"
                      )}>
                        {tx.amount > 0 ? <TrendingUp size={16} /> : <Banknote size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 leading-tight truncate flex items-center gap-1.5">
                          <span>{tx.description || tx.category}</span>
                          {tx.receiptUrl && (
                            <span title="Receipt Attached" className="text-emerald-600" onClick={() => setSelectedReceipt(tx.receiptUrl)}>
                              <FileText size={12} />
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          {tx.dateStr}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={twMerge(
                        "text-sm font-black",
                        tx.amount > 0 ? "text-green-600" : "text-danger"
                      )}>
                        {formatCurrency(tx.amount, { showSign: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={tx.amount > 0 ? 'success' : 'info'} className="text-[10px]">
                        {tx.category}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <Banknote size={11} /> Cash
                      </span>
                      {tx.notesSummary && (
                        <span className="inline-flex items-center text-[10px] font-black text-emerald-950 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                          {tx.notesSummary}
                        </span>
                      )}
                    </div>

                    <div className="relative inline-block text-left">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionMenuId(prev => prev === tx.id ? null : tx.id);
                        }}
                        className={twMerge(
                          "p-1.5 rounded-lg transition-all",
                          activeActionMenuId === tx.id 
                            ? "bg-gray-200 text-gray-900" 
                            : "text-gray-400 hover:text-gray-800 hover:bg-gray-100"
                        )}
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeActionMenuId === tx.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-30 cursor-default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenuId(null);
                            }}
                          />
                          <div 
                            className="absolute right-0 bottom-full mb-1.5 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDetailTx(tx);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                            >
                              <Eye size={15} className="text-emerald-600" />
                              <span>View Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingTransaction(tx);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                            >
                              <Edit3 size={15} className="text-amber-500" />
                              <span>Edit Transaction</span>
                            </button>

                            {tx.receiptUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReceipt(tx.receiptUrl);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                              >
                                <FileText size={15} className="text-emerald-600" />
                                <span>View Receipt</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-gray-100" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuId(null);
                                handleDelete(tx.id);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-danger hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                            >
                              <Trash2 size={15} />
                              <span>Delete Transaction</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-semibold text-gray-400 text-center sm:text-left">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length)} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} cash records
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="p-2 border-gray-200 rounded-xl"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-xs font-bold px-3 py-1 bg-emerald-600 text-white rounded-lg shadow-sm">
                  {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="p-2 border-gray-200 rounded-xl"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* High-Resolution Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setSelectedReceipt(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100 mb-3 sm:mb-4 shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                Receipt Preview
              </h3>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-gray-50 p-2 flex items-center justify-center min-h-[160px] max-h-[55vh]">
              <img 
                src={selectedReceipt} 
                alt="Receipt Document" 
                className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-sm" 
              />
            </div>

            <div className="pt-3 sm:pt-4 flex flex-wrap items-center justify-end gap-2 sm:gap-3 shrink-0">
              <a 
                href={selectedReceipt} 
                download="spendwise_cash_receipt.jpg"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Download size={14} />
                Download
              </a>
              <a 
                href={selectedReceipt} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
              >
                <ExternalLink size={14} />
                Full Size
              </a>
              <Button 
                onClick={() => setSelectedReceipt(null)}
                size="sm"
                className="rounded-xl px-4 py-2 text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedDetailTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setSelectedDetailTx(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col space-y-4 sm:space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className={twMerge(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                  selectedDetailTx.amount > 0 ? "bg-green-50 text-green-600" : "bg-emerald-50 text-emerald-700"
                )}>
                  {selectedDetailTx.amount > 0 ? <TrendingUp size={20} /> : <Banknote size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                    Cash Transaction Details
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Physical currency audit record
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDetailTx(null)}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Amount Hero Box */}
            <div className={twMerge(
              "rounded-2xl p-4 text-center border",
              selectedDetailTx.amount > 0 ? "bg-green-50/60 border-green-100" : "bg-emerald-50/60 border-emerald-100"
            )}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {selectedDetailTx.amount > 0 ? 'Cash Inflow (Added)' : 'Cash Outflow (Spent)'}
              </span>
              <h2 className={twMerge(
                "text-3xl font-black mt-1",
                selectedDetailTx.amount > 0 ? "text-green-600" : "text-emerald-800"
              )}>
                {formatCurrency(selectedDetailTx.amount, { showSign: true })}
              </h2>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Category
                </span>
                <Badge variant={selectedDetailTx.amount > 0 ? 'success' : 'info'} className="text-xs">
                  {selectedDetailTx.category}
                </Badge>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Status
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                  <CheckCircle2 size={14} />
                  Cash Verified
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Date
                </span>
                <p className="font-bold text-gray-800">
                  {selectedDetailTx.dateStr}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Payment Mode
                </span>
                <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <Banknote size={15} />
                  <span>Physical Cash</span>
                </p>
              </div>
            </div>

            {/* Description / Notes */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Description / Memo
              </span>
              <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                {selectedDetailTx.description || selectedDetailTx.category || "No description provided."}
              </p>
            </div>

            {/* Notes / Bills Spent */}
            {selectedDetailTx.notesSummary && (
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Cash Bills & Notes
                </span>
                <p className="text-xs font-black text-emerald-950">
                  {selectedDetailTx.notesSummary}
                </p>
              </div>
            )}

            {/* Receipt Section */}
            {selectedDetailTx.receiptUrl ? (
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText size={18} className="text-emerald-700" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Receipt Attached</p>
                    <p className="text-[10px] text-gray-500">Physical receipt document</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReceipt(selectedDetailTx.receiptUrl);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors inline-flex items-center gap-1"
                >
                  <Eye size={13} />
                  Preview
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[11px] font-medium text-gray-400">No physical receipt attached to this cash record.</p>
              </div>
            )}

            {/* Actions footer */}
            <div className="pt-2 flex items-center justify-between gap-2 sm:gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  const idToDelete = selectedDetailTx.id;
                  setSelectedDetailTx(null);
                  handleDelete(idToDelete);
                }}
                className="px-3 sm:px-3.5 py-2.5 text-xs font-bold text-danger hover:bg-red-50 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const tx = selectedDetailTx;
                    setSelectedDetailTx(null);
                    setEditingTransaction(tx);
                  }}
                  variant="secondary"
                  size="sm"
                  className="rounded-xl px-3.5 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Edit3 size={14} className="text-amber-500" />
                  <span>Edit</span>
                </Button>
                <Button
                  onClick={() => setSelectedDetailTx(null)}
                  size="sm"
                  className="rounded-xl px-5 text-xs font-bold"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashWallet;

