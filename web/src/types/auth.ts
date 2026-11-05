// The user object stored in localStorage. This is public profile data
// only: a password must never be stored here (or anywhere client-side).
export interface User {
  id?: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  // Present on /register; /login returns tokens only, and the caller
  // then fetches /user for the profile.
  id?: number;
  email?: string;
  username?: string;
  user?: User;
}

export interface ApiError {
  detail: string | Array<{
    type: string;
    loc: string[];
    msg: string;
    input: string;
    ctx?: Record<string, unknown>;
  }>;
}
