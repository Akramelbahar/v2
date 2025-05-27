// src/utils/formatUtils.js
export const formatCurrency = (amount, currency = 'MAD', locale = 'fr-MA') => {
    if (amount == null) return '';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  export const formatNumber = (number, locale = 'fr-FR') => {
    if (number == null) return '';
    return new Intl.NumberFormat(locale).format(number);
  };
  
  export const formatPercentage = (value, decimals = 1, locale = 'fr-FR') => {
    if (value == null) return '';
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  };
  
  export const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  export const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
  
  export const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format Moroccan phone numbers
    if (digits.startsWith('212')) {
      const number = digits.substring(3);
      if (number.length === 9) {
        return `+212 ${number.substring(0, 1)} ${number.substring(1, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7)}`;
      }
    }
    
    // Default formatting
    if (digits.length === 10) {
      return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5, 8)} ${digits.substring(8)}`;
    }
    
    return phone;
  };