// src/utils/dateUtils.js
export const formatDate = (date, locale = 'fr-FR') => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(locale);
  };
  
  export const formatDateTime = (date, locale = 'fr-FR') => {
    if (!date) return '';
    return new Date(date).toLocaleString(locale);
  };
  
  export const formatDateTimeShort = (date, locale = 'fr-FR') => {
    if (!date) return '';
    const now = new Date();
    const dateObj = new Date(date);
    const diffMs = now - dateObj;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return dateObj.toLocaleDateString(locale);
    }
  };
  
  export const isToday = (date) => {
    const today = new Date();
    const dateObj = new Date(date);
    return dateObj.toDateString() === today.toDateString();
  };
  
  export const isThisWeek = (date) => {
    const today = new Date();
    const dateObj = new Date(date);
    const diffMs = today - dateObj;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays < 7;
  };