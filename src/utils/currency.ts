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

  // Format the number with proper grouping and decimals
  const formattedNumber = new Intl.NumberFormat('fr-CD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // Append currency symbol
  return `${formattedNumber} ${currencySymbol}`;
};
