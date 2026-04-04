/**
 * Client-side utilities for managing the non-sensitive session hint.
 * Used to pre-populate UI state and prevent "auth flas" during hydration.
 */

export interface SessionHint {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: string;
}

export function getSessionHint(): SessionHint | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(/session_hint=([^;]+)/);
  if (!match) return null;
  
  try {
    const hint = JSON.parse(decodeURIComponent(match[1]));
    // Minimal validation
    if (hint && typeof hint.uid === 'string') {
      return hint as SessionHint;
    }
    return null;
  } catch (e) {
    console.error('[SessionHint] Failed to parse cookie:', e);
    return null;
  }
}

export function clearLocalSessionHint(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'session_hint=; path=/; max-age=0; SameSite=Strict';
}
