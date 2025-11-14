import { format as dateFnsFormat } from 'date-fns';
import { enUS, hi } from 'date-fns/locale';

// Currency formatter
export const formatCurrency = (amount, currencyCode = 'USD', locale = 'en') => {
  try {
    // Map language codes to currency codes
    const currencyMap = {
      en: 'USD',
      hi: 'INR',
    };

    // Get currency based on locale
    const currency = currencyMap[locale] || currencyCode;

    // Format using Intl.NumberFormat
    return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    const symbol = locale === 'hi' ? '₹' : '$';
    return `${symbol}${amount.toFixed(2)}`;
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
    
    return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-US', {
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
    return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-US').format(number);
  } catch (error) {
    return number.toString();
  }
};

// Percentage formatter
export const formatPercentage = (value, locale = 'en') => {
  try {
    return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-US', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch (error) {
    return `${value}%`;
  }
};
