import { apiClient } from '@/lib/axios';
import { LoginInput, SignupInput } from '@/schemas/auth.schema';
import { UserResponse } from '@/schemas/user.schema';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authService = {
  async signup(data: SignupInput): Promise<UserResponse> {
    const res = await apiClient.post<UserResponse>('/auth/signup', data);
    return res.data;
  },

  async login(data: LoginInput): Promise<TokenResponse> {
    const res = await apiClient.post<TokenResponse>('/auth/login', data);
    return res.data;
  },

  async getMe(): Promise<UserResponse> {
    const res = await apiClient.get<UserResponse>('/users/me');
    return res.data;
  },

  /**
   * Prepared Google OAuth service entry point.
   * Backend OAuth endpoint contract will connect here once implemented.
   */
  async loginWithGoogle(): Promise<never> {
    throw new Error('Google OAuth backend integration is coming soon.');
  },
};
