import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import ContactMessage from '@/lib/db/models/ContactMessage'
import { sendContactMessage } from '@/lib/email/resend'
import { contactSchema } from '@/lib/utils/validate'
import { checkRateLimit } from '@/lib/middleware/rateLimit'
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    // ── RATE LIMIT (3/day per IP) ───────────────────────────────────────────
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') || 'unknown'
    const rl = process.env.NODE_ENV === 'development' 
      ? { allowed: true } 
      : await checkRateLimit(`contact:${ip}`, 3, 86400)
    
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'You have reached the maximum daily limit for support inquiries.' }, 
        { status: 429 }
      )
    }

    const body = await req.json()
    
    // ── VALIDATION & SANITISATION (via Zod transform) ───────────────────────
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.format() }, 
        { status: 400 }
      )
    }

    const { name, email, subject, message } = parsed.data

    await connectDB()

    const newMessage = new ContactMessage({
      name,
      email,
      subject,
      message,
      // ipAddress: ip // optional but good practice
    })
    await newMessage.save()

    // Dispatch asynchronous communications
    await sendContactMessage(email, name, message)

    return NextResponse.json({ success: true, messageId: (newMessage._id as any).toString() }, { status: 201 })
  } catch (error) {
    console.error('[/api/contact POST error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
