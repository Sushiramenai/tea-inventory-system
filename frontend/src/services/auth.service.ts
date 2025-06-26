import { api } from './api';
import { User } from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getSession(): Promise<AuthResponse> {
    return api.get<AuthResponse>('/auth/session');
  },

  async refreshSession(): Promise<void> {
    await api.post('/auth/refresh');
  },
};