import { Resident } from '../types';

export type ResidentCategory = 'Paid' | 'Upcoming' | 'Pending';

/**
 * Represents a resident with their assigned category
 */
export interface CategorizedResident extends Resident {
  category: ResidentCategory;
  daysUntilCheckOut?: number;
}

/**
 * Categorizes residents based on their check-in and check-out dates
 *
 * Categories:
 * - Paid: Current date is between check-in and check-out date
 * - Upcoming: Check-out date is within the next 7 days
 * - Pending: Check-out date has already passed
 *
 * @param residents - Array of residents to categorize
 * @returns Object with categorized residents by category, and all residents with category info
 */
export const categorizeResidents = (
  residents: Resident[]
): {
  all: CategorizedResident[];
  paid: CategorizedResident[];
  upcoming: CategorizedResident[];
  pending: CategorizedResident[];
} => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const categorizedAll: CategorizedResident[] = residents.map(resident => {
    const checkInDate = convertToDate(resident.startDate);
    const checkOutDate = convertToDate(resident.endDate);

    let category: ResidentCategory = 'Pending';
    let daysUntilCheckOut = 0;

    if (checkInDate && checkOutDate) {
      // Normalize check-in and check-out dates to midnight local time for accurate comparison
      const normalizedCheckIn = new Date(checkInDate);
      normalizedCheckIn.setHours(0, 0, 0, 0);
      
      const normalizedCheckOut = new Date(checkOutDate);
      normalizedCheckOut.setHours(0, 0, 0, 0);

      const differenceInTime = normalizedCheckOut.getTime() - today.getTime();
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
      daysUntilCheckOut = differenceInDays;

      // Priority 1: Check if checkout date has passed (Pending - Overdue Payment)
      if (differenceInDays <= 0) {
        category = 'Pending';
      }
      // Priority 2: Check if checkout is within next 7 days (Upcoming - Payment Follow-up Needed)
      else if (differenceInDays > 0 && differenceInDays <= 7 && today >= normalizedCheckIn) {
        category = 'Upcoming';
      }
      // Priority 3: Check if current date is between check-in and check-out with more than 7 days left (Paid - No Immediate Action)
      else if (today >= normalizedCheckIn && today <= normalizedCheckOut) {
        category = 'Paid';
      }
    }

    return {
      ...resident,
      category,
      daysUntilCheckOut,
    };
  });

  return {
    all: categorizedAll,
    paid: categorizedAll.filter(r => r.category === 'Paid'),
    upcoming: categorizedAll.filter(r => r.category === 'Upcoming'),
    pending: categorizedAll.filter(r => r.category === 'Pending'),
  };
};

/**
 * Converts various date formats to JavaScript Date object
 * Handles: Firestore Timestamp, ISO string, Date object, and string formats
 */
const convertToDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;

  // If it's a Firestore Timestamp
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // If it's already a Date
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // If it's a string (ISO format or other)
  if (typeof dateValue === 'string') {
    const parsedDate = new Date(dateValue);
    return isValidDate(parsedDate) ? parsedDate : null;
  }

  // If it's a number (timestamp in milliseconds)
  if (typeof dateValue === 'number') {
    const parsedDate = new Date(dateValue);
    return isValidDate(parsedDate) ? parsedDate : null;
  }

  return null;
};

/**
 * Checks if a given date is valid
 */
const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Checks if a date falls between two dates (inclusive)
 */
const isDateBetween = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate;
};

/**
 * Formats the category with proper display text (for payment tracking)
 */
export const getCategoryLabel = (category: ResidentCategory): string => {
  const labels: Record<ResidentCategory, string> = {
    Paid: 'Payment Received',
    Upcoming: 'Payment Due Soon',
    Pending: 'Payment Overdue',
  };
  return labels[category];
};

/**
 * Gets the color for a category (for UI purposes)
 */
export const getCategoryColor = (category: ResidentCategory): string => {
  const colors: Record<ResidentCategory, string> = {
    Paid: '#4CAF50', // Green
    Upcoming: '#FF9800', // Orange
    Pending: '#F44336', // Red
  };
  return colors[category];
};

/**
 * Formats display text for days until checkout
 */
export const formatCheckoutDays = (daysUntilCheckOut?: number): string => {
  if (daysUntilCheckOut === undefined || daysUntilCheckOut === null) {
    return '';
  }

  if (daysUntilCheckOut === 0) {
    return 'Checking out today';
  }

  if (daysUntilCheckOut === 1) {
    return 'Checking out tomorrow';
  }

  if (daysUntilCheckOut > 0) {
    return `${daysUntilCheckOut} days left`;
  }

  if (daysUntilCheckOut === -1) {
    return 'Checked out yesterday';
  }

  return `${Math.abs(daysUntilCheckOut)} days overdue`;
};
