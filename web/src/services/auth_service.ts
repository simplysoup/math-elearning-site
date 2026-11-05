import { AuthResponse, ApiError } from '../types/auth';

import { API_BASE_URL } from '../api';

async function postJson(path: string, body: unknown): Promise<AuthResponse | ApiError> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data; // Ok or error object; the caller checks 'detail'.
  } catch (error) {
    return {
      detail: 'Network error - failed to connect to server',
    };
  }
}

// /register returns the tokens and the public user (auto-login).
export const register = (user: { email: string; password: string; username?: string }): Promise<AuthResponse | ApiError> =>
  postJson('/register', user);

// /login returns tokens only; the caller fetches /user for the profile.
export const login = (credentials: { email: string; password: string }): Promise<AuthResponse | ApiError> =>
  postJson('/login', credentials);
