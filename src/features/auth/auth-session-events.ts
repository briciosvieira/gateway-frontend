const SESSION_EXPIRED_EVENT = 'gateway-hub-lf:session-expired';
const SESSION_EXPIRED_STORAGE_KEY = 'gateway-hub-lf-session-expired';

/**
 * Marks the session as expired (a temporary sessionStorage flag, no error
 * details) and notifies AuthContext via a dedicated DOM event, so the
 * refresh flow in api-client.ts stays decoupled from React.
 */
export function emitSessionExpired(): void {
  window.sessionStorage.setItem(SESSION_EXPIRED_STORAGE_KEY, '1');
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function subscribeToSessionExpired(callback: () => void): () => void {
  window.addEventListener(SESSION_EXPIRED_EVENT, callback);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, callback);
}

/**
 * Reads and clears the session-expired flag. Called once by LoginPage on
 * mount to decide whether to show "your session has expired" after the
 * redirect triggered by ProtectedRoute.
 */
export function consumeSessionExpiredFlag(): boolean {
  const wasExpired = window.sessionStorage.getItem(SESSION_EXPIRED_STORAGE_KEY) === '1';
  window.sessionStorage.removeItem(SESSION_EXPIRED_STORAGE_KEY);
  return wasExpired;
}
