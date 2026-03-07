export const CURRENCY_SYMBOL = '₹';

export const formatCurrency = (amount) => {
    const isNegative = amount < 0;
    const formattedAmount = Math.abs(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${isNegative ? '-' : ''}${CURRENCY_SYMBOL}${formattedAmount}`;
};

export const formatCurrencyCompact = (amount) => {
    return `${CURRENCY_SYMBOL}${amount.toLocaleString()}`;
};
