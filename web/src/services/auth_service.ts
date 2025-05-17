import { User, AuthResponse, ApiError } from '../types/auth';

const API_BASE_URL = 'http://localhost:8000';

export const register = async (user: User): Promise<AuthResponse | ApiError> => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(user),
    });

    const data = await response.json();
    if (!response.ok) {
      return data; // Return the full error object
    }
    return data;
  } catch (error) {
    return {
      detail: 'Network error - failed to connect to server',
    };
  }
};

export const login = async (credentials: { email: string; password: string }): Promise<AuthResponse | ApiError> => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) {
      return data; // Return the full error object
    }
    return {
      access_token: data.access_token,
      user: {
        email: credentials.email,
        password: credentials.password,
      }
    };
  } catch (error) {
    return {
      detail: 'Network error - failed to connect to server',
    };
  }
};