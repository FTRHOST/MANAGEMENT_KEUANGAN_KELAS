// This file is no longer needed with the manual cashier day system.
// You can safely delete it. It is kept here to avoid breaking imports
// but its functions are no longer used in the main logic.

import {
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { id } from 'date-fns/locale';

export function getWeeks(startDate: string) {
  if (!startDate) return [];
  const start = new Date(startDate);
  const now = new Date();
  const weeks = eachWeekOfInterval(
    { start, end: now },
    { weekStartsOn: 1 } // Monday
  );

  return weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return {
      label: `Minggu: ${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy', { locale: id })}`,
      start: weekStart,
      end: weekEnd,
    };
  });
}

export function getMonths(startDate: string) {
    if (!startDate) return [];
  const start = new Date(startDate);
  const now = new Date();
  const months = eachMonthOfInterval({ start, end: now });

  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    return {
      label: format(monthStart, 'MMMM yyyy', { locale: id }),
      start: monthStart,
      end: monthEnd,
    };
  });
}
