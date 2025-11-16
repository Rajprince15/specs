import { format as dateFnsFormat } from 'date-fns';
import { enUS, hi } from 'date-fns/locale';

// Currency formatter - Default to INR
export const formatCurrency = (amount, currencyCode = 'INR', locale = 'en') => {
  try {
    // Default currency is INR for all locales
    const currency = 'INR';

    // Format using Intl.NumberFormat with Indian locale
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting with INR symbol
    return `₹${amount.toFixed(2)}`;
  }
};

// Date formatter
export const formatDate = (date, formatString = 'PP', locale = 'en') => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Map locale to date-fns locale
    const localeMap = {
      en: enUS,
      hi: hi,
    };

    return dateFnsFormat(dateObj, formatString, {
      locale: localeMap[locale] || enUS,
    });
  } catch (error) {
    return date.toString();
  }
};

// Date and time formatter
export const formatDateTime = (date, locale = 'en') => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    return date.toString();
  }
};

// Number formatter
export const formatNumber = (number, locale = 'en') => {
  try {
    return new Intl.NumberFormat('en-IN').format(number);
  } catch (error) {
    return number.toString();
  }
};

// Percentage formatter
export const formatPercentage = (value, locale = 'en') => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch (error) {
    return `${value}%`;
  }
};
