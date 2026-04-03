/**
 * Client-safe image utility for Cloudinary URL transformations.
 * This file contains no Node-only SDK dependencies to avoid 'fs' module errors.
 */

export function getCardImageUrl(url: string | undefined): string | null {
  if (!url) return null
  if (!url.includes('cloudinary.com')) return url
  return url.replace('/upload/', '/upload/w_400,h_400,c_fill,q_85,f_auto/')
}

export function getDetailImageUrl(url: string | undefined): string | null {
  if (!url) return null
  if (!url.includes('cloudinary.com')) return url
  return url.replace('/upload/', '/upload/w_900,c_limit,q_90,f_auto/')
}
