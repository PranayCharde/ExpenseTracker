import React from 'react';
import { 
  Plus, 
  ShoppingBag, 
  Film, 
  Utensils, 
  Home, 
  Car,
  ChevronRight
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { twMerge } from 'tailwind-merge';

const BudgetCard = ({ Icon, title, spent, goal, status, color = 'blue' }) => { // eslint-disable-line no-unused-vars
  const percent = Math.min((spent / goal) * 100, 100);
  
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
        <div className={twMerge('w-12 h-12 rounded-xl flex items-center justify-center', colors[color])}>
           <Icon size={24} />
        </div>
        <Badge variant={status === 'SAFE' ? 'success' : status === 'NEAR LIMIT' ? 'warning' : 'danger'}>
          {status}
        </Badge>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
      
      <div className="space-y-4 mb-4">
        <div className="flex justify-between items-end">
           <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spent: <span className="text-gray-900">${spent.toFixed(2)}</span></p>
           </div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Goal: ${goal.toFixed(2)}</p>
        </div>
        
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
           <div 
             className={twMerge('h-full transition-all duration-1000', barColors[color])} 
             style={{ width: `${percent}%` }}
           ></div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
         <span>{percent.toFixed(0)}% of budget used</span>
         <span>•</span>
         <span>8 days remaining</span>
      </div>
    </Card>
  );
};

const Budgets = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Monthly Budgets</h1>
          <p className="text-gray-500 font-medium">Monitor your spending across all active categories.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
           <button className="px-6 py-2 text-xs font-bold bg-white text-gray-900 rounded-lg shadow-sm">Active</button>
           <button className="px-6 py-2 text-xs font-bold text-gray-400 hover:text-gray-600">History</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BudgetCard 
          Icon={ShoppingBag} 
          title="Groceries" 
          spent={450.00} 
          goal={600.00} 
          status="SAFE" 
          color="green"
        />
        <BudgetCard 
          Icon={Film} 
          title="Entertainment" 
          spent={135.00} 
          goal={150.00} 
          status="NEAR LIMIT" 
          color="amber"
        />
        <BudgetCard 
          Icon={Utensils} 
          title="Dining Out" 
          spent={350.00} 
          goal={300.00} 
          status="OVER BUDGET" 
          color="red"
        />
        <BudgetCard 
          Icon={Home} 
          title="Rent & Utilities" 
          spent={1200.00} 
          goal={1200.00} 
          status="NEAR LIMIT" 
          color="blue"
        />
        <BudgetCard 
          Icon={Car} 
          title="Transportation" 
          spent={80.00} 
          goal={200.00} 
          status="SAFE" 
          color="green"
        />

        <Card className="border-2 border-dashed border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center text-center p-8 hover:bg-gray-50 hover:border-brand-primary transition-all cursor-pointer group">
           <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-brand-primary transition-colors mb-4 border border-gray-100">
              <Plus size={24} />
           </div>
           <h3 className="text-sm font-bold text-gray-900 mb-1">Create New Budget</h3>
           <p className="text-[11px] text-gray-500 font-medium">Set limits for a new spending category</p>
        </Card>
      </div>

      {/* Savings Goals Snapshot */}
      <div className="space-y-6 pt-4">
        <h2 className="text-lg font-bold text-gray-900">Savings Goals</h2>
        <div className="space-y-4">
          <Card className="p-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 text-brand-primary rounded-xl flex items-center justify-center"><Plus className="rotate-45" size={24} /></div>
                   <div>
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">Summer Vacation 2024</h4>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-sm font-extrabold text-brand-primary">$4,200</span>
                   <span className="text-sm font-bold text-gray-300 mx-1">/</span>
                   <span className="text-sm font-bold text-gray-400">$5,000</span>
                </div>
             </div>
             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: '84%' }}></div>
             </div>
          </Card>

          <Card className="p-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Wallet size={24} /></div>
                   <div>
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">Emergency Fund</h4>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-sm font-extrabold text-brand-primary">$8,500</span>
                   <span className="text-sm font-bold text-gray-300 mx-1">/</span>
                   <span className="text-sm font-bold text-gray-400">$12,000</span>
                </div>
             </div>
             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: '70.8%' }}></div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Budgets;
