import React, { useEffect, useState, useMemo } from 'react';
import { 
  Download, 
  PieChart as PieIcon, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Doughnut, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip as ChartTooltip, 
  Legend as ChartLegend,
  CategoryScale,
  LinearScale, 
  BarElement
} from 'chart.js';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format, subMonths } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../hooks/useCurrency';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend, CategoryScale, LinearScale, BarElement);

const PALETTE = [
  '#3b82f6',
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
  '#64748b'
];

const Reports = () => {
  const { user } = useAuth();
  const { formatCurrency, symbol: CURRENCY_SYMBOL } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState('6M'); // '30D', '3M', '6M', '1Y'

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => {
        const d = doc.data();
        let jsDate = new Date();
        if (d.date?.toDate) jsDate = d.date.toDate();
        else if (d.createdAt?.toDate) jsDate = d.createdAt.toDate();
        else if (d.date) jsDate = new Date(d.date);

        return { ...d, id: doc.id, parsedDate: jsDate };
      });
      setTransactions(txs);
      setLoading(false);
    }, (error) => {
      console.error("Reports listener error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Filter transactions according to report period
  const filteredTxs = useMemo(() => {
    const now = new Date();
    let cutoff = new Date();

    if (reportPeriod === '30D') cutoff.setDate(now.getDate() - 30);
    else if (reportPeriod === '3M') cutoff.setMonth(now.getMonth() - 3);
    else if (reportPeriod === '6M') cutoff.setMonth(now.getMonth() - 6);
    else if (reportPeriod === '1Y') cutoff.setFullYear(now.getFullYear() - 1);

    return transactions.filter(t => t.parsedDate >= cutoff);
  }, [transactions, reportPeriod]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalIncome = filteredTxs
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = filteredTxs
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;

    return { totalIncome, totalExpenses, netSavings, savingsRate };
  }, [filteredTxs]);

  // Category breakdown for Doughnut chart & Table
  const categoryBreakdown = useMemo(() => {
    const expenses = filteredTxs.filter(tx => tx.amount < 0);
    const total = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const catMap = {};
    expenses.forEach(tx => {
      const cat = tx.category || 'Other';
      if (!catMap[cat]) {
        catMap[cat] = { total: 0, count: 0 };
      }
      catMap[cat].total += Math.abs(tx.amount);
      catMap[cat].count += 1;
    });

    const sortedCats = Object.entries(catMap)
      .map(([name, data], idx) => ({
        name,
        total: data.total,
        count: data.count,
        percent: total > 0 ? (data.total / total) * 100 : 0,
        color: PALETTE[idx % PALETTE.length]
      }))
      .sort((a, b) => b.total - a.total);

    return {
      items: sortedCats,
      totalExpenses: total,
      topCategory: sortedCats[0] || null
    };
  }, [filteredTxs]);

  // Doughnut chart data
  const doughnutData = useMemo(() => {
    const labels = categoryBreakdown.items.map(i => i.name);
    const data = categoryBreakdown.items.map(i => i.total);
    const colors = categoryBreakdown.items.map(i => i.color);

    return {
      labels,
      datasets: [
        {
          data: data.length > 0 ? data : [1],
          backgroundColor: data.length > 0 ? colors : ['#e2e8f0'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        },
      ],
    };
  }, [categoryBreakdown]);

  // 6 Months bar chart (Income vs Expenses)
  const barData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i)).reverse();
    
    const incomeData = months.map(() => 0);
    const expenseData = months.map(() => 0);

    transactions.forEach(tx => {
      const txDate = tx.parsedDate;
      if (!txDate) return;
      
      const idx = months.findIndex(m => m.getMonth() === txDate.getMonth() && m.getFullYear() === txDate.getFullYear());
      if (idx !== -1) {
        if (tx.amount > 0) incomeData[idx] += tx.amount;
        else expenseData[idx] += Math.abs(tx.amount);
      }
    });

    return {
      labels: months.map(d => format(d, 'MMM')),
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#22c55e',
          borderRadius: 6,
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#ef4444',
          borderRadius: 6,
        },
      ],
    };
  }, [transactions]);

  const handleExportCSV = () => {
    if (filteredTxs.length === 0) {
      alert("No data available to export for this period.");
      return;
    }
    
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency'];
    const rows = filteredTxs.map(tx => [
      format(tx.parsedDate, 'yyyy-MM-dd'),
      `"${(tx.description || tx.category).replace(/"/g, '""')}"`,
      `"${(tx.category || '').replace(/"/g, '""')}"`,
      tx.amount > 0 ? 'Income' : 'Expense',
      Math.abs(tx.amount).toFixed(2),
      CURRENCY_SYMBOL
    ].join(','));
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spendwise_report_${reportPeriod}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-brand-primary border-t-transparent"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generating Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Financial Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Visual breakdown of spending habits, income sources, and net savings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {[
              { key: '30D', label: '30D' },
              { key: '3M', label: '3M' },
              { key: '6M', label: '6M' },
              { key: '1Y', label: '1Y' }
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setReportPeriod(p.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  reportPeriod === p.key ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button 
            onClick={handleExportCSV} 
            icon={Download} 
            className="rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-100"
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Total Spending</p>
          <h3 className="text-2xl font-black text-danger mt-1">
            {formatCurrency(stats.totalExpenses)}
          </h3>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">In selected {reportPeriod} period</p>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Total Earned</p>
          <h3 className="text-2xl font-black text-green-600 mt-1">
            {formatCurrency(stats.totalIncome)}
          </h3>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">Income streams logged</p>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Net Cashflow</p>
          <h3 className={`text-2xl font-black mt-1 ${stats.netSavings >= 0 ? 'text-gray-900' : 'text-danger'}`}>
            {formatCurrency(stats.netSavings, { showSign: true })}
          </h3>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            {stats.savingsRate.toFixed(1)}% savings rate
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Top Spending Category</p>
          <h3 className="text-2xl font-black text-brand-primary mt-1 truncate">
            {categoryBreakdown.topCategory?.name || 'N/A'}
          </h3>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            {categoryBreakdown.topCategory ? formatCurrency(categoryBreakdown.topCategory.total) : 'No expenses recorded'}
          </p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Doughnut Chart */}
        <Card className="p-5 sm:p-6">
          <div className="pb-4 border-b border-gray-100 mb-6">
            <h3 className="text-base font-bold text-gray-900">Spending by Category</h3>
            <p className="text-xs text-gray-400 font-medium">Distribution for the selected timeframe</p>
          </div>

          {categoryBreakdown.items.length === 0 ? (
            <div className="py-20 text-center">
              <PieIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500">No expense data in this timeframe</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-[260px] relative flex items-center justify-center">
                <Doughnut 
                  data={doughnutData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => ` ${context.label}: ${formatCurrency(context.parsed)}`
                        }
                      }
                    },
                    cutout: '72%',
                  }} 
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                  <h4 className="text-xl font-black text-gray-900">
                    {formatCurrency(categoryBreakdown.totalExpenses)}
                  </h4>
                </div>
              </div>

              {/* Category Pills */}
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                {categoryBreakdown.items.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div className="truncate">
                      <p className="text-xs font-bold text-gray-800 truncate">{cat.name}</p>
                      <p className="text-[10px] text-gray-400">{cat.percent.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* 6 Months Bar Chart */}
        <Card className="p-5 sm:p-6">
          <div className="pb-4 border-b border-gray-100 mb-6">
            <h3 className="text-base font-bold text-gray-900">Income vs. Expense Trend</h3>
            <p className="text-xs text-gray-400 font-medium">Monthly comparison for past 6 months</p>
          </div>

          <div className="h-[320px] w-full pt-4">
            <Bar 
              data={barData} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                  legend: { 
                    position: 'top', 
                    align: 'end', 
                    labels: { boxWidth: 10, usePointStyle: true, font: { size: 11, weight: 'bold' } } 
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                    }
                  }
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
                    ticks: { font: { size: 11, weight: 'bold' }, color: '#94a3b8' } 
                  }
                }
              }} 
            />
          </div>
        </Card>
      </div>

      {/* Detailed Category Table */}
      {categoryBreakdown.items.length > 0 && (
        <Card className="p-5 sm:p-6">
          <div className="pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-base font-bold text-gray-900">Category Expense Ledger</h3>
            <p className="text-xs text-gray-400 font-medium">Breakdown of all categories spent during this period</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Transaction Count</th>
                  <th className="py-3 px-4">% of Total</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold">
                {categoryBreakdown.items.map(cat => (
                  <tr key={cat.name} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold text-gray-900">{cat.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{cat.count} transactions</td>
                    <td className="py-3.5 px-4 text-gray-600">{cat.percent.toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-right font-black text-danger">
                      {formatCurrency(cat.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Reports;