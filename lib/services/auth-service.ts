import api from "@/lib/api";
import type {
  LoginRequest,
  RegisterRequest,
  AcceptInviteRequest,
  AuthResponse,
} from "@/types/auth";

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  acceptInvite: async (data: AcceptInviteRequest): Promise<AuthResponse> => {
    const response = await api.post("/auth/invite/accept", data);
    return response.data;
  },
};
