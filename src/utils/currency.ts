export const formatCurrency = (amount: number, currencySymbol: string = '$'): string => {
  // Map currency symbols to ISO currency codes
  const currencyMap: Record<string, string> = {
    '$': 'USD',
    'CDF': 'CDF',
    '€': 'EUR',
    '£': 'GBP',
    'FC': 'CDF', // FC maps to CDF
  };

  const currencyCode = currencyMap[currencySymbol] || 'USD';
  
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: currencyCode 
  }).format(amount);
};
