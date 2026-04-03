'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
}

const colors = [
  'bg-rose-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-indigo-500',
]

/**
 * Deterministically pick a color from a string
 */
function getDeterministicColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Extract initials from a name or email
 */
function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.split(/[\s.@]+/)
  if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().substring(0, 2)
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const [error, setError] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fallbackName = name || alt || 'User'
  const initials = getInitials(fallbackName)
  const bgColor = getDeterministicColor(fallbackName)

  if (!mounted) {
    return (
      <div className={cn(
        "rounded-2xl bg-gray-100 animate-pulse shrink-0",
        sizeClasses[size],
        className
      )} />
    )
  }

  if (src && !error) {
    return (
      <div className={cn(
        "relative shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-sm transition-transform duration-300",
        sizeClasses[size],
        className
      )}>
        <img
          src={src}
          alt={alt || name || 'User Avatar'}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    )
  }

  return (
    <div className={cn(
      "flex items-center justify-center rounded-2xl border-2 border-white shadow-sm font-black text-white shrink-0 transition-transform duration-300",
      bgColor,
      sizeClasses[size],
      className
    )}>
      {initials}
    </div>
  )
}
