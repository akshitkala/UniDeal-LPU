import { z } from 'zod'

// ── SANITISATION ─────────────────────────────────────────────────────

/**
 * Standard text sanitiser — strips HTML and injection characters.
 * This is a critical security layer against XSS.
 */
export function sanitizeText(str: unknown): string {
  if (typeof str !== 'string') return ''
  
  return str
    // 1. Strip all HTML tags
    .replace(/<[^>]*>/g, '')
    // 2. Strip characters used in injection attacks
    .replace(/[<>"'`;\\$]/g, '')
    // 3. Block SQL/NoSQL operator keywords (defence in depth)
    .replace(/\$where|\$gt|\$lt|\$ne|\$in|\$regex/gi, '')
    // 4. Trim whitespace
    .trim()
}

// ── SCHEMAS & VALIDATORS ─────────────────────────────────────────────

export const listingSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be under 100 characters')
    .transform(s => sanitizeText(s)),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be under 2000 characters')
    .transform(s => sanitizeText(s)),
  price: z.coerce.number()
    .positive('Enter a valid price')
    .max(999999, 'Price is too high'),
  negotiable: z.boolean().default(false),
  category: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid category ID'),
  condition: z.enum(['new', 'like-new', 'good', 'used', 'damaged']),
  // FIXED: Strict Indian mobile regex (Fix 4)
  whatsappNumber: z.string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
})

export const browseSchema = z.object({
  category: z.string().max(50).optional(),
  condition: z.enum(['new', 'like-new', 'good', 'used', 'damaged']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'views']).default('newest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(24),
  // FIXED: search query validated and sanitised (Fix 4)
  q: z.string()
    .max(100)
    .transform(s => sanitizeText(s))
    .optional(),
})

export const contactSchema = z.object({
  name: z.string()
    .min(2, 'Name is required')
    .max(80)
    .transform(s => sanitizeText(s)),
  email: z.string().email('Invalid email address'),
  subject: z.enum(['bug_report', 'ban_appeal', 'listing_dispute', 'general', 'other']),
  message: z.string()
    .min(10, 'Message is too short')
    .max(1000, 'Message is too long')
    .transform(s => sanitizeText(s)),
})

// Keep legacy export for compatibility during migration if needed
export const validators = {
  createListing: listingSchema,
  contactForm: contactSchema,
  username: (v: string) => /^[a-zA-Z0-9._]{2,50}$/.test(v),
  searchQuery: (raw: string) => encodeURIComponent(sanitizeText(raw).slice(0, 100))
}
