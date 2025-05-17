export interface User {
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  detail: string;
}