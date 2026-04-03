import { 
  differenceInHours, 
  differenceInDays, 
  isToday, 
  isYesterday 
} from 'date-fns'

/**
 * Returns a human-readable relative time string according to UniDeal standards:
 * - "Today" (if < 24h and is same day)
 * - "Yesterday" (if same day-1)
 * - "X days ago" (if 2-6 days)
 * - "This week" (if 7-30 days)
 * - "This month" (if 30+ days)
 */
export function getRelativeTime(date: Date | string | number): string {
  const d = new Date(date)
  const now = new Date()
  
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  
  const daysDiff = differenceInDays(now, d)
  
  if (daysDiff < 7) {
    return `${daysDiff} days ago`
  }
  
  if (daysDiff <= 30) {
    return 'This week'
  }
  
  return 'This month'
}
