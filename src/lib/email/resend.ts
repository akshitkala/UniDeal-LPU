import { Resend } from 'resend'

const resendRaw = new Resend(process.env.RESEND_API_KEY || 'dummy_key')
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://unideal.app'
let derivedDomain = 'unideal.app'
try {
  const url = new URL(SITE_URL)
  // Use hostname to strip ports (Resend rejects domains with colons)
  derivedDomain = url.hostname
  // Fallback to unideal.app if testing locally (localhost doesn't have a TLD)
  if (derivedDomain === 'localhost' || !derivedDomain.includes('.')) {
    derivedDomain = 'unideal.app'
  }
} catch (e) {
  console.error('[Resend Utility] Invalid NEXT_PUBLIC_SITE_URL:', SITE_URL)
}

const FROM_EMAIL = `UniDeal <noreply@${derivedDomain}>` 

async function trySend(payload: any) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend API Key Missing] Suppressing email:', payload.subject, 'to', payload.to)
    return { success: true, mocked: true }
  }
  try {
    const { data, error } = await resendRaw.emails.send(payload)
    if (error) {
      console.error('[Resend Error]', error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (err) {
    console.error('[Resend Exception]', err)
    return { success: false, error: err }
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to UniDeal 👋',
    html: `
      <p>Hi ${name},</p>
      <p>You're on UniDeal — the campus marketplace for buying and selling second-hand items at LPU.</p>
      <p>Browse what's available or list your first item in under a minute.</p>
      <p>
        <a href="${SITE_URL}/browse">[Browse listings]</a> → ${SITE_URL}/browse<br/>
        <a href="${SITE_URL}">[Sell something]</a> → ${SITE_URL}
      </p>
      <p>— The UniDeal team</p>
    `
  })
}

export async function sendListingRejected(to: string, listingTitle: string, reason: string) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: `Your listing "${listingTitle}" wasn't approved`,
    html: `
      <p>Hi there,</p>
      <p>Your listing "${listingTitle}" was reviewed and couldn't be approved.</p>
      <p><strong>Reason:</strong><br/>${reason}</p>
      <p>You can edit the listing and resubmit it from your dashboard.</p>
      <p><a href="${SITE_URL}/dashboard">[Go to My Dashboard]</a> → ${SITE_URL}/dashboard</p>
      <p>If you think this was a mistake, contact us at:<br/>${SITE_URL}/contact</p>
      <p>— UniDeal</p>
    `
  })
}

export async function sendListingDeletedByAdminEmail({ to, name, listing, reason }: { to: string, name: string, listing: string, reason: string }) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: `Your listing "${listing}" has been removed`,
    html: `
      <p>Hi ${name},</p>
      <p>Your listing "${listing}" has been removed by the UniDeal team.</p>
      <p><strong>Reason:</strong><br/>${reason}</p>
      <p>If you think this was a mistake, you can reach us here:<br/>${SITE_URL}/contact</p>
      <p>— UniDeal</p>
    `
  })
}

export async function sendListingExpired(to: string, listingTitle: string) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: `Your listing "${listingTitle}" has expired`,
    html: `
      <p>Hi there,</p>
      <p>Your listing "${listingTitle}" has been up for 60 days and has now expired. It's no longer visible to buyers.</p>
      <p>If the item is still available, post a fresh listing from your dashboard — it only takes a minute.</p>
      <p><a href="${SITE_URL}/dashboard">[Post again]</a> → ${SITE_URL}/dashboard</p>
      <p>— UniDeal</p>
    `
  })
}

export async function sendAccountBanned(to: string, reason: string) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: 'Your UniDeal account has been suspended',
    html: `
      <p>Hi there,</p>
      <p>Your UniDeal account has been suspended.</p>
      <p><strong>Reason:</strong><br/>${reason}</p>
      <p>All your active listings have been hidden.</p>
      <p>If you think this was a mistake, you can appeal here:<br/>${SITE_URL}/contact</p>
      <p>— UniDeal</p>
    `
  })
}

export async function sendAccountDeleted(to: string) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: 'Your account has been deleted',
    html: `
      <p>Hi there,</p>
      <p>Your UniDeal account has been deleted as requested.</p>
      <p>All your data — listings, profile, and contact details — has been permanently removed.</p>
      <p>If you ever want to come back, you can sign up again anytime.</p>
      <p>— UniDeal</p>
    `
  })
}

export async function sendContactMessage(userEmail: string, name: string, userMessage: string) {
  // To Admin
  await trySend({
    from: FROM_EMAIL,
    to: process.env.CONTACT_EMAIL || `admin@${derivedDomain}`,
    subject: `New message from ${name}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Message:</strong><br/>${userMessage}</p>
    `
  })

  // To User
  return trySend({
    from: FROM_EMAIL,
    to: userEmail,
    subject: 'We got your message',
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for reaching out. We've received your message and will get back to you within 48 hours.</p>
      <p>— UniDeal</p>
    `
  })
}

