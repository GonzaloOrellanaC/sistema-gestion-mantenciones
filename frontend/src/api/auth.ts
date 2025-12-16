import api from './axios';
import type { User } from './types';

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

/**
 * POST /api/auth/register
 * Create a new user and organization (register).
 * Payload: { firstName, lastName, email, password, companyName }
 * Returns: created user info (and possibly initial org data)
 */
export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post('/api/auth/register', payload);
  return data;
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 * Payload: { email, password }
 * Returns: { token, user }
 * Note: caller should store data.token (e.g., localStorage.setItem('token', token))
 */
export async function login(payload: LoginPayload): Promise<{ token: string; user: User }> {
  const { data } = await api.post('/api/auth/login', payload);
  // caller should store token (data.token) in localStorage
  return data;
}

/**
 * GET /api/auth/me
 * Get current authenticated user information.
 * Headers: Authorization: Bearer <token>
 * Returns: user object
 */
export async function me(): Promise<User> {
  const { data } = await api.get('/api/auth/me');
  return data;
}

/**
 * POST /api/auth/forgot-password
 * Request a password reset email. Payload: { email }
 * Returns: { ok: true }
 */
export async function forgotPassword(email: string): Promise<unknown> {
  const { data } = await api.post('/api/auth/forgot-password', { email });
  return data;
}

/**
 * POST /api/auth/reset-password
 * Reset the password using token from email. Payload: { token, password }
 * Returns: { ok: true }
 */
export async function resetPassword(token: string, password: string): Promise<unknown> {
  const { data } = await api.post('/api/auth/reset-password', { token, password });
  return data;
}

export default { register, login, me };
