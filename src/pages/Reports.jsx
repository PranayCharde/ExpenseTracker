import React from 'react';
import { 
  Download, 
  PieChart as PieIcon, 
  BarChart, 
  TrendingUp, 
  Calendar,
  ChevronDown,
  Info
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

ChartJS.register(ArcElement, ChartTooltip, ChartLegend, CategoryScale, LinearScale, BarElement);

const Reports = () => {
  const pieData = {
    labels: ['Housing', 'Food', 'Transport', 'Other'],
    datasets: [
      {
        data: [45, 25, 15, 15],
        backgroundColor: [
          '#3b82f6',
          '#60a5fa',
          '#93c5fd',
          '#bfdbfe',
        ],
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Income',
        data: [4000, 4800, 5200, 4500, 5800, 5200],
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: [3000, 3200, 3800, 3100, 3500, 3120],
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
      },
    ],
  };

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
         <button className="px-4 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 flex items-center gap-2 transition-colors">
            <BarChart size={18} /> Spending
         </button>
         <button className="px-4 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 flex items-center gap-2 transition-colors">
            <TrendingUp size={18} /> Income
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Spending by Category" subtitle="Monthly distribution" headerAction={<MoreHorizontal size={20} className="text-gray-400" />}>
           <div className="h-[300px] flex items-center justify-center relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                 <h3 className="text-2xl font-extrabold text-gray-900">$8,240</h3>
              </div>
              <Pie data={pieData} options={{ 
                plugins: { legend: { display: false } },
                cutout: '70%',
              }} />
           </div>
           <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                 <span className="text-xs font-bold text-gray-500">Housing (45%)</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                 <span className="text-xs font-bold text-gray-500">Food (25%)</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                 <span className="text-xs font-bold text-gray-500">Transport (15%)</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-200"></div>
                 <span className="text-xs font-bold text-gray-500">Other (15%)</span>
              </div>
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
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">Housing</h3>
            <div className="flex justify-between items-end">
               <p className="text-sm font-bold text-gray-500">$3,700 <span className="text-xs font-medium">this month</span></p>
               <span className="text-[10px] font-bold text-gray-400 uppercase">Stable</span>
            </div>
         </Card>

         <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Savings Rate</p>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">32.4%</h3>
            <div className="flex justify-between items-end">
               <p className="text-sm font-bold text-gray-500">$2,140 <span className="text-xs font-medium">saved</span></p>
               <span className="text-[10px] font-bold text-green-500 uppercase">+2.1%</span>
            </div>
         </Card>

         <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-10 bg-blue-50 text-brand-primary rounded-xl flex items-center justify-center"><PieIcon size={20} /></div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Net Worth</p>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">$142,000</h3>
            <div className="flex justify-between items-end">
               <p className="text-sm font-bold text-gray-500">Across 4 accounts</p>
               <span className="text-[10px] font-bold text-green-500 uppercase">+5.4%</span>
            </div>
         </Card>
      </div>
    </div>
  );
};

export default Reports;
