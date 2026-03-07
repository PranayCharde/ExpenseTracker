import React, { useEffect, useState, useMemo } from 'react';
import { 
  Download, 
  Printer, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Calendar,
  Layers,
  CreditCard as PaymentIcon,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { twMerge } from 'tailwind-merge';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { CURRENCY_SYMBOL } from '../utils/currency';

const Transactions = () => {
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
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateStr: doc.data().date?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recent'
      }));
      setTransactions(txs);
      setLoading(false);
    }, (error) => {
      console.error("Transactions listener error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const stats = useMemo(() => {
    const income = transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const spending = transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const balance = income - spending;

    return { income, spending, balance };
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
              <h3 className="text-xl font-extrabold text-gray-900">{CURRENCY_SYMBOL}{stats.balance.toLocaleString()}</h3>
              <p className="text-[10px] text-green-500 font-bold">Updated just now</p>
           </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
           <div className="w-10 h-10 bg-red-50 text-danger rounded-xl flex items-center justify-center"><ShoppingBag size={20} /></div>
           <div>
              <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Monthly Spending</p>
              <h3 className="text-xl font-extrabold text-gray-900">{CURRENCY_SYMBOL}{stats.spending.toLocaleString()}</h3>
              <p className="text-[10px] text-danger font-bold">Real-time sync</p>
           </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
           <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
           <div>
              <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Monthly Income</p>
              <h3 className="text-xl font-extrabold text-gray-900">{CURRENCY_SYMBOL}{stats.income.toLocaleString()}</h3>
              <p className="text-[10px] text-green-500 font-bold">Stable income</p>
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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 font-bold text-sm">No transactions found</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{tx.dateStr}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-lg">{tx.amount > 0 ? '💰' : '🛒'}</div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{tx.description || tx.category}</span>
                          {tx.receiptUrl && (
                            <a 
                              href={tx.receiptUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline mt-0.5"
                            >View Receipt</a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={tx.amount > 0 ? 'success' : 'warning'}>
                        {tx.category}
                      </Badge>
                    </td>
                    <td className={twMerge(
                      "py-4 px-4 text-sm font-extrabold text-right",
                      tx.amount > 0 ? "text-green-600" : "text-danger"
                    )}>
                      {tx.amount > 0 ? `+${CURRENCY_SYMBOL}${tx.amount.toFixed(2)}` : `-${CURRENCY_SYMBOL}${Math.abs(tx.amount).toFixed(2)}`}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-xs font-bold text-green-600">Completed</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="p-1 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-gray-900">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
           <p className="text-xs font-bold text-gray-400">Showing {transactions.length} entries</p>
           <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="p-2 border-gray-200"><ChevronLeft size={16} /></Button>
              <button className="w-8 h-8 rounded-lg bg-brand-primary text-white text-xs font-bold shadow-md shadow-blue-100">1</button>
              <Button variant="secondary" size="sm" className="p-2 border-gray-200"><ChevronRight size={16} /></Button>
           </div>
        </div>
      </Card>
    </div>
  );
};

export default Transactions;
