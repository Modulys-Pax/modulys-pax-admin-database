import api from '../axios';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    companyId: string | null;
    branchId: string | null;
    role: {
      id: string;
      name: string;
      description: string | null;
    };
    permissions?: string[];
  };
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  companyId: string | null;
  branchId: string | null;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  permissions?: string[];
}

export const authApi = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  me: async (): Promise<UserResponse> => {
    const response = await api.get<UserResponse>('/auth/me');
    return response.data;
  },
};
