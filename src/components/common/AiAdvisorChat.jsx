import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  RotateCcw, 
  Bot, 
  TrendingUp, 
  Calendar,
  Loader2
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useCurrency } from '../../hooks/useCurrency';
import { buildFinancialContext, queryAiAdvisor } from '../../services/aiAdvisorService';

const QUICK_PROMPTS = [
  { label: '💡 How can I save more?', query: 'How can I save more money this month?' },
  { label: '📊 Analyze top spending', query: 'Analyze my spending habits and top categories' },
  { label: '⚠️ Check budget alerts', query: 'Are any of my budgets near or over the limit?' },
  { label: '📅 Safe daily spend target', query: 'What is my safe daily spending limit for the rest of the month?' }
];

export default function AiAdvisorChat() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { symbol: CURRENCY_SYMBOL } = useCurrency();
  const isDark = settings?.darkMode;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Real-time financial context data
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [physicalWallet, setPhysicalWallet] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Subscribe to live transactions, budgets, and physical wallet
  useEffect(() => {
    if (!user) return;

    const txQuery = query(collection(db, 'users', user.uid, 'transactions'));
    const unsubTx = onSnapshot(txQuery, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('[AiAdvisor] Tx listener notice:', err));

    const bQuery = query(collection(db, 'users', user.uid, 'budgets'));
    const unsubB = onSnapshot(bQuery, (snap) => {
      setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('[AiAdvisor] Budget listener notice:', err));

    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().physicalWallet) {
        setPhysicalWallet(snap.data().physicalWallet);
      }
    }).catch(err => console.warn('[AiAdvisor] Wallet notice:', err));

    return () => {
      unsubTx();
      unsubB();
    };
  }, [user]);

  // Compute live financial context
  const financialContext = useMemo(() => {
    return buildFinancialContext(transactions, budgets, physicalWallet, CURRENCY_SYMBOL);
  }, [transactions, budgets, physicalWallet, CURRENCY_SYMBOL]);

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const savingsMsg = financialContext.savingsRate > 0 
        ? `You have saved **${financialContext.savingsRate}%** (${CURRENCY_SYMBOL}${financialContext.netSavings.toLocaleString('en-IN')}) so far.` 
        : `Your safe daily spending allowance is **${CURRENCY_SYMBOL}${financialContext.safeDailySpend}/day**.`;

      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `👋 Hello! I am your **SpendWise AI Financial Advisor**.\n\nI have loaded your live financial overview for **${financialContext.monthName}**:\n- **Total Income:** ${CURRENCY_SYMBOL}${financialContext.totalIncome.toLocaleString('en-IN')}\n- **Total Expenses:** ${CURRENCY_SYMBOL}${financialContext.totalExpense.toLocaleString('en-IN')}\n- ${savingsMsg}\n\nHow can I help you improve your finances or optimize your spending today?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [financialContext]);

  const handleSendMessage = async (textToSend = null) => {
    const queryText = (typeof textToSend === 'string' ? textToSend : inputText).trim();
    if (!queryText || isTyping) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await queryAiAdvisor(queryText, financialContext);
      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'ai',
          text: '⚠️ I encountered an error generating advice. Please try asking again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([]);
  };

  // Helper to render basic markdown lines with full Dark/Light high-contrast colors
  const renderFormattedText = (text) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className={`font-extrabold text-sm mt-2 mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} className={`font-bold text-xs mt-2 mb-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
            {line.replace('#### ', '')}
          </h5>
        );
      }
      if (line.startsWith('- ')) {
        const itemContent = line.replace('- ', '');
        return (
          <li key={idx} className={`ml-4 list-disc text-xs my-0.5 leading-relaxed ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
            {formatInlineBold(itemContent)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <p key={idx} className={`text-xs my-1 font-medium pl-1 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
            {formatInlineBold(line)}
          </p>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className={`text-xs my-0.5 leading-relaxed ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
          {formatInlineBold(line)}
        </p>
      );
    });
  };

  const formatInlineBold = (str) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className={`font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-full shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 active:scale-95 group"
          title="Open SpendWise AI Financial Advisor"
        >
          <div className="relative">
            <Sparkles size={19} className="animate-pulse text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-black tracking-wide pr-1 text-white">AI Advisor</span>
          <span className="bg-white/25 text-white text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md tracking-wider">
            Smart
          </span>
        </button>
      )}

      {/* Floating Chat Window - 100% Zero Side Scrolling */}
      {isOpen && (
        <div 
          className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-[94vw] sm:w-[410px] h-[580px] max-h-[85vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-all ${
            isDark 
              ? 'bg-slate-900 border-slate-700/80 shadow-black/70 text-slate-100' 
              : 'bg-white border-gray-200 shadow-2xl text-gray-900'
          }`}
        >
          
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold tracking-tight text-white">SpendWise AI Advisor</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </div>
                <p className="text-[10px] text-emerald-100 font-semibold flex items-center gap-1">
                  <span>Live Financial Context Active</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Restart chat"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Quick Context Pill Bar */}
          <div className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-bold shrink-0 ${
            isDark 
              ? 'bg-slate-800/90 border-slate-700/70 text-slate-300' 
              : 'bg-emerald-50/80 border-emerald-100 text-emerald-900'
          }`}>
            <div className="flex items-center gap-1">
              <TrendingUp size={13} className={isDark ? 'text-emerald-400' : 'text-emerald-700'} />
              <span>Savings: <strong className={isDark ? 'text-emerald-400' : 'text-emerald-800'}>{financialContext.savingsRate}%</strong></span>
            </div>
            <span className={isDark ? 'text-slate-600' : 'text-emerald-300'}>•</span>
            <div className="flex items-center gap-1">
              <Calendar size={13} className={isDark ? 'text-teal-400' : 'text-teal-700'} />
              <span>Safe daily: <strong className={isDark ? 'text-teal-400' : 'text-teal-800'}>{CURRENCY_SYMBOL}{financialContext.safeDailySpend}</strong></span>
            </div>
          </div>

          {/* Messages Container - Strictly vertical, zero horizontal overflow */}
          <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3.5 no-scrollbar ${
            isDark ? 'bg-slate-950/70' : 'bg-gray-50/40'
          }`}>
            {messages.map((m) => (
              <div 
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                    isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <Sparkles size={14} />
                  </div>
                )}
                
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs text-xs break-words overflow-hidden ${
                    m.sender === 'user' 
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-tr-none font-medium' 
                      : isDark
                        ? 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none space-y-1'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none space-y-1'
                  }`}
                >
                  {m.sender === 'user' ? (
                    <p className="leading-relaxed text-white">{m.text}</p>
                  ) : (
                    renderFormattedText(m.text)
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                  isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Sparkles size={14} className="animate-spin" />
                </div>
                <div className={`rounded-2xl rounded-tl-none px-4 py-2.5 shadow-xs flex items-center gap-1.5 ${
                  isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
                }`}>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills - Wrap into neat 2-row grid with ZERO horizontal scrolling */}
          <div className={`p-2.5 border-t flex flex-wrap gap-1.5 shrink-0 overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
          }`}>
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isTyping}
                onClick={() => handleSendMessage(p.query)}
                className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 hover:text-white'
                    : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 border border-gray-200 hover:border-emerald-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Composer */}
          <div className={`p-3 border-t flex items-center gap-2 shrink-0 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
          }`}>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              placeholder="Ask about savings, budgets, tips..."
              className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                isDark
                  ? 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 focus:bg-slate-800'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white'
              }`}
            />
            <button
              type="button"
              disabled={!inputText.trim() || isTyping}
              onClick={() => handleSendMessage()}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isTyping ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={15} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
