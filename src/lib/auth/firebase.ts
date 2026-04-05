import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase/client'

/**
 * UT-01: Client-side Google Sign-In.
 */
export async function signInWithGoogle(): Promise<string> {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return await result.user.getIdToken()
  } catch (error: any) {
    console.error('[Firebase Google Auth Error]', error)
    throw new Error('Google sign-in failed.')
  }
}

/**
 * UT-02: Client-side Email/Password Login.
 */
export async function signInWithEmail(email: string, pass: string): Promise<string> {
  const result = await signInWithEmailAndPassword(auth, email, pass)
  return await result.user.getIdToken()
}

/**
 * UT-03: Client-side Email/Password Registration.
 */
export async function registerWithEmail(email: string, pass: string): Promise<string> {
  const result = await createUserWithEmailAndPassword(auth, email, pass)
  // Set default display name from email
  await updateProfile(result.user, { 
    displayName: email.split('@')[0] 
  })
  return await result.user.getIdToken()
}

/**
 * UT-04: Client-side Password Reset.
 */
export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}
