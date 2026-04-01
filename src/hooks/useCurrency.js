import { useSettings } from '../context/SettingsContext';

const getCurrencySymbol = (currencyCode) => {
  switch (currencyCode) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'INR': return '₹';
    case 'USD': default: return '$';
  }
};

export const useCurrency = () => {
  const { settings } = useSettings();
  const symbol = getCurrencySymbol(settings.currency);

  const formatCurrency = (amount) => {
    const isNegative = amount < 0;
    const formattedAmount = Math.abs(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${isNegative ? '-' : ''}${symbol}${formattedAmount}`;
  };

  const formatCurrencyCompact = (amount) => {
    return `${symbol}${amount.toLocaleString()}`;
  };

  return { formatCurrency, formatCurrencyCompact, symbol };
};
