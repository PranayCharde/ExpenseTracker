import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  PieChart,
  Lock,
  Globe,
  Receipt,
  Menu,
  X
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100 px-4 sm:px-8 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200 ring-4 ring-blue-50">
              <Wallet size={20} />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">SpendWise</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
            <a href="#security" className="hover:text-brand-primary transition-colors">Security</a>
            <a href="#overview" className="hover:text-brand-primary transition-colors">Platform</a>
            {user ? (
              <Link to="/dashboard">
                <Button size="sm" className="rounded-xl px-5 shadow-md shadow-blue-100 font-bold">
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-gray-700 hover:text-brand-primary font-bold">
                  Sign In
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="rounded-xl px-5 shadow-md shadow-blue-100 font-bold">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-gray-100 pb-2 space-y-3 animate-in slide-in-from-top-2">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-2 py-1.5 text-sm font-semibold text-gray-700 hover:text-brand-primary"
            >
              Features
            </a>
            <a 
              href="#security" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-2 py-1.5 text-sm font-semibold text-gray-700 hover:text-brand-primary"
            >
              Security
            </a>
            <a 
              href="#overview" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-2 py-1.5 text-sm font-semibold text-gray-700 hover:text-brand-primary"
            >
              Platform
            </a>
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {user ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-xl font-bold">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full rounded-xl font-bold">Sign In</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-xl font-bold">Get Started Free</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-brand-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-blue-100 shadow-sm">
          <Zap size={14} className="animate-pulse" />
          Cloud-Connected Money Management
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1] max-w-4xl">
          Master Your Money with <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800">
            Intelligent Tracking
          </span>
        </h1>

        <p className="text-base sm:text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed font-normal">
          Log every expense with photo receipts, set category budgets that notify you in real-time, and make smarter financial decisions with instant analytics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto justify-center">
          <Link to={user ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto rounded-2xl px-8 py-4 text-base font-bold shadow-xl shadow-blue-200/60" icon={ArrowRight} iconPosition="right">
              {user ? "Open Your Ledger" : "Start Tracking Free"}
            </Button>
          </Link>
          <a href="#features" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto rounded-2xl px-8 py-4 text-base font-bold">
              Explore Features
            </Button>
          </a>
        </div>

        {/* Live Mockup Card */}
        <div id="overview" className="w-full max-w-4xl mx-auto rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-gray-100 to-gray-50 border border-gray-200 shadow-2xl">
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-left shadow-sm border border-gray-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Live Financial Ledger</h3>
                  <p className="text-xs text-gray-400">Firebase Firestore Subcollections Architecture</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-green-600">Synced to Cloud</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold text-brand-primary uppercase">Total Balance</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">₹2,48,500.00</p>
              </div>
              <div className="p-4 bg-green-50/60 rounded-xl border border-green-100">
                <p className="text-[10px] font-bold text-green-700 uppercase">Monthly Income</p>
                <p className="text-2xl font-black text-green-600 mt-0.5">+₹64,000.00</p>
              </div>
              <div className="p-4 bg-red-50/60 rounded-xl border border-red-100">
                <p className="text-[10px] font-bold text-red-700 uppercase">Monthly Spent</p>
                <p className="text-2xl font-black text-danger mt-0.5">-₹21,500.00</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                    💰
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Consulting Project Payout</p>
                    <p className="text-[10px] text-gray-400">Freelance • Completed</p>
                  </div>
                </div>
                <span className="text-xs font-black text-green-600">+₹32,000.00</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                    🛒
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Supermarket Groceries</p>
                    <p className="text-[10px] text-gray-400">Groceries • Receipt Attached</p>
                  </div>
                </div>
                <span className="text-xs font-black text-danger">-₹1,840.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-gray-50/60 border-y border-gray-100 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Engineered for Complete Financial Control
            </h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              Everything you need to stop wondering where your money went and start directing where it goes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-50 text-brand-primary rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Real-Time Data Visualization</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Interactive area & doughnut charts show your spending trajectory, category distributions, and 6-month trends.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <Receipt size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Receipt & Invoice Storage</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Snap photos of paper receipts and attach them directly to transactions in encrypted cloud storage for easy tax audits.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Wallet size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Category Budget Targets</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Establish monthly spending limits per category. Visual indicators alert you when you reach 80% and 100% capacity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-tr from-gray-900 to-slate-900 rounded-3xl p-8 sm:p-14 text-white flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-blue-200">
              <Lock size={14} /> Strict Data Isolation
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Your Financial Privacy is Non-Negotiable
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Every transaction, receipt photo, and budget is stored in user-scoped Firestore subcollections protected by strict server-side rules. Only authenticated owners have access to their records.
            </p>
          </div>
          <div className="shrink-0 flex flex-col gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-2xl backdrop-blur-md">
              <ShieldCheck className="text-green-400" size={24} />
              <span className="text-xs font-bold">Firebase Authentication & Cloud Storage</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-2xl backdrop-blur-md">
              <Globe className="text-blue-400" size={24} />
              <span className="text-xs font-bold">Global Multi-Currency Engine</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-4 sm:px-8 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center text-white">
              <Wallet size={16} />
            </div>
            <span className="font-extrabold text-gray-900 text-sm">SpendWise</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link to="/login" className="hover:text-gray-900 transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-gray-900 transition-colors">Register</Link>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          </div>

          <p>© {new Date().getFullYear()} SpendWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;