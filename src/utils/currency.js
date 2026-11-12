export const CURRENCY_SYMBOL = '₹';

export const formatCurrency = (amount, symbol = CURRENCY_SYMBOL) => {
    const num = Number(amount) || 0;
    const isNegative = num < 0;
    const locale = symbol === '₹' ? 'en-IN' : undefined;
    const formattedAmount = Math.abs(num).toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${isNegative ? '-' : ''}${symbol}${formattedAmount}`;
};

export const formatCurrencyCompact = (amount, symbol = CURRENCY_SYMBOL) => {
    const num = Number(amount) || 0;
    const isNegative = num < 0;
    const locale = symbol === '₹' ? 'en-IN' : undefined;
    return `${isNegative ? '-' : ''}${symbol}${Math.abs(num).toLocaleString(locale)}`;
};
