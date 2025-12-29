import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User roles
export const UserRole = {
  USER: "user",
  ADMIN: "admin"
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Subscription tiers (5-tier system)
export const SubscriptionTier = {
  BRONZE: "bronze",    // Free tier
  SILVER: "silver",    // Tier 1 - $10/mo
  GOLD: "gold",        // Tier 2 - $20/mo
  PLATINUM: "platinum", // Tier 3 - $50/mo
  DIAMOND: "diamond"   // Lifetime buyout - $200
} as const;

export type SubscriptionTierType = typeof SubscriptionTier[keyof typeof SubscriptionTier];

// Tier display info for UI
export const TierInfo = {
  bronze: { name: "Bronze", price: 0, priceLabel: "Free", color: "#CD7F32", features: ["5 scripts/month", "Basic hooks", "Community support"] },
  silver: { name: "Silver", price: 10, priceLabel: "$10/mo", color: "#C0C0C0", features: ["25 scripts/month", "All hook types", "Email support"] },
  gold: { name: "Gold", price: 20, priceLabel: "$20/mo", color: "#FFD700", features: ["100 scripts/month", "Priority generation", "B-roll AI prompts"] },
  platinum: { name: "Platinum", price: 50, priceLabel: "$50/mo", color: "#E5E4E2", features: ["Unlimited scripts", "API access", "White-label exports"] },
  diamond: { name: "Diamond", price: 200, priceLabel: "$200 one-time", color: "#B9F2FF", features: ["Lifetime access", "All Platinum features", "Early feature access"] }
} as const;

// Free tier limits
export const FREE_TIER_SCRIPT_LIMIT = 1;

// Monthly usage limits by tier
export const TIER_USAGE_LIMITS = {
  bronze: 10,
  silver: 100,
  gold: -1,      // -1 means unlimited
  platinum: -1,
  diamond: -1
} as const;

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(),
  subscriptionTier: varchar("subscription_tier").default("bronze").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  scriptsGenerated: integer("scripts_generated").default(0).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsageReset: timestamp("last_usage_reset").defaultNow(),
  subscriptionEndDate: timestamp("subscription_end_date"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Auth schemas for API validation
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export const upgradeSchema = z.object({
  tier: z.enum(["bronze", "silver", "gold", "platinum", "diamond"])
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpgradeInput = z.infer<typeof upgradeSchema>;
