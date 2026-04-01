import { Resend } from 'resend'

const resendRaw = new Resend(process.env.RESEND_API_KEY || 'dummy_key')
const FROM_EMAIL = 'UniDeal <noreply@unideal.app>' 

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
    subject: 'Welcome to UniDeal! 🎓',
    html: `
      <h2>Hi ${name}, welcome to UniDeal!</h2>
      <p>Your student account has been created successfully.</p>
      <p>You can now browse secure deals or upload your own listings to the marketplace.</p>
      <br/><a href="https://unideal.app/dashboard">Enter Dashboard</a>
    `
  })
}

export async function sendListingRejected(to: string, listingTitle: string, reason: string) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: `Your Listing "${listingTitle}" was Rejected`,
    html: `
      <h2 style="color: #D32F2F;">Listing Flagged & Rejected</h2>
      <p>Unfortunately, your submission for <strong>${listingTitle}</strong> has been rejected by our manual moderation team.</p>
      <div style="background: #F9F9F9; padding: 15px; border-left: 4px solid #D32F2F;">
        <strong>Moderator Reason:</strong><br/>
        ${reason}
      </div>
      <p>Please revise your item and submit a new listing.</p>
    `
  })
}

export async function sendListingDeleted(to: string, listingTitle: string, reason: string) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: `Admin Action: Listing "${listingTitle}" Removed`,
    html: `
      <h2>Constructive Removal Notice</h2>
      <p>Your active listing <strong>${listingTitle}</strong> has been removed from UniDeal due to a moderation cascade.</p>
      <div style="background: #FFF3E0; padding: 15px; border-left: 4px solid #F57C00;">
        <strong>Reason:</strong> ${reason}
      </div>
      <p>If you believe this is an error, please <a href="https://unideal.app/contact">Contact Support</a>.</p>
    `
  })
}

export async function sendListingDeletedByAdminEmail({ to, name, listing, reason }: { to: string, name: string, listing: string, reason: string }) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: `Admin Action: Your listing "${listing}" was removed`,
    html: `
      <h2>Moderation Notice</h2>
      <p>Hi ${name},</p>
      <p>Your listing <strong>${listing}</strong> has been removed by a UniDeal administrator.</p>
      <div style="background: #FFF3E0; padding: 15px; border-left: 4px solid #F57C00; margin: 20px 0;">
        <strong>Reason for Removal:</strong> ${reason}
      </div>
      <p>If you believe this is an error, you may appeal this decision by replying to this email or contacting campus support.</p>
    `
  })
}

export async function sendListingExpired(to: string, listingTitle: string) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: `Your Listing "${listingTitle}" has Expired`,
    html: `
      <h2>Listing Expiration</h2>
      <p>Your item <strong>${listingTitle}</strong> has exceeded its 60-day shelf life and is no longer visible on the public framework.</p>
      <p>If this item is still available for sale, please log into your dashboard and post a fresh listing.</p>
      <br/><a href="https://unideal.app/dashboard">My Dashboard</a>
    `
  })
}

export async function sendAccountBanned(to: string, reason: string) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: `URGENT: UniDeal Account Suspended`,
    html: `
      <h2 style="color: #D32F2F;">Account Suspension Notice</h2>
      <p>Your student profile has been restricted from accessing the UniDeal marketplace architecture.</p>
      <div style="background: #F9F9F9; padding: 15px; border-left: 4px solid #D32F2F;">
        <strong>Enforcement Reason:</strong><br/>
        ${reason}
      </div>
      <p>All active listings have been hidden immediately. To lodge an appeal, please reach out to the moderation desk.</p>
      <br/><a href="https://unideal.app/contact">Contact Us</a>
    `
  })
}

export async function sendAccountDeleted(to: string) {
  return trySend({
    from: FROM_EMAIL,
    to,
    subject: `Data Deletion Confirmation`,
    html: `
      <h2>Right to Erasure Fulfilled</h2>
      <p>This automated message confirms that your UniDeal registry, including all items, secure messages, and uploaded asset binaries have been irreversibly purged from our AWS and MongoDB datastores.</p>
      <p>We're sad to see you go! You are welcome to create a new profile anytime.</p>
    `
  })
}

export async function sendContactMessage(userEmail: string, name: string, userMessage: string) {
  // To Admin
  await trySend({
    from: FROM_EMAIL,
    to: 'admin@unideal.app', // Usually mapped to env
    subject: `New Support Ticket from ${name}`,
    html: `
      <h3>New Inquiry</h3>
      <p><strong>From:</strong> ${name} &lt;${userEmail}&gt;</p>
      <hr/>
      <p>${userMessage}</p>
    `
  })

  // To User
  return trySend({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `We've received your request!`,
    html: `
      <p>Hi ${name},</p>
      <p>We have successfully logged your secure support ticket.</p>
      <p>Our moderation desk will review this vector within 48 hours.</p>
      <br/><p>The UniDeal Administration</p>
    `
  })
}
