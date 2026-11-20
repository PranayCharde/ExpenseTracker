/**
 * SpendWise AI Financial Advisor Service
 * Provides smart, data-driven financial advice, savings recommendations,
 * and budget analysis. Supports both Google Gemini API and a built-in
 * zero-config Financial Intelligence Engine.
 */

/**
 * Compile financial summary context from user transactions and budgets
 */
export const buildFinancialContext = (transactions = [], budgets = [], physicalWallet = null, currencySymbol = '₹') => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Filter this month's transactions
  const monthTransactions = transactions.filter(tx => {
    const d = tx.parsedDate || (tx.date?.toDate ? tx.date.toDate() : new Date(tx.date || tx.createdAt));
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const totalIncome = monthTransactions
    .filter(t => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category breakdown
  const categoryMap = {};
  monthTransactions
    .filter(t => t.amount < 0)
    .forEach(t => {
      const cat = t.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(t.amount);
    });

  const sortedCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }));

  // Budget status
  const budgetStatuses = budgets.map(b => {
    const spent = categoryMap[b.category] || 0;
    const limit = parseFloat(b.limit || b.amount) || 1;
    const usagePercent = Math.round((spent / limit) * 100);
    return {
      category: b.category,
      spent,
      limit,
      remaining: Math.max(0, limit - spent),
      usagePercent,
      isExceeded: spent > limit,
      isWarning: usagePercent >= 80 && spent <= limit
    };
  });

  // Safe daily spend for remaining days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate());
  const safeDailySpend = netSavings > 0 ? Math.round(netSavings / daysRemaining) : 0;

  return {
    monthName: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    topCategories: sortedCategories.slice(0, 5),
    budgetStatuses,
    safeDailySpend,
    daysRemaining,
    currencySymbol,
    transactionCount: monthTransactions.length,
    physicalWalletBalance: physicalWallet?.amount || 0
  };
};

/**
 * Built-in Financial Intelligence Engine
 * Generates personalized, analytical advice directly in-browser without needing an external API.
 */
const generateLocalFinancialAdvice = (query, context) => {
  const q = query.toLowerCase();
  const { 
    totalIncome, 
    totalExpense, 
    netSavings, 
    savingsRate, 
    topCategories, 
    budgetStatuses, 
    safeDailySpend, 
    daysRemaining,
    currencySymbol,
    monthName 
  } = context;

  const topCategory = topCategories[0] || null;

  // 1. Savings tips & budget reduction
  if (q.includes('save') || q.includes('cut') || q.includes('tip') || q.includes('reduce') || q.includes('less')) {
    let advice = `### 💡 Smart Savings Strategy for ${monthName}\n\n`;
    
    if (savingsRate >= 30) {
      advice += `🌟 **Outstanding job!** Your savings rate is currently **${savingsRate}%** (${currencySymbol}${netSavings.toLocaleString('en-IN')}).\n\n`;
    } else if (savingsRate > 0) {
      advice += `📈 You are saving **${savingsRate}%** of your income so far. Let's aim to reach the recommended **20-30%** benchmark.\n\n`;
    } else {
      advice += `⚠️ **High Burn Alert:** Expenses (${currencySymbol}${totalExpense.toLocaleString('en-IN')}) exceed income this month by **${currencySymbol}${Math.abs(netSavings).toLocaleString('en-IN')}**.\n\n`;
    }

    if (topCategory) {
      const potentialCut = Math.round(topCategory.amount * 0.2);
      advice += `#### 🎯 Highest Impact Opportunity:\n`;
      advice += `Your largest expense is **${topCategory.category}**, accounting for **${topCategory.percentage}%** (${currencySymbol}${topCategory.amount.toLocaleString('en-IN')}) of total spending.\n`;
      advice += `- Cutting back just 20% on ${topCategory.category} saves you **${currencySymbol}${potentialCut.toLocaleString('en-IN')}** this month.\n\n`;
    }

    advice += `#### 📋 Actionable Steps:\n`;
    advice += `1. **Safe Daily Allowance:** Keep your variable daily spend under **${currencySymbol}${safeDailySpend}** for the remaining ${daysRemaining} days.\n`;
    advice += `2. **Apply 50/30/20 Rule:** Allocate 50% to Needs, 30% to Wants, and 20% straight to Savings.\n`;
    advice += `3. **Audit Micro-transactions:** Review daily snacks, coffee, and delivery fees which add up silently.\n`;

    return advice;
  }

  // 2. Spending breakdown & analysis
  if (q.includes('spend') || q.includes('analy') || q.includes('where') || q.includes('breakdown') || q.includes('top')) {
    let advice = `### 📊 Spending Breakdown for ${monthName}\n\n`;
    advice += `- **Total Spent:** ${currencySymbol}${totalExpense.toLocaleString('en-IN')}\n`;
    advice += `- **Total Income:** ${currencySymbol}${totalIncome.toLocaleString('en-IN')}\n`;
    advice += `- **Net Savings:** ${currencySymbol}${netSavings.toLocaleString('en-IN')} (${savingsRate}% rate)\n\n`;

    if (topCategories.length > 0) {
      advice += `#### 🏆 Top Spending Categories:\n`;
      topCategories.forEach((c, i) => {
        advice += `${i + 1}. **${c.category}:** ${currencySymbol}${c.amount.toLocaleString('en-IN')} (${c.percentage}% of expenses)\n`;
      });
      advice += `\n`;
    } else {
      advice += `No expenses recorded yet for this month.\n\n`;
    }

    if (topCategory && topCategory.percentage > 40) {
      advice += `⚠️ **Notice:** ${topCategory.category} alone consumes **${topCategory.percentage}%** of your budget. Diversifying or capping this category will dramatically boost your emergency fund.\n`;
    }

    return advice;
  }

  // 3. Budget alerts & health check
  if (q.includes('budget') || q.includes('alert') || q.includes('limit') || q.includes('exceed') || q.includes('warning')) {
    let advice = `### 🎯 Budget Health Check\n\n`;
    
    if (budgetStatuses.length === 0) {
      advice += `You haven't set up active category budgets yet. Creating budgets for your top categories like **Dining, Shopping, and Groceries** helps prevent end-of-month surprises!\n`;
      return advice;
    }

    const exceeded = budgetStatuses.filter(b => b.isExceeded);
    const warnings = budgetStatuses.filter(b => b.isWarning);

    if (exceeded.length > 0) {
      advice += `🚨 **Budgets Exceeded:**\n`;
      exceeded.forEach(b => {
        advice += `- **${b.category}:** Spent ${currencySymbol}${b.spent.toLocaleString('en-IN')} of ${currencySymbol}${b.limit.toLocaleString('en-IN')} (**${b.usagePercent}%** - over by ${currencySymbol}${(b.spent - b.limit).toLocaleString('en-IN')})\n`;
      });
      advice += `\n`;
    }

    if (warnings.length > 0) {
      advice += `⚠️ **Approaching Limit (≥80%):**\n`;
      warnings.forEach(b => {
        advice += `- **${b.category}:** ${currencySymbol}${b.spent.toLocaleString('en-IN')} / ${currencySymbol}${b.limit.toLocaleString('en-IN')} (${b.usagePercent}%) — Only **${currencySymbol}${b.remaining.toLocaleString('en-IN')}** left for ${daysRemaining} days.\n`;
      });
      advice += `\n`;
    }

    if (exceeded.length === 0 && warnings.length === 0) {
      advice += `✅ **All budgets on track!** None of your active category limits are near exhaustion.\n`;
    }

    return advice;
  }

  // 4. Daily spend limit
  if (q.includes('daily') || q.includes('today') || q.includes('day') || q.includes('allowance') || q.includes('limit')) {
    let advice = `### 📅 Safe Daily Spend Target\n\n`;
    advice += `With **${daysRemaining} days remaining** in ${monthName}:\n\n`;
    advice += `- **Available Net Savings:** ${currencySymbol}${netSavings > 0 ? netSavings.toLocaleString('en-IN') : 0}\n`;
    advice += `- **Recommended Daily Limit:** **${currencySymbol}${safeDailySpend.toLocaleString('en-IN')} / day**\n\n`;
    advice += `Staying under ${currencySymbol}${safeDailySpend} per day ensures you finish the month with positive savings and avoid dipping into reserves.\n`;
    return advice;
  }

  // 5. General Financial Advisor response
  let advice = `### 🤖 SpendWise Financial Insights\n\n`;
  advice += `Here is your current financial pulse for **${monthName}**:\n\n`;
  advice += `- **Net Balance:** ${currencySymbol}${netSavings.toLocaleString('en-IN')} (${savingsRate}% savings rate)\n`;
  if (topCategory) {
    advice += `- **Top Category:** ${topCategory.category} (${currencySymbol}${topCategory.amount.toLocaleString('en-IN')})\n`;
  }
  advice += `- **Safe Daily Target:** ${currencySymbol}${safeDailySpend} / day for the next ${daysRemaining} days\n\n`;

  advice += `#### 💡 How can I help you today?\n`;
  advice += `- *"How can I save more this month?"*\n`;
  advice += `- *"Analyze my spending habits"*\n`;
  advice += `- *"Check my budget limits"*\n`;
  advice += `- *"What should my daily budget limit be?"*\n`;

  return advice;
};

/**
 * Ask the AI Advisor a question
 * @param {string} userMessage - User's question or prompt
 * @param {Object} financialContext - Pre-calculated metrics from buildFinancialContext
 * @returns {Promise<string>} AI response in Markdown
 */
export const queryAiAdvisor = async (userMessage, financialContext) => {
  const geminiApiKey = import.meta.env?.VITE_GEMINI_API_KEY;

  // 1. If Gemini API Key is configured, use Generative AI
  if (geminiApiKey && geminiApiKey.trim().length > 10) {
    try {
      const systemInstruction = `
You are the SpendWise AI Financial Advisor, an intelligent, encouraging personal financial consultant.
Analyze the user's real financial context and provide actionable, structured, concise advice formatted in clear GitHub markdown.

User's Real Financial Context:
- Current Month: ${financialContext.monthName}
- Total Income: ${financialContext.currencySymbol}${financialContext.totalIncome}
- Total Expenses: ${financialContext.currencySymbol}${financialContext.totalExpense}
- Net Savings: ${financialContext.currencySymbol}${financialContext.netSavings} (Savings Rate: ${financialContext.savingsRate}%)
- Safe Daily Spending Allowance: ${financialContext.currencySymbol}${financialContext.safeDailySpend} (Days left: ${financialContext.daysRemaining})
- Top Expense Categories: ${JSON.stringify(financialContext.topCategories)}
- Active Budgets: ${JSON.stringify(financialContext.budgetStatuses)}
- Physical Cash Balance: ${financialContext.currencySymbol}${financialContext.physicalWalletBalance}

Guidelines:
- Reference their actual numbers and categories whenever relevant.
- Offer practical, realistic steps they can take today.
- Use bullet points, bold key numbers, and keep responses engaging and under 250 words.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemInstruction}\n\nUser Question: ${userMessage}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText && aiText.trim()) {
          return aiText;
        }
      }
    } catch (apiErr) {
      console.warn('[AiAdvisor] Gemini API notice, falling back to local engine:', apiErr);
    }
  }

  // 2. Built-in Financial Intelligence Engine (Instant, Zero-Config, Always Works)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateLocalFinancialAdvice(userMessage, financialContext));
    }, 400); // Natural conversational pause
  });
};

