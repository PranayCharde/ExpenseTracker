import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck, 
  Zap,
  Star
} from 'lucide-react';
import Button from '../components/common/Button';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white">
            <Wallet size={20} />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">SpendWise</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
          <a href="#pricing" className="hover:text-brand-primary transition-colors">Pricing</a>
          <a href="#about" className="hover:text-brand-primary transition-colors">About</a>
          <Link to="/settings" className="hover:text-brand-primary transition-colors">Login</Link>
          <Link to="/dashboard">
            <Button size="sm" className="rounded-full px-6 shadow-md shadow-blue-100">Get Started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-green-100">
          <Zap size={14} className="animate-pulse" />
          NEW: AI Budget Insights
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1]">
          Take Control of <br />
          <span className="text-brand-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Your Finances</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mb-10 leading-relaxed">
          Track expenses, set smart budgets, and reach your financial goals with real-time data visualization. Simple, secure, and smart.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link to="/dashboard">
            <Button size="lg" className="rounded-xl px-10 py-5 text-base shadow-xl shadow-blue-200">
              Start Free Trial
            </Button>
          </Link>
          <Button variant="secondary" size="lg" className="rounded-xl px-10 py-5 text-base" icon={Play}>
            Watch Demo
          </Button>
        </div>

        {/* Hero Image Mockup - as seen in Photo 4 */}
        <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 bg-gray-50 p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             {/* Mock Dashboard Preview */}
             <div className="p-8 flex flex-col gap-6 bg-white">
                <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                   <div className="flex gap-4">
                      <div className="w-48 h-24 bg-blue-50/50 rounded-xl p-4 border border-blue-50">
                        <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Total Balance</p>
                        <p className="text-2xl font-bold text-gray-900">₹24,560.00</p>
                      </div>
                      <div className="w-48 h-24 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Savings Goal</p>
                        <p className="text-2xl font-bold text-gray-900">82%</p>
                      </div>
                   </div>
                </div>
                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between p-4 bg-gray-50/30 rounded-xl border border-gray-50 hover:bg-white transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500"><CheckCircle2 size={16} /></div>
                        <p className="text-sm font-semibold">Amazon Purchase</p>
                      </div>
                      <p className="text-sm font-bold text-red-500">-₹64.20</p>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-gray-50/30 rounded-xl border border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-500"><CheckCircle2 size={16} /></div>
                        <p className="text-sm font-semibold">Salary Deposit</p>
                      </div>
                      <p className="text-sm font-bold text-green-500">+₹4,200.00</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Featured Items - Photo 4 Bottom */}
      <section id="features" className="py-24 bg-gray-50/50 border-y border-gray-100 px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-blue-50 text-brand-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Tracking</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Connect over 10,000+ banks worldwide to see your transactions instantly as they happen.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Budgeting</h3>
            <p className="text-gray-500 text-sm leading-relaxed">AI-powered suggestions that analyze your spending patterns to help you save more each month.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Bank-Grade Security</h3>
            <p className="text-gray-500 text-sm leading-relaxed">256-bit encryption and multi-factor authentication to keep your financial data strictly private.</p>
          </div>
        </div>
      </section>

      {/* Footer Snapshot - Photo 4 */}
      <footer className="py-20 px-8 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-gray-400">
           <div className="flex items-center gap-2">
              <Wallet size={20} className="text-brand-primary" />
              <span className="font-bold text-gray-900">SpendWise</span>
           </div>
           <div className="flex gap-8">
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900">Terms of Service</a>
              <a href="#" className="hover:text-gray-900">Contact Support</a>
           </div>
           <p>© 2024 SpendWise Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
