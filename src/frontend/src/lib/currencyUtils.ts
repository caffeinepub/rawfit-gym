/**
 * Formats a number as Indian Rupees (INR) with proper formatting
 * @param amount - The amount to format (can be number or bigint)
 * @returns Formatted string with ₹ symbol (e.g., "₹1,499")
 */
export function formatINR(amount: number | bigint): string {
  const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
  
  // Fallback for invalid numbers
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return '₹0';
  }
  
  // Use Indian number formatting (lakhs and crores system)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Formats INR amount per month
 * @param totalAmount - Total amount
 * @param months - Number of months
 * @returns Formatted string (e.g., "₹1,499 per month")
 */
export function formatINRPerMonth(totalAmount: number | bigint, months: number | bigint): string {
  const total = typeof totalAmount === 'bigint' ? Number(totalAmount) : totalAmount;
  const monthCount = typeof months === 'bigint' ? Number(months) : months;
  
  // Fallback for invalid inputs
  if (isNaN(total) || isNaN(monthCount) || monthCount === 0) {
    return '₹0 per month';
  }
  
  const perMonth = total / monthCount;
  
  return `${formatINR(perMonth)} per month`;
}

/**
 * Coerces any numeric input into INR format dynamically
 * Useful for handling cached or legacy data that might have dollar formatting
 * @param value - Any value that should be formatted as INR
 * @returns Formatted INR string
 */
export function coerceToINR(value: any): string {
  // Handle null/undefined
  if (value == null) {
    return '₹0';
  }
  
  // If it's already a formatted string with ₹, return as-is
  if (typeof value === 'string' && value.includes('₹')) {
    return value;
  }
  
  // If it's a string with $, strip it and convert
  if (typeof value === 'string' && value.includes('$')) {
    const numericValue = parseFloat(value.replace(/[$,]/g, ''));
    return formatINR(numericValue);
  }
  
  // Try to parse as number
  const numericValue = typeof value === 'bigint' ? Number(value) : parseFloat(value);
  
  if (isNaN(numericValue)) {
    return '₹0';
  }
  
  return formatINR(numericValue);
}
