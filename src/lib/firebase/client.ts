import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
}

// Prevent re-initialisation on hot-reload
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const auth: Auth = getAuth(app)

// Google OAuth is the ONLY provider — no email/password
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export default app
