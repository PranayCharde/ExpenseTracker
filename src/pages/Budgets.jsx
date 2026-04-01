import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  ShoppingBag, 
  Film, 
  Utensils, 
  Home, 
  Car,
  ChevronRight,
  Wallet,
  X,
  Trash2
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import { twMerge } from 'tailwind-merge';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { startOfMonth, endOfMonth } from 'date-fns';

import { useCurrency } from '../hooks/useCurrency';

const BudgetCard = ({ id, icon: Icon, title, spent, goal, color = 'blue', onDelete }) => {
  const { symbol: CURRENCY_SYMBOL } = useCurrency();
  const percent = Math.min((spent / goal) * 100, 100);
  const status = percent >= 100 ? 'OVER BUDGET' : percent >= 80 ? 'NEAR LIMIT' : 'SAFE';
  
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    green: 'text-green-600 bg-green-50',
    indigo: 'text-indigo-600 bg-indigo-50',
  };

  const barColors = {
    blue: 'bg-blue-600',
    amber: 'bg-amber-600',
    red: 'bg-red-600',
    green: 'bg-green-600',
    indigo: 'bg-indigo-600',
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between mb-6">
        <div className={twMerge('w-12 h-12 rounded-xl flex items-center justify-center', colors[color] || colors.blue)}>
           <Icon size={24} />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === 'SAFE' ? 'success' : status === 'NEAR LIMIT' ? 'warning' : 'danger'}>
            {status}
          </Badge>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(id); }} 
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Budget"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
      
      <div className="space-y-4 mb-4">
        <div className="flex justify-between items-end">
           <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spent: <span className="text-gray-900">{CURRENCY_SYMBOL}{spent.toFixed(2)}</span></p>
           </div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Goal: {CURRENCY_SYMBOL}{goal.toFixed(2)}</p>
        </div>
        
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
           <div 
             className={twMerge('h-full transition-all duration-1000', barColors[color] || barColors.blue)} 
             style={{ width: `${percent}%` }}
           ></div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
         <span>{percent.toFixed(0)}% of budget used</span>
         <span>•</span>
         <span>Fixed Goal</span>
      </div>
    </Card>
  );
};

const NewBudgetModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !goal) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to create budgets.");
        return;
      }

      console.log("Attempting to create budget for user:", user.uid);

      await addDoc(collection(db, 'users', user.uid, 'budgets'), {
        title,
        goal: parseFloat(goal),
        category: title, // Use title as category for simplicity
        color: ['blue', 'amber', 'indigo', 'green'][Math.floor(Math.random() * 4)],
        createdAt: serverTimestamp()
      });
      
      console.log("Budget created successfully!");
      onClose();
      setTitle('');
      setGoal('');
    } catch (err) {
      console.error("Error creating budget:", err);
      alert("Error creating budget: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">New Budget Plan</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-6">
          <Input 
            label="Category Name" 
            placeholder="e.g. Travel, Health" 
            icon={ShoppingBag}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input 
            label="Monthly Limit ($)" 
            type="number" 
            placeholder="1000" 
            icon={Wallet}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
          />
          
          <Button type="submit" className="w-full py-4 rounded-xl font-bold" disabled={loading}>
            {loading ? 'Creating...' : 'Establish Budget'}
          </Button>
        </form>
      </div>
    </div>
  );
};

import { useAuth } from '../context/AuthContext';

const Budgets = () => {
  const { symbol: CURRENCY_SYMBOL } = useCurrency();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch budgets from user subcollection
    const bQuery = query(collection(db, 'users', user.uid, 'budgets'));
    const unsubscribeB = onSnapshot(bQuery, (snap) => {
      setBudgets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Budgets listener error:", error);
      setLoading(false);
    });

    // Fetch current month transactions from user subcollection
    const now = new Date();
    const tQuery = query(
      collection(db, 'users', user.uid, 'transactions'),
      where('date', '>=', startOfMonth(now)),
      where('date', '<=', endOfMonth(now))
    );
    const unsubscribeT = onSnapshot(tQuery, (snap) => {
      setTransactions(snap.docs.map(doc => doc.data()));
    }, (error) => {
      console.error("Transactions (Budgets) listener error:", error);
    });

    return () => {
      unsubscribeB();
      unsubscribeT();
    };
  }, [user]);

  const budgetStats = useMemo(() => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(tx => tx.category === budget.category && tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return { ...budget, spent };
    });
  }, [budgets, transactions]);

  const handleDeleteBudget = async (id) => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'budgets', id));
      } catch (err) {
        console.error("Error deleting budget:", err);
      }
    }
  };

  const categoryIcons = {
    Groceries: ShoppingBag,
    Entertainment: Film,
    'Dining Out': Utensils,
    'Rent & Utilities': Home,
    Transportation: Car,
    Shopping: ShoppingBag,
    Dining: Utensils,
    Food: Utensils,
    Transport: Car,
    Rent: Home,
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Monthly Budgets</h1>
          <p className="text-gray-500 font-medium">Monitor your spending across all active categories.</p>
        </div>
        <Button icon={Plus} variant="secondary" className="rounded-xl px-6 py-3" onClick={() => setIsModalOpen(true)}>
          Create Budget
        </Button>
      </div>

      <NewBudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgetStats.length === 0 ? (
          <Card className="col-span-full py-16 text-center border-dashed border-2 flex flex-col items-center">
            <Wallet className="text-gray-200 mb-4" size={64} />
            <h3 className="font-bold text-gray-900">No active budgets</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">Create a budget to start tracking your spending limits.</p>
            <Button onClick={() => setIsModalOpen(true)} className="rounded-xl">Add My First Budget</Button>
          </Card>
        ) : (
          budgetStats.map((budget) => (
            <BudgetCard 
              key={budget.id}
              id={budget.id}
              icon={categoryIcons[budget.category] || ShoppingBag} 
              title={budget.title} 
              spent={budget.spent} 
              goal={budget.goal} 
              color={budget.color}
              onDelete={handleDeleteBudget}
            />
          ))
        )}

        {budgetStats.length > 0 && (
          <Card 
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center text-center p-8 hover:bg-gray-50 hover:border-brand-primary transition-all cursor-pointer group"
          >
             <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-brand-primary transition-colors mb-4 border border-gray-100">
                <Plus size={24} />
             </div>
             <h3 className="text-sm font-bold text-gray-900 mb-1">Create New Budget</h3>
             <p className="text-[11px] text-gray-500 font-medium">Set limits for a new spending category</p>
          </Card>
        )}
      </div>

      {/* Savings Goals Snapshot */}
      <div className="space-y-6 pt-4">
        <h2 className="text-lg font-bold text-gray-900">Financial Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-br from-brand-primary to-indigo-700 text-white border-none shadow-xl shadow-blue-200">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md"><Plus className="rotate-45" size={24} /></div>
                <div>
                   <h4 className="font-bold">Pro Tip</h4>
                   <p className="text-white/70 text-xs">Based on current spending</p>
                </div>
             </div>
             <p className="text-sm font-medium leading-relaxed mb-4">
               Keep track of your spending habits and save more! Every dollar counts towards your financial freedom.
             </p>
             <div className="flex gap-2">
                <div className="h-1 rounded-full bg-white/20 flex-1 overflow-hidden">
                   <div className="h-full bg-white transition-all duration-1000" style={{ width: '84%' }}></div>
                </div>
             </div>
          </Card>

          <Card className="p-6">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Wallet size={24} /></div>
                <div>
                   <h4 className="text-sm font-bold text-gray-900">Total Budget Capacity</h4>
                   <p className="text-xs text-gray-500">Across all categories</p>
                </div>
             </div>
             <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-extrabold text-gray-900">{CURRENCY_SYMBOL}{budgetStats.reduce((sum, b) => sum + b.goal, 0).toLocaleString()}</span>
                <span className="text-sm font-bold text-gray-400 mb-1">/ Month</span>
             </div>
             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-primary transition-all duration-1000" 
                  style={{ 
                    width: `${Math.min((budgetStats.reduce((sum, b) => sum + b.spent, 0) / (budgetStats.reduce((sum, b) => sum + b.goal, 0) || 1)) * 100, 100)}%` 
                  }}
                ></div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Budgets;
