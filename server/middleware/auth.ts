import type { RequestHandler } from "express";
import { db } from "../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User {
      claims?: {
        sub: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        profile_image_url?: string;
      };
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}

export async function getUserFromRequest(req: Express.Request): Promise<typeof users.$inferSelect | null> {
  const user = req.user as Express.User | undefined;
  if (!user?.claims?.sub) {
    return null;
  }
  
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.claims.sub));
  return dbUser || null;
}

export const adminRequired: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user as Express.User | undefined;
    
    if (!req.isAuthenticated() || !user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [dbUser] = await db.select().from(users).where(eq(users.id, user.claims.sub));
    
    if (!dbUser || dbUser.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const premiumRequired: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user as Express.User | undefined;
    
    if (!req.isAuthenticated() || !user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [dbUser] = await db.select().from(users).where(eq(users.id, user.claims.sub));
    
    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!dbUser.isPremium) {
      const now = new Date();
      if (!dbUser.subscriptionEndDate || dbUser.subscriptionEndDate < now) {
        return res.status(403).json({ 
          message: "Premium subscription required",
          upgradeUrl: "/upgrade"
        });
      }
    }

    next();
  } catch (error) {
    console.error("Premium check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
