import i18n from './i18n';

// Format currency values in Hong Kong Dollars
export function formatCurrency(amount: number, language?: string): string {
  const currentLanguage = language || i18n.language || 'en';
  const locale = currentLanguage === 'zh-Hant' ? 'zh-HK' : 'en-HK';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'HKD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format currency for kids with simpler display
export function formatCurrencySimple(amount: number, language?: string): string {
  const currentLanguage = language || i18n.language || 'en';
  // Use i18n for currency formatting
  return i18n.t('formatting.currency', { amount: amount.toFixed(2) });
}

// Format dates in a kid-friendly way
export function formatDate(date: Date, language?: string): string {
  const currentLanguage = language || i18n.language || 'en';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);
  
  if (inputDate.getTime() === today.getTime()) {
    return i18n.t('common.today');
  } else if (inputDate.getTime() === yesterday.getTime()) {
    return i18n.t('common.yesterday');
  } else {
    const day = inputDate.getDate();
    const monthNames = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];
    const monthKey = monthNames[inputDate.getMonth()];
    const month = i18n.t(`formatting.months.${monthKey}`);
    return `${day} ${month}`;
  }
}