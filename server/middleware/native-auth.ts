import type { RequestHandler, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, FREE_TIER_SCRIPT_LIMIT } from "@shared/models/auth";
import { eq, sql } from "drizzle-orm";

export async function getUserIdFromSession(req: Request): Promise<string | null> {
  const sessionUserId = (req.session as any)?.userId;
  if (sessionUserId) {
    return sessionUserId;
  }
  
  const oidcUser = req.user as any;
  if (oidcUser?.claims?.sub) {
    return oidcUser.claims.sub;
  }
  
  return null;
}

export async function getUserFromSession(req: Request): Promise<typeof users.$inferSelect | null> {
  const userId = await getUserIdFromSession(req);
  if (!userId) {
    return null;
  }
  
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user || null;
}

export const requireAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromSession(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    (req as any).dbUser = user;
    next();
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requirePremium: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromSession(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Premium users always have access
    if (user.isPremium) {
      (req as any).dbUser = user;
      return next();
    }
    
    // Check if subscription is still valid
    const now = new Date();
    if (user.subscriptionEndDate && user.subscriptionEndDate >= now) {
      (req as any).dbUser = user;
      return next();
    }
    
    // Bronze tier: allow 1 free script
    if (user.subscriptionTier === 'bronze') {
      const scriptsUsed = user.scriptsGenerated || 0;
      if (scriptsUsed < FREE_TIER_SCRIPT_LIMIT) {
        (req as any).dbUser = user;
        (req as any).isFreeScript = true;
        return next();
      }
      
      return res.status(403).json({ 
        message: `You've used your free script. Upgrade to create more!`,
        scriptsUsed,
        limit: FREE_TIER_SCRIPT_LIMIT,
        upgradeUrl: "/membership"
      });
    }
    
    return res.status(403).json({ 
      message: "Premium subscription required",
      upgradeUrl: "/membership"
    });
  } catch (error) {
    console.error("Premium check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper to increment script count for Bronze users after successful generation
export async function incrementScriptCount(userId: string): Promise<void> {
  try {
    await db.update(users)
      .set({ 
        scriptsGenerated: sql`${users.scriptsGenerated} + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("Failed to increment script count:", error);
  }
}

export const requireAdmin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromSession(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    (req as any).dbUser = user;
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
