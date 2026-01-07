// Simple admin user creator using CURL or browser
// Just visit this endpoint in your browser while the server is running:
// http://localhost:5000/api/dev/create-admin

// Add this endpoint temporarily to your server/routes.ts file (before the return statement):

/*
  // DEVELOPMENT ONLY: Create admin user endpoint
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/dev/create-admin", async (req: Request, res: Response) => {
      try {
        const adminEmail = "admin@test.com";
        const adminPassword = "admin123";
        
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(adminEmail);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            userRecord = await auth.createUser({
              email: adminEmail,
              password: adminPassword,
              displayName: "Admin User",
            });
          } else {
            throw error;
          }
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await firestore.collection("users").doc(userRecord.uid).set({
          id: userRecord.uid,
          email: adminEmail,
          password: hashedPassword,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          subscriptionTier: "diamond",
          isPremium: true,
          scriptsGenerated: 0,
          usageCount: 0,
          lastUsageReset: Timestamp.now(),
          subscriptionEndDate: Timestamp.fromDate(new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }, { merge: true });

        const customToken = await auth.createCustomToken(userRecord.uid);

        res.json({
          success: true,
          message: "Admin user created successfully!",
          credentials: {
            email: adminEmail,
            password: adminPassword,
            customToken: customToken,
          },
          user: {
            uid: userRecord.uid,
            email: adminEmail,
            role: "admin",
            tier: "diamond"
          }
        });
      } catch (error) {
        console.error("Error creating admin user:", error);
        res.status(500).json({ error: "Failed to create admin user", details: error });
      }
    });
  }
*/
