import { User, AuthResponse, ApiError } from '../types/auth';

const API_BASE_URL = 'http://localhost:8000';

export const register = async (user: User): Promise<AuthResponse | ApiError> => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    return error;
  }

  return response.json();
};

// authService.ts
export const login = async (credentials: { email: string; password: string }): Promise<AuthResponse | ApiError> => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    return error;
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    user: {
      email: credentials.email,
      password: credentials.password,
    }
  };
};