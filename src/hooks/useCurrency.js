import { useSettings } from '../context/SettingsContext';

export const getCurrencySymbol = (currencyCode) => {
  switch (currencyCode) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'CAD': return 'CA$';
    case 'AUD': return 'A$';
    case 'JPY': return '¥';
    case 'INR': default: return '₹';
  }
};

export const useCurrency = () => {
  const { settings } = useSettings();
  const currencyCode = settings?.currency || 'INR';
  const symbol = getCurrencySymbol(currencyCode);

  const formatCurrency = (amount, options = {}) => {
    const { showSign = false, decimals = 2 } = options;
    const num = Number(amount) || 0;
    const isNegative = num < 0;
    const absVal = Math.abs(num);
    const locale = currencyCode === 'INR' ? 'en-IN' : undefined;
    const formattedAmount = absVal.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (isNegative) {
      return `-${symbol}${formattedAmount}`;
    }
    if (showSign && num > 0) {
      return `+${symbol}${formattedAmount}`;
    }
    return `${symbol}${formattedAmount}`;
  };

  const formatCurrencyCompact = (amount) => {
    const num = Number(amount) || 0;
    const isNegative = num < 0;
    const absVal = Math.abs(num);
    const locale = currencyCode === 'INR' ? 'en-IN' : undefined;
    return `${isNegative ? '-' : ''}${symbol}${absVal.toLocaleString(locale)}`;
  };

  return { formatCurrency, formatCurrencyCompact, symbol, currencyCode };
};
