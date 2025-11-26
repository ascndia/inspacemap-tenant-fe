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
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isTokenExpired: () => boolean;
  getTokenExpiry: () => Date | null;
  inspectJWT: () => any;
  getCurrentOrg: () => {
    organization_id: string;
    name: string;
    slug: string;
    role_name: string;
  } | null;
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

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    full_name: string;
    organization: {
      organization_id: string;
      name: string;
      slug: string;
      role_name: string;
    };
  };
}
