import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS classes with clsx and tailwind-merge.
 * Standard for shadcn/ui projects.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
