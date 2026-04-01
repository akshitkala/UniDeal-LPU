import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase/client'

/**
 * UT-01: Client-side Google Sign-In (Login Fix).
 * Authenticates with Firebase via Popup and returns the ID Token for server-side verification.
 * 
 * Restricted to verified @lpu.in addresses (handled via Firebase custom parameters or server-side).
 */
export async function signInWithGoogle(): Promise<string> {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const idToken = await result.user.getIdToken()
    return idToken
  } catch (error: any) {
    console.error('[Firebase Auth Error]', error)
    throw new Error(error.message || 'Identity verification aborted.')
  }
}
