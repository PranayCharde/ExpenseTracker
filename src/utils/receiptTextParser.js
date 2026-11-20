/**
 * Core Receipt Text Parsing Heuristics
 * Extracts Amount, Merchant, Date, Category, and Payment Method from raw OCR lines
 */

export const parseReceiptText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return {
      amount: null,
      merchant: '',
      date: null,
      category: 'Shopping',
      paymentMethod: 'Online / UPI',
      rawText: ''
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. AMOUNT EXTRACTION
  let amount = null;
  const totalKeywords = /(?:total|grand\s*total|net\s*payable|amount\s*due|bill\s*amount|total\s*amount|final\s*amount|net\s*amount|balance\s*due|paid\s*amount|total\s*rs|inr)/i;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (totalKeywords.test(line) && !/subtotal|tax\s*amount/i.test(line)) {
      const match =
        line.match(/(?:(?:₹|rs\.?|inr|\$)\s*)?([\d,]+\.\d{2})/i) ||
        line.match(/(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
        line.match(/([\d,]+\.\d{2})/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0 && val < 5000000) {
          amount = val;
          break;
        }
      }
    }
  }

  if (!amount) {
    const totalMatch = rawText.match(
      /(?:total|grand\s*total|net\s*payable|amount\s*due|total\s*amount)[^\d\n]*?([\d,]+\.\d{2})/i
    );
    if (totalMatch) {
      const val = parseFloat(totalMatch[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) amount = val;
    }
  }

  if (!amount) {
    const allMatches = rawText.match(/(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\.\d{1,2})?)/gi) || [];
    let max = 0;
    for (const m of allMatches) {
      const num = parseFloat(m.replace(/[^\d.]/g, ''));
      if (num > max && num < 1000000) max = num;
    }
    if (max > 0) amount = max;
  }

  // 2. DATE EXTRACTION
  let date = null;
  const dateMatch =
    rawText.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/) ||
    rawText.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);

  if (dateMatch) {
    if (dateMatch[1].length === 4) {
      const y = dateMatch[1];
      const m = dateMatch[2].padStart(2, '0');
      const d = dateMatch[3].padStart(2, '0');
      date = `${y}-${m}-${d}`;
    } else {
      const yr = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
      const part1 = parseInt(dateMatch[1], 10);
      const part2 = parseInt(dateMatch[2], 10);

      let d = part1;
      let m = part2;
      if (part1 > 12 && part2 <= 12) {
        d = part1;
        m = part2;
      } else if (part2 > 12 && part1 <= 12) {
        d = part2;
        m = part1;
      }

      date = `${yr}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // 3. MERCHANT NAME
  let merchant = '';
  const noiseRegex = /(tax|invoice|gstin|cin|tel|phone|welcome|date|time|bill\s*no|order\s*#|receipt|cashier|pos|token|customer|table)/i;

  for (const line of lines.slice(0, 6)) {
    if (!noiseRegex.test(line) && line.length >= 3 && line.length <= 40) {
      const cleaned = line.replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
      if (cleaned && !/^\d+$/.test(cleaned)) {
        merchant = cleaned;
        break;
      }
    }
  }

  // 4. CATEGORY INFERENCE
  let category = 'Shopping';
  const lower = rawText.toLowerCase();

  if (/coffee|latte|cafe|restaurant|muffin|burger|pizza|dining|swiggy|zomato|bakery|food|bar|bistro|diner|kitchen|shawarma|ice\s*cream|tea|snack/i.test(lower)) {
    category = 'Dining';
  } else if (/retail|mart|reliance|supermarket|grocery|groceries|dmart|big\s*basket|milk|bread|butter|fruits|vegetables|provisions|dal|rice/i.test(lower)) {
    category = 'Groceries';
  } else if (/pharmacy|chemist|hospital|apollo|medplus|clinic|tablet|capsule|medical|healthcare|medicine|dr\.|diagnostics|lab/i.test(lower)) {
    category = 'Medical';
  } else if (/petrol|fuel|diesel|gas|shell|hp|bpcl|indianoil|uber|ola|taxi|auto|toll|parking|metro|rail|flight|irctc|airline/i.test(lower)) {
    category = 'Transport';
  } else if (/electric|electricity|power|water|utility|broadband|wifi|internet|airtel|jio|vi\b|recharge|dth/i.test(lower)) {
    category = 'Utilities';
  } else if (/cinema|movie|theatre|pvr|inox|netflix|game|bowling|concert|show/i.test(lower)) {
    category = 'Entertainment';
  } else if (/apparel|clothing|fashion|mall|zara|h&m|pantaloons|trends|westside|footwear|shoes|amazon|flipkart|myntra/i.test(lower)) {
    category = 'Shopping';
  }

  // 5. PAYMENT METHOD
  let paymentMethod = 'Online / UPI';
  if (/cash\s*tendered|paid\s*by\s*cash|payment\s*:\s*cash/i.test(lower) || (/\bcash\b/i.test(lower) && !/cashback|cash\s*memo/i.test(lower))) {
    paymentMethod = 'Cash';
  } else if (/card|visa|mastercard|debit|credit|amex|rupay|pos\s*sale/i.test(lower)) {
    paymentMethod = 'Credit / Debit Card';
  } else if (/upi|gpay|google\s*pay|phonepe|paytm|bhim|qr\s*code|scan\s*&\s*pay/i.test(lower)) {
    paymentMethod = 'Online / UPI';
  }

  return {
    amount,
    merchant: merchant || (category === 'Dining' ? 'Restaurant / Cafe' : 'Store Purchase'),
    date,
    category,
    paymentMethod,
    rawText
  };
};

