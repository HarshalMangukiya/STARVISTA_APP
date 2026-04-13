import { useState, useEffect, useCallback } from 'react';
import { Resident } from '../types';
import { 
  categorizeResidents, 
  CategorizedResident,
  ResidentCategory 
} from './residentCategorization';

/**
 * Custom hook for resident categorization
 * 
 * Usage:
 * const { 
 *   categorizedResidents, 
 *   paidResidents,
 *   upcomingResidents,
 *   pendingResidents,
 *   refetchCategories
 * } = useCategorizeResidents(residentsList);
 */
export const useCategorizeResidents = (residents: Resident[]) => {
  const [categorizedResidents, setCategorizedResidents] = useState<CategorizedResident[]>([]);
  const [paidResidents, setPaidResidents] = useState<CategorizedResident[]>([]);
  const [upcomingResidents, setUpcomingResidents] = useState<CategorizedResident[]>([]);
  const [pendingResidents, setPendingResidents] = useState<CategorizedResident[]>([]);

  const refetchCategories = useCallback(() => {
    const { all, paid, upcoming, pending } = categorizeResidents(residents);
    setCategorizedResidents(all);
    setPaidResidents(paid);
    setUpcomingResidents(upcoming);
    setPendingResidents(pending);
  }, [residents]);

  useEffect(() => {
    refetchCategories();
  }, [refetchCategories]);

  return {
    categorizedResidents,
    paidResidents,
    upcomingResidents,
    pendingResidents,
    refetchCategories,
    getCategoryResidents: (category: ResidentCategory) => {
      const categoryMap = {
        'Paid': paidResidents,
        'Upcoming': upcomingResidents,
        'Pending': pendingResidents,
      };
      return categoryMap[category];
    },
  };
};

/**
 * Custom hook for filtering categorized residents
 * 
 * Usage:
 * const filtered = useFilterCategorizedResidents(
 *   categorizedResidents,
 *   'Upcoming',
 *   'John'
 * );
 */
export const useFilterCategorizedResidents = (
  residents: CategorizedResident[],
  categoryFilter?: ResidentCategory | 'All',
  searchQuery?: string
) => {
  const [filtered, setFiltered] = useState<CategorizedResident[]>([]);

  useEffect(() => {
    let result = [...residents];

    // Apply category filter
    if (categoryFilter && categoryFilter !== 'All') {
      result = result.filter(r => r.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        r =>
          r.studentName.toLowerCase().includes(query) ||
          r.mobileNumber.includes(query) ||
          r.emailId.toLowerCase().includes(query) ||
          r.roomNumber.toLowerCase().includes(query)
      );
    }

    setFiltered(result);
  }, [residents, categoryFilter, searchQuery]);

  return filtered;
};

/**
 * Custom hook for daily category refresh
 * 
 * Usage:
 * useDailyCategoryRefresh(() => {
 *   // Your refresh logic
 * });
 */
export const useDailyCategoryRefresh = (onRefresh: () => void) => {
  useEffect(() => {
    const setupDailyRefresh = () => {
      // Calculate time until next midnight
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const timeUntilMidnight = tomorrow.getTime() - now.getTime();

      // Schedule first refresh at midnight
      const timeoutId = setTimeout(() => {
        onRefresh();

        // Then refresh every 24 hours
        const intervalId = setInterval(() => {
          onRefresh();
        }, 24 * 60 * 60 * 1000);

        return () => clearInterval(intervalId);
      }, timeUntilMidnight);

      return () => clearTimeout(timeoutId);
    };

    const cleanup = setupDailyRefresh();

    return () => {
      cleanup();
    };
  }, [onRefresh]);
};

/**
 * Custom hook for getting residents by status with statistics
 * 
 * Usage:
 * const stats = useCategoryStatistics(categorizedResidents);
 * console.log(stats.upcomingCount); // 8
 * console.log(stats.avgDaysOverdue); // 5.2
 */
export const useCategoryStatistics = (residents: CategorizedResident[]) => {
  const [stats, setStats] = useState({
    totalResidents: 0,
    paidCount: 0,
    upcomingCount: 0,
    pendingCount: 0,
    avgDaysLeftUpcoming: 0,
    avgDaysOverduePending: 0,
    totalDaysOverdue: 0,
    maxDaysOverdue: 0,
  });

  useEffect(() => {
    const paid = residents.filter(r => r.category === 'Paid');
    const upcoming = residents.filter(r => r.category === 'Upcoming');
    const pending = residents.filter(r => r.category === 'Pending');

    const upcomingDays = upcoming
      .map(r => r.daysUntilCheckOut || 0)
      .filter(d => d > 0);
    
    const pendingDays = pending
      .map(r => Math.abs(r.daysUntilCheckOut || 0))
      .filter(d => d > 0);

    const avgDaysLeftUpcoming = upcomingDays.length > 0
      ? upcomingDays.reduce((a, b) => a + b, 0) / upcomingDays.length
      : 0;

    const avgDaysOverduePending = pendingDays.length > 0
      ? pendingDays.reduce((a, b) => a + b, 0) / pendingDays.length
      : 0;

    const maxDaysOverdue = pendingDays.length > 0 ? Math.max(...pendingDays) : 0;
    const totalDaysOverdue = pendingDays.reduce((a, b) => a + b, 0);

    setStats({
      totalResidents: residents.length,
      paidCount: paid.length,
      upcomingCount: upcoming.length,
      pendingCount: pending.length,
      avgDaysLeftUpcoming: Math.round(avgDaysLeftUpcoming * 10) / 10,
      avgDaysOverduePending: Math.round(avgDaysOverduePending * 10) / 10,
      totalDaysOverdue,
      maxDaysOverdue,
    });
  }, [residents]);

  return stats;
};

/**
 * Custom hook for batch operations on categorized residents
 * 
 * Usage:
 * const batch = useBatchCategoryOperations(categorizedResidents);
 * await batch.markCategoryAsPaid('Pending');
 * await batch.sendRemindersToCategory('Upcoming');
 */
export const useBatchCategoryOperations = (
  residents: CategorizedResident[],
  onUpdate?: (resident: CategorizedResident) => Promise<void>
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processBatch = useCallback(
    async (
      residents: CategorizedResident[],
      operation: (resident: CategorizedResident) => Promise<void>
    ) => {
      setIsProcessing(true);
      setProgress(0);

      try {
        for (let i = 0; i < residents.length; i++) {
          await operation(residents[i]);
          setProgress(Math.round((i + 1) / residents.length * 100));
        }
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    },
    []
  );

  return {
    isProcessing,
    progress,
    getResidentsByCategory: (category: ResidentCategory) => 
      residents.filter(r => r.category === category),
    processCategory: async (
      category: ResidentCategory,
      operation: (resident: CategorizedResident) => Promise<void>
    ) => {
      const targetResidents = residents.filter(r => r.category === category);
      await processBatch(targetResidents, operation);
    },
  };
};
