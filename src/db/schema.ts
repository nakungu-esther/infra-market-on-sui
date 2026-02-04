import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';



// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  role: text("role").notNull().default('developer'),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Service discovery tables
export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  providerId: text('provider_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  serviceType: text('service_type').notNull(),
  status: text('status').notNull().default('pending'),
  metadata: text('metadata', { mode: 'json' }),
  pricingInfo: text('pricing_info', { mode: 'json' }),
  contactInfo: text('contact_info', { mode: 'json' }),
  isAcceptingUsers: integer('is_accepting_users', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const serviceTags = sqliteTable('service_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  addedByAdmin: integer('added_by_admin', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

export const serviceCategories = sqliteTable('service_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at').notNull(),
});

export const serviceCategoryMapping = sqliteTable('service_category_mapping', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => serviceCategories.id, { onDelete: 'cascade' }),
});

// Payment and usage tracking tables
export const entitlements = sqliteTable('entitlements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  paymentId: text('payment_id').notNull().unique(),
  pricingTier: text('pricing_tier').notNull(),
  quotaLimit: integer('quota_limit').notNull(),
  quotaUsed: integer('quota_used').notNull().default(0),
  validFrom: text('valid_from').notNull(),
  validUntil: text('valid_until').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  tokenType: text('token_type').notNull(),
  amountPaid: text('amount_paid').notNull(),
  txDigest: text('tx_digest').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const usageLogs = sqliteTable('usage_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entitlementId: integer('entitlement_id').notNull().references(() => entitlements.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  timestamp: text('timestamp').notNull(),
  requestsCount: integer('requests_count').notNull().default(1),
  endpoint: text('endpoint').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull(),
});

export const pricingTiers = sqliteTable('pricing_tiers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  tierName: text('tier_name').notNull(),
  priceSui: text('price_sui').notNull(),
  priceWal: text('price_wal').notNull(),
  priceUsdc: text('price_usdc').notNull(),
  quotaLimit: integer('quota_limit').notNull(),
  validityDays: integer('validity_days').notNull(),
  features: text('features', { mode: 'json' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

// Subscriptions table
export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  entitlementId: integer('entitlement_id').notNull().references(() => entitlements.id, { onDelete: 'cascade' }),
  pricingTier: text('pricing_tier').notNull(),
  status: text('status').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  autoRenew: integer('auto_renew', { mode: 'boolean' }).notNull().default(true),
  cancelledAt: text('cancelled_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Service Reviews table
export const serviceReviews = sqliteTable('service_reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Disputes table
export const disputes = sqliteTable('disputes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reporterId: text('reporter_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').references(() => services.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').references(() => user.id),
  disputeType: text('dispute_type').notNull(),
  status: text('status').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  amountInvolved: text('amount_involved'),
  evidence: text('evidence', { mode: 'json' }),
  providerResponse: text('provider_response'),
  adminNotes: text('admin_notes'),
  resolvedBy: text('resolved_by').references(() => user.id),
  resolvedAt: text('resolved_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// API Keys table
export const apiKeys = sqliteTable('api_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  entitlementId: integer('entitlement_id').notNull().references(() => entitlements.id, { onDelete: 'cascade' }),
  keyValue: text('key_value').notNull().unique(),
  keyName: text('key_name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastUsedAt: text('last_used_at'),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at'),
});