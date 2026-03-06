import React from 'react';
import { 
  Download, 
  Printer, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Calendar,
  Layers,
  CreditCard as PaymentIcon
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { twMerge } from 'tailwind-merge';

const Transactions = () => {
  const transactions = [
    { id: 1, date: 'Oct 24, 2023', description: 'Whole Foods Market', category: 'Food', amount: -120.50, status: 'Completed', icon: '🍎' },
    { id: 2, date: 'Oct 22, 2023', description: 'Uber Trip', category: 'Transport', amount: -15.00, status: 'Completed', icon: '🚗' },
    { id: 3, date: 'Oct 01, 2023', description: 'Monthly Rent', category: 'Rent', amount: -2100.00, status: 'Completed', icon: '🏠' },
    { id: 4, date: 'Sep 28, 2023', description: 'Starbucks Coffee', category: 'Food', amount: -5.75, status: 'Pending', icon: '☕' },
    { id: 5, date: 'Sep 25, 2023', description: 'Salary Deposit', category: 'Income', amount: 5000.00, status: 'Completed', icon: '💰' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Transaction History</h1>
          <p className="text-gray-500 font-medium">Detailed overview of your spending and income across all accounts.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download} className="rounded-xl">Export</Button>
          <Button variant="secondary" icon={Printer} className="rounded-xl p-3"><span className="sr-only">Print</span></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 flex items-center gap-4">
           <div className="w-10 h-10 bg-blue-50 text-brand-primary rounded-xl flex items-center justify-center"><PaymentIcon size={20} /></div>
           <div>
              <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Total Balance</p>
              <h3 className="text-xl font-extrabold text-gray-900">$24,562.00</h3>
              <p className="text-[10px] text-green-500 font-bold">+2.4% from last month</p>
           </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
           <div className="w-10 h-10 bg-red-50 text-danger rounded-xl flex items-center justify-center"><ShoppingBag size={20} /></div>
           <div>
              <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Monthly Spending</p>
              <h3 className="text-xl font-extrabold text-gray-900">$3,840.50</h3>
              <p className="text-[10px] text-danger font-bold">+12% from last month</p>
           </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
           <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
           <div>
              <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Monthly Income</p>
              <h3 className="text-xl font-extrabold text-gray-900">$5,200.00</h3>
              <p className="text-[10px] text-green-500 font-bold">Stable vs last month</p>
           </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
           <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="sm" icon={Calendar} className="bg-gray-50 border-gray-100 font-semibold px-4 py-2">Last 30 Days</Button>
              <Button variant="secondary" size="sm" icon={Layers} className="bg-gray-50 border-gray-100 font-semibold px-4 py-2">All Categories</Button>
              <Button variant="secondary" size="sm" icon={PaymentIcon} className="bg-gray-50 border-gray-100 font-semibold px-4 py-2">Payment Method</Button>
           </div>
           <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
              <span className="text-xs font-bold text-gray-400 px-3 uppercase">Status:</span>
              <button className="px-4 py-1.5 text-xs font-bold bg-white text-gray-900 rounded-md shadow-sm border border-gray-100">All</button>
              <button className="px-4 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600">Completed</button>
              <button className="px-4 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600">Pending</button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-y border-gray-100">
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">{tx.date}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-lg">{tx.icon}</div>
                      <span className="text-sm font-bold text-gray-900">{tx.description}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={tx.category === 'Income' ? 'success' : tx.category === 'Transport' ? 'special' : tx.category === 'Rent' ? 'special' : 'warning'}>
                      {tx.category}
                    </Badge>
                  </td>
                  <td className={twMerge(
                    "py-4 px-4 text-sm font-extrabold text-right",
                    tx.amount > 0 ? "text-green-600" : "text-danger"
                  )}>
                    {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                       <div className={twMerge("w-1.5 h-1.5 rounded-full", tx.status === 'Completed' ? "bg-green-500" : "bg-warning")}></div>
                       <span className={twMerge("text-xs font-bold", tx.status === 'Completed' ? "text-green-600" : "text-warning")}>{tx.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="p-1 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-gray-900">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
           <p className="text-xs font-bold text-gray-400">Showing 1 to 5 of 152 entries</p>
           <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="p-2 border-gray-200"><ChevronLeft size={16} /></Button>
              <button className="w-8 h-8 rounded-lg bg-brand-primary text-white text-xs font-bold shadow-md shadow-blue-100">1</button>
              <button className="w-8 h-8 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100">2</button>
              <button className="w-8 h-8 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100">3</button>
              <span className="text-gray-300">...</span>
              <button className="w-8 h-8 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100">12</button>
              <Button variant="secondary" size="sm" className="p-2 border-gray-200"><ChevronRight size={16} /></Button>
           </div>
        </div>
      </Card>
    </div>
  );
};

export default Transactions;
