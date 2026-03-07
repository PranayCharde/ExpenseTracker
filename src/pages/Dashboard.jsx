import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  ShoppingBag, 
  Coffee,
  MoreHorizontal,
  Receipt
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import NewTransactionModal from '../components/common/NewTransactionModal';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
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

import { useAuth } from '../context/AuthContext';
import { CURRENCY_SYMBOL } from '../utils/currency';

const Dashboard = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateStr: doc.data().date?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recent'
      }));
      setTransactions(txs);
      setLoading(false);
    }, (error) => {
      console.error("Dashboard listener error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const stats = useMemo(() => {
    const income = transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const balance = income - expenses;

    return { income, expenses, balance };
  }, [transactions]);

  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i) * 5);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Simple grouping for the demo/dashboard: group by roughly 5-day intervals
    const spendingData = last30Days.map((_, index) => {
      const dayOffset = (6 - index) * 5;
      const start = new Date();
      start.setDate(start.getDate() - dayOffset);
      const end = new Date();
      end.setDate(end.getDate() - (dayOffset - 5));

      return transactions
        .filter(tx => tx.amount < 0 && tx.createdAt?.toDate() >= start && tx.createdAt?.toDate() < end)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    });

    return {
      labels: last30Days,
      datasets: [
        {
          fill: true,
          label: 'Spending',
          data: spendingData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 12,
      },
    },
    scales: {
      y: { 
        display: true, 
        grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 10, weight: '600' } }
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 12, weight: '600' } }
      },
    },
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Financial Overview</h1>
          <p className="text-gray-500 font-medium">Welcome back, {auth.currentUser?.displayName || 'User'}!</p>
        </div>
        <Button icon={Plus} className="rounded-xl shadow-lg shadow-blue-100 px-6 py-3" onClick={() => setIsModalOpen(true)}>
          Add Transaction
        </Button>
      </div>

      <NewTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-blue-200 transition-colors">
          <div className="flex items-start justify-between mb-4">
             <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-brand-primary">
                <CreditCard size={24} />
             </div>
             <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-xs font-bold">Real-time</span>
          </div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Total Balance</p>
          <h2 className="text-3xl font-extrabold text-gray-900">{CURRENCY_SYMBOL}{stats.balance.toLocaleString()}</h2>
        </Card>

        <Card className="hover:border-green-200 transition-colors">
          <div className="flex items-start justify-between mb-4">
             <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <TrendingUp size={24} />
             </div>
             <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-xs font-bold">Income</span>
          </div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Monthly Income</p>
          <h2 className="text-3xl font-extrabold text-gray-900">{CURRENCY_SYMBOL}{stats.income.toLocaleString()}</h2>
        </Card>

        <Card className="hover:border-red-200 transition-colors">
          <div className="flex items-start justify-between mb-4">
             <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-danger">
                <TrendingDown size={24} />
             </div>
             <span className="text-danger bg-red-50 px-2 py-0.5 rounded-lg text-xs font-bold">Expenses</span>
          </div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Monthly Expenses</p>
          <h2 className="text-3xl font-extrabold text-gray-900">{CURRENCY_SYMBOL}{stats.expenses.toLocaleString()}</h2>
        </Card>
      </div>

      {/* Chart Section */}
      <Card title="Spending Trends" subtitle="Overview of your activity last 30 days" headerAction={
        <div className="flex gap-2 bg-gray-50 p-1 rounded-lg">
          <button className="px-3 py-1 text-xs font-bold bg-white text-gray-900 rounded-md shadow-sm border border-gray-100">30D</button>
          <button className="px-3 py-1 text-xs font-bold text-gray-400 hover:text-gray-600">6M</button>
          <button className="px-3 py-1 text-xs font-bold text-gray-400 hover:text-gray-600">1Y</button>
        </div>
      }>
        <div className="h-[300px] w-full pt-4">
          <Line data={chartData} options={chartOptions} />
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card title="Recent Transactions" headerAction={<Button variant="ghost" size="sm" className="text-brand-primary font-bold">View all</Button>}>
        <div className="space-y-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto text-gray-200 mb-4" size={48} />
              <p className="text-sm font-bold text-gray-400">No transactions found</p>
            </div>
          ) : (
            transactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between group cursor-pointer p-2 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-gray-900 group-hover:bg-white transition-colors ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-800'}`}>
                    {tx.type === 'expense' ? <ShoppingBag size={20} /> : <TrendingUp size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{tx.description || tx.category}</h4>
                    <p className="text-xs text-gray-500 font-medium">{tx.category} • {tx.dateStr}</p>
                  </div>
                </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.amount > 0 ? `+${CURRENCY_SYMBOL}${tx.amount.toFixed(2)}` : `-${CURRENCY_SYMBOL}${Math.abs(tx.amount).toFixed(2)}`}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {tx.receiptUrl && (
                        <a 
                          href={tx.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1 bg-blue-50 text-brand-primary rounded-lg hover:bg-white border border-transparent hover:border-blue-100 transition-all shadow-sm shadow-blue-50"
                          title="View Receipt"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Receipt size={12} />
                        </a>
                      )}
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</span>
                    </div>
                  </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
