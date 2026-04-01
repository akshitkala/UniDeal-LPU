import admin from 'firebase-admin'
import { App, getApps, initializeApp, cert } from 'firebase-admin/app'
import { Auth, getAuth } from 'firebase-admin/auth'

// Prevent re-initialisation across hot-reloads in dev
let adminApp: App

if (getApps().length === 0) {
  adminApp = initializeApp({
    credential: cert({
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      // Vercel stores multiline env vars — replace escaped newlines
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    }),
  })
} else {
  adminApp = getApps()[0]
}

export const adminAuth: Auth = getAuth(adminApp)
export default admin
