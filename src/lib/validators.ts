// Zod validation schemas
import { z } from 'zod';

// Service validation schemas
export const serviceMetadataSchema = z.object({
  endpoints: z.array(z.string().url()).optional(),
  sla: z.object({
    uptime_guarantee: z.string().optional(),
    response_time: z.string().optional(),
    support_hours: z.string().optional(),
  }).optional(),
  rate_limits: z.object({
    requests_per_minute: z.number().positive().optional(),
    requests_per_day: z.number().positive().optional(),
    concurrent_connections: z.number().positive().optional(),
  }).optional(),
  tokens_accepted: z.array(z.enum(['SUI', 'WAL', 'USDC', 'USDT'])).optional(),
  documentation_url: z.string().url().optional(),
  support_url: z.string().url().optional(),
  contact_email: z.string().email().optional(),
  github_url: z.string().url().optional(),
  version: z.string().optional(),
}).passthrough(); // Allow additional fields for schema flexibility

export const pricingTierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tier name is required'),
  price: z.number().nonnegative('Price must be non-negative'),
  currency: z.enum(['SUI', 'WAL', 'USDC', 'USDT']),
  interval: z.enum(['monthly', 'yearly', 'one-time']).optional(),
  credits: z.number().positive().optional(),
  features: z.array(z.string()),
  rate_limits: z.object({
    requests_per_minute: z.number().positive().optional(),
    requests_per_day: z.number().positive().optional(),
    concurrent_connections: z.number().positive().optional(),
  }).optional(),
});

export const pricingModelSchema = z.object({
  type: z.enum(['free', 'flat-rate', 'usage-based', 'tiered', 'subscription']),
  tiers: z.array(pricingTierSchema).min(1, 'At least one pricing tier is required'),
});

export const createServiceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  category: z.enum(['RPC', 'Indexer', 'Storage', 'Oracle', 'Analytics', 'Validator', 'Other']),
  type: z.enum(['API', 'Infrastructure', 'Data', 'Tooling']),
  status: z.enum(['active', 'maintenance', 'deprecated', 'beta']).default('active'),
  pricing: pricingModelSchema,
  metadata: serviceMetadataSchema,
  tags: z.array(z.string()).default([]),
});

export const updateServiceSchema = createServiceSchema.partial();

export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  category: z.array(z.enum(['RPC', 'Indexer', 'Storage', 'Oracle', 'Analytics', 'Validator', 'Other'])).optional(),
  type: z.array(z.enum(['API', 'Infrastructure', 'Data', 'Tooling'])).optional(),
  verified: z.boolean().optional(),
  tokens_accepted: z.array(z.enum(['SUI', 'WAL', 'USDC', 'USDT'])).optional(),
  pricing_type: z.array(z.enum(['free', 'flat-rate', 'usage-based', 'tiered', 'subscription'])).optional(),
  tags: z.array(z.string()).optional(),
});

// Auth validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['developer', 'provider']),
  wallet_address: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Provider validation schemas
export const updateProviderSchema = z.object({
  name: z.string().min(2).optional(),
  company: z.string().optional(),
  website: z.string().url().optional(),
  wallet_address: z.string().optional(),
});

// Payment validation schemas
export const createCheckoutSchema = z.object({
  service_id: z.string(),
  tier_id: z.string(),
  payment_method: z.enum(['SUI', 'WAL', 'USDC', 'USDT']),
});

export const verifyPaymentSchema = z.object({
  transaction_hash: z.string(),
  service_id: z.string(),
  tier_id: z.string(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Helper type exports
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
