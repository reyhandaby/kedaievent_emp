import { Role } from '@prisma/client';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: Role;
  referralCodeUsed?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  referralCode: string;
  referredBy: string | null;
  points: number;
  createdAt: Date;
}

export interface AuthResponse {
  message: string;
  user?: UserResponse;
  token?: string;
  error?: string;
}