// Core type definitions for the Sui Infrastructure Service Discovery Platform

// Real database schema types
export interface Service {
  id: number;
  providerId: string;
  name: string;
  description: string | null;
  serviceType: string;
  status: string;
  metadata: any;
  pricingInfo: any;
  contactInfo: any;
  isAcceptingUsers: boolean | null;
  createdAt: string;
  updatedAt: string;
  tags?: ServiceTag[];
  provider?: {
    name: string | null;
    email: string | null;
  };
}

export interface ServiceTag {
  id: number;
  tag: string;
  addedByAdmin: boolean | null;
  createdAt: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export type ServiceStatus = 'active' | 'pending' | 'suspended' | 'archived';

export type TokenType = 'SUI' | 'WAL' | 'USDC' | 'USDT';

export interface Provider {
  id: string;
  name: string;
  email: string;
  wallet_address?: string;
  company?: string;
  website?: string;
  verified: boolean;
  services_count: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  wallet_address?: string;
  provider?: Provider;
  created_at: string;
}

export type UserRole = 'developer' | 'provider' | 'admin';

export interface SearchFilters {
  search?: string;
  category?: string;
  tags?: string;
  type?: string;
  status?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  services?: T[];
  data?: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

// Sui-specific types
export interface SuiPayment {
  transaction_hash: string;
  sender: string;
  recipient: string;
  amount: number;
  token: TokenType;
  service_id: string;
  tier_id: string;
  timestamp: number;
}

export interface UsageRecord {
  id: string;
  entitlement_id: string;
  service_id: string;
  user_id: string;
  requests: number;
  timestamp: string;
  metadata?: Record<string, any>;
}