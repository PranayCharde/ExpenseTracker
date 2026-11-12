import React, { useEffect, useState, useMemo } from 'react';
import { 
  Download, 
  Printer, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Calendar,
  CreditCard as PaymentIcon,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Trash2,
  Plus,
  Search,
  X,
  ExternalLink,
  Eye,
  FileText
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import NewTransactionModal from '../components/common/NewTransactionModal';
import { twMerge } from 'tailwind-merge';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../hooks/useCurrency';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

const Transactions = () => {
  const { user } = useAuth();
  const { formatCurrency, symbol: CURRENCY_SYMBOL } = useCurrency();
  const [searchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Filter States
  const urlSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'amount-desc', 'amount-asc'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Receipt Modal Preview
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val) => {
    setFilterCategory(val);
    setCurrentPage(1);
  };

  const handleTypeChange = (val) => {
    setFilterType(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => {
        const data = doc.data();
        let jsDate = new Date();
        if (data.date?.toDate) {
          jsDate = data.date.toDate();
        } else if (data.createdAt?.toDate) {
          jsDate = data.createdAt.toDate();
        } else if (data.date) {
          jsDate = new Date(data.date);
        }

        return {
          id: doc.id,
          ...data,
          parsedDate: jsDate,
          dateStr: format(jsDate, 'MMM dd, yyyy')
        };
      });
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = searchTerm 
        ? (tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           tx.category?.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const matchCategory = filterCategory ? tx.category === filterCategory : true;
      const matchType = filterType === 'all' ? true : 
                        filterType === 'income' ? tx.amount > 0 : tx.amount < 0;
      return matchSearch && matchCategory && matchType;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return b.parsedDate - a.parsedDate;
      if (sortBy === 'date-asc') return a.parsedDate - b.parsedDate;
      if (sortBy === 'amount-desc') return Math.abs(b.amount) - Math.abs(a.amount);
      if (sortBy === 'amount-asc') return Math.abs(a.amount) - Math.abs(b.amount);
      return 0;
    });
  }, [transactions, searchTerm, filterCategory, filterType, sortBy]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction record?")) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
      } catch (err) {
        console.error("Error deleting transaction:", err);
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export.");
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency'];
    const rows = filteredTransactions.map(tx => [
      format(tx.parsedDate, 'yyyy-MM-dd'),
      `"${(tx.description || tx.category).replace(/"/g, '""')}"`,
      `"${tx.category.replace(/"/g, '""')}"`,
      tx.amount > 0 ? 'Income' : 'Expense',
      Math.abs(tx.amount).toFixed(2),
      CURRENCY_SYMBOL
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spendwise_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const categoriesList = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).filter(Boolean);
  }, [transactions]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-brand-primary border-t-transparent"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Transaction History
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Comprehensive audit of all expenses and earnings stored in your cloud ledger.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="secondary" 
            icon={Download} 
            onClick={handleExportCSV}
            className="rounded-xl text-xs sm:text-sm font-bold shadow-sm"
          >
            Export CSV
          </Button>
          <Button 
            variant="secondary" 
            icon={Printer} 
            onClick={handlePrint}
            className="rounded-xl text-xs sm:text-sm font-bold shadow-sm p-2.5 sm:px-3"
            title="Print Ledger"
          >
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button 
            icon={Plus} 
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-100"
          >
            Add Transaction
          </Button>
        </div>
      </div>

      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5 flex items-center gap-4 hover:border-blue-200 transition-colors">
          <div className="w-12 h-12 bg-blue-50 text-brand-primary rounded-2xl flex items-center justify-center shrink-0">
            <PaymentIcon size={22} />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Total Balance</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
              {formatCurrency(stats.balance)}
            </h3>
            <p className="text-[10px] text-green-600 font-bold mt-0.5">Real-time sync</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-4 hover:border-red-200 transition-colors">
          <div className="w-12 h-12 bg-red-50 text-danger rounded-2xl flex items-center justify-center shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Total Spent</p>
            <h3 className="text-xl sm:text-2xl font-black text-danger mt-0.5">
              {formatCurrency(stats.spending)}
            </h3>
            <p className="text-[10px] text-danger font-bold mt-0.5">Expenses</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-4 hover:border-green-200 transition-colors">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Total Income</p>
            <h3 className="text-xl sm:text-2xl font-black text-green-600 mt-0.5">
              {formatCurrency(stats.income)}
            </h3>
            <p className="text-[10px] text-green-600 font-bold mt-0.5">Earnings</p>
          </div>
        </Card>
      </div>

      {/* Main Filter & Table Card */}
      <Card className="p-4 sm:p-6">
        {/* Search & Filters Header */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          {/* Search bar inside Transactions */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search description, category..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all text-gray-900"
            />
            {searchTerm && (
              <button 
                onClick={() => handleSearchChange('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select 
              value={filterCategory} 
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-brand-primary outline-none"
            >
              <option value="">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select 
              value={sortBy} 
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-brand-primary outline-none"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>

            {/* Type Selector (All / Income / Expense) */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => handleTypeChange('all')} 
                className={twMerge(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all", 
                  filterType === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                All
              </button>
              <button 
                onClick={() => handleTypeChange('income')} 
                className={twMerge(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all", 
                  filterType === 'income' ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Income
              </button>
              <button 
                onClick={() => handleTypeChange('expense')} 
                className={twMerge(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all", 
                  filterType === 'expense' ? "bg-white text-danger shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Expense
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-blue-50 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PaymentIcon size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-900">No transactions found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {transactions.length === 0 
                ? "You haven't logged any transactions yet. Click 'Add Transaction' to get started."
                : "No transactions match your current search or filter criteria."}
            </p>
            {transactions.length === 0 && (
              <Button 
                onClick={() => setIsModalOpen(true)}
                icon={Plus} 
                className="mt-4 rounded-xl text-xs font-bold"
              >
                Create First Transaction
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-y border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Receipt</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="py-4 px-4 text-xs font-semibold text-gray-600 whitespace-nowrap">
                        {tx.dateStr}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={twMerge(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0",
                            tx.amount > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-danger"
                          )}>
                            {tx.amount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">
                              {tx.description || tx.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={tx.amount > 0 ? 'success' : 'info'}>
                          {tx.category}
                        </Badge>
                      </td>
                      <td className={twMerge(
                        "py-4 px-4 text-sm font-black text-right whitespace-nowrap",
                        tx.amount > 0 ? "text-green-600" : "text-danger"
                      )}>
                        {formatCurrency(tx.amount, { showSign: true })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {tx.receiptUrl ? (
                          <button
                            onClick={() => setSelectedReceipt(tx.receiptUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-brand-primary text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => handleDelete(tx.id)} 
                          className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Optimized for small screens) */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginatedTransactions.map((tx) => (
                <div key={tx.id} className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={twMerge(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        tx.amount > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-danger"
                      )}>
                        {tx.amount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                          {tx.description || tx.category}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          {tx.dateStr}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={twMerge(
                        "text-sm font-black",
                        tx.amount > 0 ? "text-green-600" : "text-danger"
                      )}>
                        {formatCurrency(tx.amount, { showSign: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Badge variant={tx.amount > 0 ? 'success' : 'info'} className="text-[10px]">
                      {tx.category}
                    </Badge>
                    <div className="flex items-center gap-3">
                      {tx.receiptUrl && (
                        <button
                          onClick={() => setSelectedReceipt(tx.receiptUrl)}
                          className="text-brand-primary text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Eye size={14} /> Receipt
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(tx.id)} 
                        className="text-gray-400 hover:text-danger p-1"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-semibold text-gray-400 text-center sm:text-left">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length)} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} records
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="p-2 border-gray-200 rounded-xl"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-xs font-bold px-3 py-1 bg-brand-primary text-white rounded-lg shadow-sm">
                  {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="p-2 border-gray-200 rounded-xl"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* High-Resolution Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setSelectedReceipt(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
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

            <div className="max-h-[60vh] overflow-auto rounded-2xl bg-gray-50 p-2 flex items-center justify-center">
              <img 
                src={selectedReceipt} 
                alt="Receipt Document" 
                className="max-w-full max-h-[55vh] object-contain rounded-xl" 
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <a 
                href={selectedReceipt} 
                download="spendwise_receipt.jpg"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Download size={14} />
                Download
              </a>
              <a 
                href={selectedReceipt} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-brand-primary hover:bg-blue-50 rounded-xl transition-colors"
              >
                <ExternalLink size={14} />
                Full Size
              </a>
              <Button 
                onClick={() => setSelectedReceipt(null)}
                size="sm"
                className="rounded-xl px-5 text-xs font-bold"
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

export default Transactions;