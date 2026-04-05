import { GoogleGenerativeAI } from '@google/generative-ai'
import { logAction } from '@/lib/utils/logAction'
import * as Sentry from '@sentry/nextjs'

const SPAM_KEYWORDS = [
  'casino', 'betting', 'sugar daddy', 'assignment help', 'proxy attendance',
  'escort', 'weed', 'drugs', 'vape', 'fake id', 'guns', 'crypto investment'
]

interface AIResult {
  aiFlagged: boolean
  aiUnavailable: boolean
  confidence: number
  reason?: string
}

/**
 * Layer 1: Rule-based text search for restricted keywords.
 */
async function checkSpamKeywords(title: string, description: string): Promise<AIResult> {
  const payload = `${title} ${description}`.toLowerCase()
  for (const keyword of SPAM_KEYWORDS) {
    if (payload.includes(keyword)) {
      return { aiFlagged: true, aiUnavailable: false, confidence: 1.0, reason: `Policy Violation: Restricted keyword '${keyword}'` }
    }
  }
  return { aiFlagged: false, aiUnavailable: false, confidence: 0 }
}

/**
 * Layer 2: Gemini 1.5 Flash - Alignment check (Fix 7: parallelism).
 */
async function checkGeminiAlignment(title: string, description: string, price: number, category: string): Promise<AIResult> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('API Key Missing')
  
  const ai = new GoogleGenerativeAI(key)
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
  
  const prompt = `
    MODERATOR PROMPT:
    Item Title: ${title}
    Item Description: ${description}
    Item Price: ${price} INR
    Categorized As: ${category}

    Assess if this item is a mismatch for the category.
    Return JSON: {"isAligned": boolean, "confidence": number, "reason": string}
  `
  const response = await model.generateContent(prompt)
  const text = response.response.text() || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid AI format')
  
  const data = JSON.parse(jsonMatch[0])
  return {
    aiFlagged: !data.isAligned,
    aiUnavailable: false,
    confidence: data.confidence || 0.9,
    reason: data.reason
  }
}

/**
 * Main AI Verification Entry Point.
 * IMPLEMENTS: Parallel Execution (Fix 7) and Fault Logging (Fix 8).
 */
export async function checkListingAI(
  title: string, 
  description: string, 
  price: number, 
  categoryName: string
): Promise<AIResult> {
  try {
    // ── RUN ALL CHECKS IN PARALLEL (Fix 7) ──────────────────────────
    const [keywordResult, geminiResult] = await Promise.allSettled([
      checkSpamKeywords(title, description),
      checkGeminiAlignment(title, description, price, categoryName)
    ])

    let maxConfidence = 0
    let reasons: string[] = []
    let flagged = false

    // Process Keyword Result
    if (keywordResult.status === 'fulfilled' && keywordResult.value.aiFlagged) {
      flagged = true
      maxConfidence = Math.max(maxConfidence, keywordResult.value.confidence)
      reasons.push(keywordResult.value.reason || '')
    }

    // Process Gemini Result
    if (geminiResult.status === 'fulfilled' && geminiResult.value.aiFlagged) {
      flagged = true
      maxConfidence = Math.max(maxConfidence, geminiResult.value.confidence)
      reasons.push(geminiResult.value.reason || '')
    }

    // Check for "Unavailable" fault across parallel tasks
    const isGeminiFailed = geminiResult.status === 'rejected'
    
    if (isGeminiFailed) {
      return await handleAIUnavailable(title, 'Gemini Service Failure')
    }

    return {
      aiFlagged: flagged,
      aiUnavailable: false,
      confidence: maxConfidence,
      reason: reasons.join(' | ')
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: 'ai-check' },
      extra: { title }
    });
    return await handleAIUnavailable(title, error)
  }
}

/**
 * FAULT HANDLER: Flags listing and generates Audit Log (Fix 8).
 */
async function handleAIUnavailable(title: string, error: unknown): Promise<AIResult> {
  console.error('[AI Failsafe Triggered]', error)
  
  // FIXED: log to AdminActivity (Fix 8)
  await logAction('LISTING_AI_UNAVAILABLE_FLAGGED', {
    actorType: 'system',
    metadata: { 
      listingTitle: title,
      error: error instanceof Error ? error.message : String(error)
    }
  })

  return {
    aiFlagged: true,
    aiUnavailable: true,
    confidence: 0,
    reason: 'AI Verification Service Offline - Manual check required.'
  }
}
