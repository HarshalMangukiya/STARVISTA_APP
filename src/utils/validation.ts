/**
 * Email validation
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
    default:
      return null;
  }
};
