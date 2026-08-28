import { api } from '@/config/api';

export interface CredentialUser {
  id: string;
  name: string;
  email: string;
  role: string;
  specialization?: string;
}

export async function registerUser(name: string, email: string, password: string): Promise<CredentialUser> {
  throw new Error("Public registration is disabled. Please contact your system administrator.");
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ user: CredentialUser; token: string }> {
  // 1. Authenticate to get the token using OAuth2 form data
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const loginResponse = await api.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const token = loginResponse.data.access_token;

  // 2. Fetch the user profile using the token
  const meResponse = await api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const userData = meResponse.data;
  
  const user: CredentialUser = {
    id: String(userData.id),
    name: userData.full_name,
    email: userData.email,
    role: userData.role,
    specialization: 'Clinician',
  };

  return { user, token };
}

export const SESSION_TTL = 8 * 60 * 60 * 1000;
export const REMEMBER_ME_TTL = 7 * 24 * 60 * 60 * 1000;
