import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  ShoppingBag, 
  Coffee,
  MoreHorizontal,
  Receipt,
  ArrowRight,
  Wallet,
  PiggyBank,
  CheckCircle2,
  Calendar,
  Eye,
  ExternalLink,
  Download,
  FileText,
  Camera,
  Sparkles,
  X
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import NewTransactionModal from '../components/common/NewTransactionModal';
import AutoLogReceiptModal from '../components/common/AutoLogReceiptModal';
import { twMerge } from 'tailwind-merge';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Filler, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../hooks/useCurrency';
import { Link } from 'react-router-dom';
import { startOfMonth, endOfMonth, format, subDays } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const { formatCurrency, symbol: CURRENCY_SYMBOL } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoLogModalOpen, setIsAutoLogModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30D'); // '7D', '30D', '90D', '6M', '1Y'

  const currentMonthLabel = format(new Date(), 'MMM');
  const fullMonthLabel = format(new Date(), 'MMMM yyyy');

  useEffect(() => {
    if (!user) return;

    // Listen to user transactions
    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeT = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => {
        const d = doc.data();
        let jsDate = new Date();
        if (d.date?.toDate) jsDate = d.date.toDate();
        else if (d.createdAt?.toDate) jsDate = d.createdAt.toDate();
        else if (d.date) jsDate = new Date(d.date);

        return {
          id: doc.id,
          ...d,
          parsedDate: jsDate,
          dateStr: format(jsDate, 'MMM dd, yyyy')
        };
      });
      setTransactions(txs);
      setLoading(false);
    }, (error) => {
      console.error("Dashboard listener error:", error);
      setLoading(false);
    });

    // Listen to user budgets
    const bQuery = query(collection(db, 'users', user.uid, 'budgets'));
    const unsubscribeB = onSnapshot(bQuery, (snap) => {
      setBudgets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Budgets dashboard error", err));

    return () => {
      unsubscribeT();
      unsubscribeB();
    };
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const totalIncome = transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalBalance = totalIncome - totalExpenses;

    // Month-specific stats
    const monthTxs = transactions.filter(tx => tx.parsedDate >= currentMonthStart && tx.parsedDate <= currentMonthEnd);
    const monthIncome = monthTxs
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const monthExpenses = monthTxs
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const savingsRate = monthIncome > 0 
      ? Math.max(0, ((monthIncome - monthExpenses) / monthIncome) * 100) 
      : 0;

    return { 
      totalBalance, 
      totalIncome, 
      totalExpenses, 
      monthIncome, 
      monthExpenses,
      savingsRate
    };
  }, [transactions]);

  // Chart aggregation based on chosen timeframe
  const chartData = useMemo(() => {
    let days = 30;
    let points = 6;

    if (timeframe === '7D') {
      days = 7;
      points = 7;
    } else if (timeframe === '30D') {
      days = 30;
      points = 6;
    } else if (timeframe === '90D') {
      days = 90;
      points = 6;
    } else if (timeframe === '6M') {
      days = 180;
      points = 6;
    } else if (timeframe === '1Y') {
      days = 365;
      points = 12;
    }

    const intervalDays = Math.max(1, Math.floor(days / points));

    const labels = [];
    const spendingData = [];
    const incomeData = [];

    for (let i = points - 1; i >= 0; i--) {
      const pointEnd = subDays(new Date(), i * intervalDays);
      const pointStart = subDays(pointEnd, intervalDays);

      const labelFormat = days <= 30 ? 'MMM dd' : 'MMM yyyy';
      labels.push(format(pointEnd, labelFormat));

      const periodSpending = transactions
        .filter(tx => tx.amount < 0 && tx.parsedDate >= pointStart && tx.parsedDate <= pointEnd)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      const periodIncome = transactions
        .filter(tx => tx.amount > 0 && tx.parsedDate >= pointStart && tx.parsedDate <= pointEnd)
        .reduce((sum, tx) => sum + tx.amount, 0);

      spendingData.push(periodSpending);
      incomeData.push(periodIncome);
    }

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: 'Spending',
          data: spendingData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: '#ef4444',
          pointHoverRadius: 6,
        },
        {
          fill: true,
          label: 'Income',
          data: incomeData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: '#22c55e',
          pointHoverRadius: 6,
        }
      ],
    };
  }, [transactions, timeframe]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        align: 'end',
        labels: { boxWidth: 10, usePointStyle: true, font: { size: 11, weight: 'bold' } }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#0f172a',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      },
    },
    scales: {
      y: { 
        display: true, 
        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
        ticks: { 
          color: '#94a3b8', 
          font: { size: 10, weight: '600' },
          callback: (value) => `${CURRENCY_SYMBOL}${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`
        }
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11, weight: '600' } }
      },
    },
  };

  // Recent 5 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // Top 3 active budgets with calculated spend
  const topBudgets = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const monthTxs = transactions.filter(tx => tx.parsedDate >= currentMonthStart && tx.parsedDate <= currentMonthEnd);
    return budgets.slice(0, 3).map(b => {
      const spent = monthTxs
        .filter(tx => tx.category === b.category && tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return { ...b, spent };
    });
  }, [budgets, transactions]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-brand-primary border-t-transparent"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'Member';

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Financial Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Welcome back, <span className="text-brand-primary font-bold">{userDisplayName}</span>! Here is your live financial snapshot.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsAutoLogOpen ? setIsAutoLogModalOpen(true) : setIsAutoLogModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-md shadow-emerald-200 text-xs sm:text-sm font-bold transition-all active:scale-[0.98]"
          >
            <Camera size={16} />
            <span>Auto-Log Receipt</span>
            <span className="bg-white/20 text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md tracking-wider flex items-center gap-0.5">
              <Sparkles size={9} /> AI
            </span>
          </button>
          <Button 
            icon={Plus} 
            className="rounded-xl shadow-md shadow-blue-100 text-xs sm:text-sm font-bold"
            onClick={() => setIsModalOpen(true)}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      <AutoLogReceiptModal
        isOpen={isAutoLogModalOpen}
        onClose={() => setIsAutoLogModalOpen(false)}
      />

      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Net Balance */}
        <Card className="hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/60 text-brand-primary dark:text-blue-400 rounded-xl flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/60 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              Net Worth
            </span>
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Balance</p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 whitespace-nowrap">
            {formatCurrency(stats.totalBalance)}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">All recorded accounts</p>
        </Card>

        {/* Monthly Income */}
        <Card className="hover:border-green-200 dark:hover:border-green-900/50 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/60 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              {currentMonthLabel}
            </span>
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Monthly Income</p>
          <h2 className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400 mt-1 whitespace-nowrap">
            {formatCurrency(stats.monthIncome)}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Earned this month</p>
        </Card>

        {/* Monthly Expenses */}
        <Card className="hover:border-red-200 dark:hover:border-red-900/50 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 bg-red-50 dark:bg-red-950/60 text-danger dark:text-red-400 rounded-xl flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <span className="text-danger dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              {currentMonthLabel}
            </span>
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Monthly Spending</p>
          <h2 className="text-2xl sm:text-3xl font-black text-danger dark:text-red-400 mt-1 whitespace-nowrap">
            {formatCurrency(stats.monthExpenses)}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Spent this month</p>
        </Card>

        {/* Savings Rate */}
        <Card className="hover:border-purple-200 dark:hover:border-purple-900/50 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <PiggyBank size={20} />
            </div>
            <span className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              Savings
            </span>
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Savings Rate</p>
          <h2 className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1 whitespace-nowrap">
            {stats.savingsRate.toFixed(1)}%
          </h2>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Of monthly earnings saved</p>
        </Card>
      </div>

      {/* Cashflow & Spending Trend Chart */}
      <Card className="hover:border-gray-200 dark:hover:border-slate-700/60 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Cashflow Trends</h3>
            <p className="text-xs text-gray-400 dark:text-slate-400 font-medium mt-0.5">Track your income vs expense curves over time</p>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-between sm:justify-start border border-transparent dark:border-slate-700/60">
            {['7D', '30D', '90D', '6M', '1Y'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={twMerge(
                  "flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-center whitespace-nowrap",
                  timeframe === tf 
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[280px] sm:h-[320px] w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      </Card>

      {/* Bottom Grid: Recent Transactions & Active Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 Cols) */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
                <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">Latest ledger entries</p>
              </div>
              <Link 
                to="/transactions" 
                className="text-xs font-bold text-brand-primary dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400">No recent transactions</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-xs font-bold text-brand-primary dark:text-blue-400 hover:underline"
                >
                  + Add your first transaction
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/50 rounded-xl px-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={twMerge(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        tx.amount > 0 
                          ? "bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400" 
                          : "bg-red-50 dark:bg-red-950/60 text-danger dark:text-red-400"
                      )}>
                        {tx.amount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                          {tx.description || tx.category}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{tx.dateStr}</span>
                          <span>•</span>
                          <span className="font-semibold text-gray-600 dark:text-slate-300">{tx.category}</span>
                          <span>•</span>
                          <span className={twMerge(
                            "px-1.5 py-0.5 rounded font-bold text-[9px] border",
                            tx.paymentMethod === 'Cash' 
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60" 
                              : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60"
                          )}>
                            {tx.paymentMethod === 'Cash' ? '💵 Cash' : '⚡ Online'}
                          </span>
                        </p>
                        {tx.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(tx.receiptUrl)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary dark:text-blue-400 hover:underline mt-0.5"
                          >
                            <Eye size={11} /> Receipt
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={twMerge(
                        "text-sm font-extrabold",
                        tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-danger dark:text-red-400"
                      )}>
                        {formatCurrency(tx.amount, { showSign: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Active Budgets Snapshot (1 Col) */}
        <div>
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Active Budgets</h3>
                <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">{fullMonthLabel}</p>
              </div>
              <Link 
                to="/budgets" 
                className="text-xs font-bold text-brand-primary dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Manage <ArrowRight size={14} />
              </Link>
            </div>

            {topBudgets.length === 0 ? (
              <div className="py-12 text-center">
                <Wallet className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400">No active budgets</p>
                <Link 
                  to="/budgets"
                  className="mt-2 inline-block text-xs font-bold text-brand-primary dark:text-blue-400 hover:underline"
                >
                  Establish budget targets
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {topBudgets.map((b) => {
                  const percent = b.goal > 0 ? (b.spent / b.goal) * 100 : 0;
                  const clamped = Math.min(percent, 100);
                  const isOver = percent >= 100;

                  return (
                    <div key={b.id} className="space-y-1.5 p-3 rounded-xl bg-gray-50/70 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-900 dark:text-white">{b.category}</span>
                        <span className={isOver ? 'text-danger dark:text-red-400 font-black' : 'text-gray-500 dark:text-slate-400'}>
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={twMerge(
                            "h-full rounded-full transition-all duration-700",
                            isOver ? "bg-danger" : percent >= 80 ? "bg-amber-500" : "bg-brand-primary"
                          )} 
                          style={{ width: `${clamped}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-400 font-medium">
                        <span>Spent: {formatCurrency(b.spent)}</span>
                        <span>Limit: {formatCurrency(b.goal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setSelectedReceipt(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100 mb-3 sm:mb-4 shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-brand-primary" />
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
                download="spendwise_receipt.jpg"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Download size={14} />
                Download
              </a>
              <a 
                href={selectedReceipt} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-primary hover:bg-blue-50 rounded-xl transition-colors"
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
    </div>
  );
};

export default Dashboard;