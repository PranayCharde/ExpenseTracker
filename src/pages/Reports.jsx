import React, { useEffect, useState, useMemo } from 'react';
import { 
  Download, 
  PieChart as PieIcon, 
  BarChart, 
  TrendingUp, 
  Calendar,
  ChevronDown,
  Info,
  MoreHorizontal,
  Home
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip as ChartTooltip, 
  Legend as ChartLegend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend, CategoryScale, LinearScale, BarElement);

import { useAuth } from '../context/AuthContext';
import { CURRENCY_SYMBOL } from '../utils/currency';

const Reports = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => doc.data()));
      setLoading(false);
    }, (error) => {
      console.error("Reports listener error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const pieData = useMemo(() => {
    const expenses = transactions.filter(tx => tx.amount < 0);
    const total = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const categories = {};
    expenses.forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + Math.abs(tx.amount);
    });

    const labels = Object.keys(categories);
    const data = labels.map(label => (categories[label] / total) * 100);

    return {
      labels,
      total,
      datasets: [
        {
          data,
          backgroundColor: [
            '#3b82f6',
            '#60a5fa',
            '#93c5fd',
            '#bfdbfe',
            '#2563eb',
            '#1d4ed8'
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [transactions]);

  const barData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i)).reverse();
    const labels = last6Months.map(date => format(date, 'MMM'));
    
    const incomeData = labels.map(() => 0);
    const expenseData = labels.map(() => 0);

    transactions.forEach(tx => {
      const txDate = tx.date?.toDate();
      if (!txDate) return;
      
      const monthIdx = last6Months.findIndex(m => m.getMonth() === txDate.getMonth() && m.getFullYear() === txDate.getFullYear());
      if (monthIdx !== -1) {
        if (tx.amount > 0) incomeData[monthIdx] += tx.amount;
        else expenseData[monthIdx] += Math.abs(tx.amount);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#3b82f6',
          borderRadius: 4,
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#e2e8f0',
          borderRadius: 4,
        },
      ],
    };
  }, [transactions]);

  const topCategory = useMemo(() => {
    const expenses = transactions.filter(tx => tx.amount < 0);
    const categories = {};
    expenses.forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + Math.abs(tx.amount);
    });
    
    let top = 'N/A';
    let max = 0;
    Object.entries(categories).forEach(([cat, val]) => {
      if (val > max) {
        max = val;
        top = cat;
      }
    });
    return { name: top, amount: max };
  }, [transactions]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Financial Reports & Analytics</h1>
          <p className="text-gray-500 font-medium">Visualize your spending patterns and asset growth with precision.</p>
        </div>
        <Button icon={Download} className="rounded-xl shadow-lg shadow-blue-100">Export CSV</Button>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-100 pb-px">
         <button className="px-4 py-3 text-sm font-bold text-brand-primary border-b-2 border-brand-primary flex items-center gap-2">
            <PieIcon size={18} /> Overview
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Spending by Category" subtitle="Distribution analysis" headerAction={<MoreHorizontal size={20} className="text-gray-400" />}>
           <div className="h-[300px] flex items-center justify-center relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Total Spent</p>
                 <h3 className="text-2xl font-extrabold text-gray-900">{CURRENCY_SYMBOL}{pieData.total.toLocaleString()}</h3>
              </div>
              <Pie data={pieData} options={{ 
                plugins: { legend: { display: false } },
                cutout: '70%',
              }} />
           </div>
           <div className="grid grid-cols-2 gap-4 mt-8">
              {pieData.labels.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pieData.datasets[0].backgroundColor[i] }}></div>
                   <span className="text-xs font-bold text-gray-500">{label} ({pieData.datasets[0].data[i].toFixed(1)}%)</span>
                </div>
              ))}
           </div>
        </Card>

        <Card title="Income vs Expenses" subtitle="Trend analysis - Last 6 months">
           <div className="h-[300px] w-full pt-4">
              <Bar data={barData} options={{ 
                plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 10, usePointStyle: true, font: { size: 11, weight: 'bold' } } } },
                scales: { 
                  y: { display: false },
                  x: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' }, color: '#94a3b8' } }
                }
              }} />
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"><Home size={20} /></div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top Spending Category</p>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">{topCategory.name}</h3>
            <div className="flex justify-between items-end">
               <p className="text-sm font-bold text-gray-500">{CURRENCY_SYMBOL}{topCategory.amount.toLocaleString()} <span className="text-xs font-medium">total</span></p>
               <span className="text-[10px] font-bold text-gray-400 uppercase">Analysis</span>
            </div>
         </Card>

         <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Income</p>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">
              {CURRENCY_SYMBOL}{transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </h3>
            <div className="flex justify-between items-end">
               <p className="text-sm font-bold text-gray-500">Across all months</p>
               <span className="text-[10px] font-bold text-green-500 uppercase">Live</span>
            </div>
         </Card>

         <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-10 bg-blue-50 text-brand-primary rounded-xl flex items-center justify-center"><PieIcon size={20} /></div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Balance</p>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">
              {CURRENCY_SYMBOL}{transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </h3>
            <div className="flex justify-between items-end">
               <p className="text-sm font-bold text-gray-500">Live Wallet Balance</p>
               <span className="text-[10px] font-bold text-green-500 uppercase">Synced</span>
            </div>
         </Card>
      </div>
    </div>
  );
};

export default Reports;
