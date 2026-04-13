/**
 * Email validation
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Security key validation (XXXX-XXXX format)
 */
export const validateSecurityKey = (key: string): boolean => {
  const keyRegex = /^\d{4}-\d{4}$/;
  return keyRegex.test(key);
};

/**
 * Password validation (min 6 characters)
 */
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Get validation error message
 */
export const getValidationError = (
  field: string,
  value: string
): string | null => {
  if (!value.trim()) {
    return `${field} is required`;
  }

  switch (field.toLowerCase()) {
    case 'email':
      return !validateEmail(value) ? 'Invalid email format' : null;
    case 'password':
      return !validatePassword(value) ? 'Password must be at least 6 characters' : null;
    case 'security key':
      return !validateSecurityKey(value) ? 'Security key must be in format XXXX-XXXX' : null;
    default:
      return null;
  }
};

/**
 * Format security key input (auto-add hyphen)
 */
export const formatSecurityKey = (input: string): string => {
  // Remove any non-digit characters
  let cleaned = input.replace(/\D/g, '');
  
  // Limit to 8 digits
  if (cleaned.length > 8) {
    cleaned = cleaned.slice(0, 8);
  }
  
  // Add hyphen after 4 digits
  if (cleaned.length > 4) {
    return cleaned.slice(0, 4) + '-' + cleaned.slice(4);
  }
  
  return cleaned;
};
