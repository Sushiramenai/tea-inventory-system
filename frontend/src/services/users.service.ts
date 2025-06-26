import { api } from './api';
import { User, UserRole } from '../types';

export interface UsersResponse {
  users: User[];
}

export interface UserFilters {
  role?: UserRole;
  active?: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export const usersService = {
  async getUsers(filters?: UserFilters): Promise<UsersResponse> {
    return api.get<UsersResponse>('/users', filters);
  },

  async createUser(data: CreateUserData): Promise<{ user: User }> {
    return api.post<{ user: User }>('/users', data);
  },

  async updateUser(id: string, data: UpdateUserData): Promise<{ user: User }> {
    return api.put<{ user: User }>(`/users/${id}`, data);
  },

  async deleteUser(id: string): Promise<void> {
    return api.delete(`/users/${id}`);
  },
};