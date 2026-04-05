/**
 * Maps Firebase Auth and backend API error codes to human-friendly messages.
 * Optimized for UniDeal's student audience.
 */
export function getAuthErrorMessage(err: any): string {
  const code = err?.code || err?.message || ''
  const message = typeof err === 'string' ? err : (err?.message || '')

  // Firebase Auth Codes
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
    return 'Invalid email or password. Please try again.'
  }
  
  if (code.includes('auth/email-already-in-use')) {
    return 'This email is already registered. Try logging in instead.'
  }

  if (code.includes('auth/weak-password')) {
    return 'Password is too weak. Use at least 6 characters.'
  }

  if (code.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please wait a moment and try again.'
  }

  if (code.includes('auth/popup-closed-by-user')) {
    return 'Sign-in cancelled. Please try again.'
  }

  if (code.includes('auth/network-request-failed')) {
    return 'Network error. Check your internet connection.'
  }

  if (code.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is currently disabled.'
  }

  // Backend API specific messages (from handleAuthSuccess)
  if (message.includes('Identity Verification Failed')) {
    return 'Verification failed. Try signing in again.'
  }

  if (message.includes('User is banned')) {
    return 'This account has been suspended for violating terms.'
  }

  // Custom form validation
  if (message.includes('Passwords do not match')) {
    return 'Passwords do not match. Check both fields.'
  }

  // Default fallback
  return 'Something went wrong. Please try again or contact support.'
}
