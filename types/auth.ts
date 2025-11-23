export interface User {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  role: string;
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loadFromStorage: () => void;
  hasPermission: (permission: string) => boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  organization_name: string;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}
