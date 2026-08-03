/**
 * CardioRetina AI — Pre-configured User Accounts
 *
 * These are hashed credentials for authorized clinic staff.
 * In production, replace this with a real backend auth endpoint.
 *
 * Passwords are hashed with SHA-256 using SubtleCrypto (browser native).
 *
 * To add a new user, compute SHA-256 of their password and add an entry below.
 * You can compute hashes at: https://emn178.github.io/online-tools/sha256.html
 *
 * Default accounts (CHANGE THESE IN PRODUCTION):
 *   dr.sarah@cardioretina.ai / CardioRetina@2025
 *   admin@cardioretina.ai / Admin@Secure2025
 */

export interface CredentialUser {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'admin' | 'technician';
  specialization?: string;
  passwordHash: string; // SHA-256 hex
}

export const CONFIGURED_USERS: CredentialUser[] = [
  {
    id: 'usr-001',
    name: 'Dr. Sarah Johnson',
    email: 'dr.sarah@cardioretina.ai',
    role: 'doctor',
    specialization: 'Ophthalmologist',
    // SHA-256 of "CardioRetina@2025"
    passwordHash: '781cb25dcddcd3b682f389d7bb6474552e708c19bca68401e5b0630ab9af3457',
  },
  {
    id: 'usr-002',
    name: 'Admin User',
    email: 'admin@cardioretina.ai',
    role: 'admin',
    // SHA-256 of "Admin@Secure2025"
    passwordHash: '176ffae747bcd6f417fca7150ecdfbc3db2cdb767f5597407b250a63a477de74',
  },
];

/**
 * Hash a plain-text password using SubtleCrypto (SHA-256)
 * Returns lowercase hex string
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify credentials against configured users
 * Returns the matching user or null
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<CredentialUser | null> {
  const hash = await hashPassword(password);
  const user = CONFIGURED_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hash
  );
  return user || null;
}

/**
 * Generate a simple session token (base64 encoded payload + expiry)
 * Not a real JWT — purely for frontend session management
 */
export function generateSessionToken(userId: string, expiresAt: number): string {
  const payload = { userId, expiresAt, iat: Date.now() };
  return btoa(JSON.stringify(payload));
}

/** Token TTL: 8 hours for session, 7 days for "remember me" */
export const SESSION_TTL = 8 * 60 * 60 * 1000;
export const REMEMBER_ME_TTL = 7 * 24 * 60 * 60 * 1000;
