import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  ShoppingBag, 
  Film, 
  Utensils, 
  Home, 
  Car, 
  Heart,
  Briefcase,
  Zap,
  GraduationCap,
  Wallet,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Layers
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import { twMerge } from 'tailwind-merge';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { startOfMonth, endOfMonth, addMonths, subMonths, format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../hooks/useCurrency';
import { EXPENSE_CATEGORIES } from '../utils/constants';

const CATEGORY_ICONS = {
  Shopping: ShoppingBag,
  'Dining & Food': Utensils,
  Dining: Utensils,
  Food: Utensils,
  Groceries: ShoppingBag,
  Transportation: Car,
  Transport: Car,
  'Housing & Rent': Home,
  Rent: Home,
  Entertainment: Film,
  'Utilities & Bills': Zap,
  Healthcare: Heart,
  Travel: Briefcase,
  Education: GraduationCap,
  Other: Layers
};

const COLOR_VARIANTS = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    bar: 'bg-blue-600',
    border: 'border-blue-100'
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    bar: 'bg-emerald-600',
    border: 'border-emerald-100'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    bar: 'bg-purple-600',
    border: 'border-purple-100'
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    bar: 'bg-amber-600',
    border: 'border-amber-100'
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    bar: 'bg-rose-600',
    border: 'border-rose-100'
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    bar: 'bg-cyan-600',
    border: 'border-cyan-100'
  }
};

const BudgetCard = ({ id, category, spent, goal, color = 'blue', onDelete }) => {
  const { formatCurrency } = useCurrency();
  const Icon = CATEGORY_ICONS[category] || Layers;
  const theme = COLOR_VARIANTS[color] || COLOR_VARIANTS.blue;

  const percent = goal > 0 ? (spent / goal) * 100 : 0;
  const clampedPercent = Math.min(percent, 100);
  const remaining = Math.max(goal - spent, 0);

  const status = percent >= 100 ? 'OVER BUDGET' : percent >= 80 ? 'NEAR LIMIT' : 'SAFE';

  return (
    <Card className="hover:shadow-md transition-all duration-200 group border border-gray-100">
      <div className="flex items-start justify-between mb-5">
        <div className={twMerge('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm', theme.bg, theme.text)}>
          <Icon size={22} />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === 'SAFE' ? 'success' : status === 'NEAR LIMIT' ? 'warning' : 'danger'}>
            {status}
          </Badge>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(id); }} 
            className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Budget"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 leading-tight">{category}</h3>
        <p className="text-xs text-gray-400 font-medium mt-0.5">
          {remaining > 0 ? `${formatCurrency(remaining)} remaining` : `Exceeded by ${formatCurrency(spent - goal)}`}
        </p>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-end text-xs font-bold">
          <span className="text-gray-500">
            Spent: <span className="text-gray-900 font-extrabold">{formatCurrency(spent)}</span>
          </span>
          <span className="text-gray-400">
            Limit: {formatCurrency(goal)}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={twMerge('h-full transition-all duration-700 rounded-full', 
              percent >= 100 ? 'bg-danger' : theme.bar
            )} 
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] font-bold text-gray-400">
        <span className={percent >= 100 ? 'text-danger font-extrabold' : 'text-gray-600'}>
          {percent.toFixed(0)}% used
        </span>
        <span>Monthly Target</span>
      </div>
    </Card>
  );
};

const NewBudgetModal = ({ isOpen, onClose }) => {
  const { symbol: CURRENCY_SYMBOL } = useCurrency();
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [goal, setGoal] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const targetCategory = isCustom ? customCategory.trim() : category;
    if (!targetCategory) {
      setError("Please choose or enter a category name.");
      return;
    }

    const parsedGoal = parseFloat(goal);
    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      setError("Please enter a valid monthly limit amount.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to create budgets.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'budgets'), {
        title: targetCategory,
        category: targetCategory,
        goal: parsedGoal,
        color: selectedColor,
        createdAt: serverTimestamp()
      });
      
      onClose();
      setGoal('');
      setCustomCategory('');
      setIsCustom(false);
    } catch (err) {
      console.error("Error creating budget:", err);
      setError(err.message || "Failed to create budget.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Set Category Budget</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Define your monthly spending envelope</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-danger text-xs font-bold border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSave} className="space-y-5">
          {/* Category Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Category
            </label>
            {!isCustom ? (
              <div className="space-y-2">
                <select 
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustom(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom__">+ Custom Category...</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. Gym & Fitness, Subscriptions"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setIsCustom(false)}
                  className="px-3 rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Monthly Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Monthly Limit ({CURRENCY_SYMBOL})
            </label>
            <input 
              type="number" 
              step="0.01"
              min="1"
              placeholder="e.g. 500" 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Color Tag */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Color Tag
            </label>
            <div className="flex items-center gap-3 pt-1">
              {Object.keys(COLOR_VARIANTS).map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  className={twMerge(
                    "w-7 h-7 rounded-full transition-transform",
                    COLOR_VARIANTS[col].bar,
                    selectedColor === col ? "ring-4 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"
                  )}
                />
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <Button type="submit" className="w-full py-3.5 rounded-xl font-bold shadow-md shadow-blue-100" disabled={loading}>
              {loading ? 'Establishing...' : 'Create Budget'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Budgets = () => {
  const { user } = useAuth();
  const { formatCurrency, symbol: CURRENCY_SYMBOL } = useCurrency();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch budgets from user subcollection
  useEffect(() => {
    if (!user) return;

    const bQuery = query(collection(db, 'users', user.uid, 'budgets'));
    const unsubscribeB = onSnapshot(bQuery, (snap) => {
      setBudgets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Budgets listener error:", error);
      setLoading(false);
    });

    return () => unsubscribeB();
  }, [user]);

  // Fetch transactions for real-time tracking
  useEffect(() => {
    if (!user) return;

    const tQuery = query(collection(db, 'users', user.uid, 'transactions'));
    const unsubscribeT = onSnapshot(tQuery, (snap) => {
      const txs = snap.docs.map(doc => {
        const d = doc.data();
        let jsDate = new Date();
        if (d.date?.toDate) jsDate = d.date.toDate();
        else if (d.createdAt?.toDate) jsDate = d.createdAt.toDate();
        else if (d.date) jsDate = new Date(d.date);

        return { ...d, jsDate };
      });
      setTransactions(txs);
    }, (error) => {
      console.error("Transactions (Budgets) listener error:", error);
    });

    return () => unsubscribeT();
  }, [user]);

  // Calculate stats for the selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const monthTransactions = useMemo(() => {
    return transactions.filter(tx => tx.jsDate >= monthStart && tx.jsDate <= monthEnd);
  }, [transactions, monthStart, monthEnd]);

  const budgetStats = useMemo(() => {
    return budgets.map(budget => {
      const spent = monthTransactions
        .filter(tx => tx.category === budget.category && tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return { ...budget, spent };
    });
  }, [budgets, monthTransactions]);

  const totalBudgeted = useMemo(() => {
    return budgets.reduce((sum, b) => sum + (Number(b.goal) || 0), 0);
  }, [budgets]);

  const totalSpentInBudgets = useMemo(() => {
    return budgetStats.reduce((sum, b) => sum + b.spent, 0);
  }, [budgetStats]);

  const overallPercent = totalBudgeted > 0 ? (totalSpentInBudgets / totalBudgeted) * 100 : 0;
  const overallRemaining = Math.max(totalBudgeted - totalSpentInBudgets, 0);

  const handleDeleteBudget = async (id) => {
    if (window.confirm("Are you sure you want to delete this budget category?")) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'budgets', id));
      } catch (err) {
        console.error("Error deleting budget:", err);
      }
    }
  };

  const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));
  const handleCurrentMonth = () => setSelectedMonth(new Date());

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-brand-primary border-t-transparent"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Monthly Budgets
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Keep your spending in check with categorized limits updated in real-time.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          {/* Month Switcher */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={handlePrevMonth} 
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="px-2.5 sm:px-3 text-xs font-bold text-gray-800 hover:text-brand-primary whitespace-nowrap"
              title="Jump to Current Month"
            >
              {format(selectedMonth, 'MMM yyyy')}
            </button>
            <button 
              onClick={handleNextMonth} 
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Button 
            onClick={() => setIsModalOpen(true)}
            icon={Plus} 
            className="rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-100 whitespace-nowrap"
          >
            Add Budget
          </Button>
        </div>
      </div>

      <NewBudgetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      />

      {/* Overview Progress Banner */}
      {budgets.length > 0 && (
        <Card className="p-5 sm:p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-200/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-200 uppercase tracking-widest">
                {format(selectedMonth, 'MMMM yyyy')} Budget Overview
              </span>
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl sm:text-4xl font-black">
                  {formatCurrency(totalSpentInBudgets)}
                </h2>
                <span className="text-sm font-semibold text-blue-100">
                  of {formatCurrency(totalBudgeted)} allocated
                </span>
              </div>
              <p className="text-xs text-blue-200">
                {overallRemaining > 0 
                  ? `${formatCurrency(overallRemaining)} left across all budgeted categories`
                  : `Total budget limit reached by ${formatCurrency(totalSpentInBudgets - totalBudgeted)}`}
              </p>
            </div>

            <div className="w-full md:w-64 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-100">
                <span>Total Spent</span>
                <span>{overallPercent.toFixed(0)}%</span>
              </div>
              <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden p-0.5 backdrop-blur-sm">
                <div 
                  className={twMerge(
                    "h-full rounded-full transition-all duration-700",
                    overallPercent >= 100 ? "bg-amber-400" : "bg-white"
                  )} 
                  style={{ width: `${Math.min(overallPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Budgets Grid or Empty State */}
      {budgets.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Budgets Configured Yet</h3>
          <p className="text-xs text-gray-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Create monthly budget envelopes for Groceries, Dining, Rent, and other categories to stay within your limits.
          </p>
          <Button 
            onClick={() => setIsModalOpen(true)}
            icon={Plus} 
            className="mt-5 rounded-xl font-bold shadow-md shadow-blue-100"
          >
            Create Your First Budget
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetStats.map((budget) => (
            <BudgetCard 
              key={budget.id}
              id={budget.id}
              category={budget.category}
              goal={Number(budget.goal) || 0}
              spent={budget.spent}
              color={budget.color || 'blue'}
              onDelete={handleDeleteBudget}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Budgets;