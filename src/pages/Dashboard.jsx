import React from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  ShoppingBag, 
  Coffee,
  MoreHorizontal
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import NewTransactionModal from '../components/common/NewTransactionModal';
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

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const chartData = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [
      {
        fill: true,
        label: 'Spending',
        data: [1500, 2200, 3800, 2900],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

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
      y: { display: false, grid: { display: false } },
      x: { 
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 12, weight: '600' } }
      },
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Financial Overview</h1>
          <p className="text-gray-500 font-medium">Welcome back! Here's what's happening today.</p>
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
             <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-xs font-bold">+2.5%</span>
          </div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Total Balance</p>
          <h2 className="text-3xl font-extrabold text-gray-900">$12,450.00</h2>
        </Card>

        <Card className="hover:border-green-200 transition-colors">
          <div className="flex items-start justify-between mb-4">
             <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <TrendingUp size={24} />
             </div>
             <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-xs font-bold">+12%</span>
          </div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Monthly Income</p>
          <h2 className="text-3xl font-extrabold text-gray-900">$5,200.00</h2>
        </Card>

        <Card className="hover:border-red-200 transition-colors">
          <div className="flex items-start justify-between mb-4">
             <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-danger">
                <TrendingDown size={24} />
             </div>
             <span className="text-danger bg-red-50 px-2 py-0.5 rounded-lg text-xs font-bold">-5.0%</span>
          </div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Monthly Expenses</p>
          <h2 className="text-3xl font-extrabold text-gray-900">$3,120.00</h2>
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
          <div className="flex items-center justify-between group cursor-pointer p-2 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 group-hover:bg-white transition-colors">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 leading-tight">Apple Store</h4>
                <p className="text-xs text-gray-500 font-medium">Electronics • Oct 24, 2023</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900">-$999.00</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</span>
            </div>
          </div>

          <div className="flex items-center justify-between group cursor-pointer p-2 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-white transition-colors">
                <Plus size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 leading-tight">Monthly Salary</h4>
                <p className="text-xs text-gray-500 font-medium">Income • Oct 22, 2023</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-sm font-bold text-green-600">+$4,500.00</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</span>
            </div>
          </div>

          <div className="flex items-center justify-between group cursor-pointer p-2 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-orange-500 group-hover:bg-white transition-colors">
                <Coffee size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 leading-tight">Starbucks</h4>
                <p className="text-xs text-gray-500 font-medium">Food • Oct 20, 2023</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900">-$5.75</span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pending</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
