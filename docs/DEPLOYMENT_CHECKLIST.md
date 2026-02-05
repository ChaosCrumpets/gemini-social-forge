# Production Deployment Checklist

## 📋 PRE-DEPLOYMENT

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] No console.logs in production code
- [ ] Code reviewed by at least 1 person
- [ ] All TODO/FIXME comments addressed or documented

### Testing

- [ ] All manual QA tests passed
- [ ] Load testing completed successfully
- [ ] Performance benchmarks meet targets
- [ ] Security audit completed
- [ ] UAT feedback addressed

### Configuration

- [ ] Environment variables documented in .env.example
- [ ] Production .env created (not committed!)
- [ ] NODE_ENV=production set
- [ ] FRONTEND_URL set correctly
- [ ] All API keys and secrets set

### Database

- [ ] Firestore indexes deployed: `firebase deploy --only firestore:indexes`
- [ ] Firestore security rules deployed: `firebase deploy --only firestore:rules`
- [ ] Test data cleaned from production database
- [ ] Admin user created

### Monitoring

- [ ] Sentry DSN configured (frontend + backend)
- [ ] Error tracking tested
- [ ] Performance monitoring active
- [ ] Cost tracking enabled

---

## 🚀 DEPLOYMENT STEPS

### 1. Build Verification

```bash
# Client build
cd client
npm run build
# Verify dist/ folder created
ls -la dist/

# Server build
cd ../server
npm run build
# Verify dist/ folder created
ls -la dist/
```

### 2. Deploy Backend

```bash
# Example for Railway/Render/Heroku
git push production main

# Or manual:
npm run build
npm run start:prod
```

### 3. Deploy Frontend

```bash
# Example for Vercel
vercel --prod

# Or Netlify
netlify deploy --prod
```

### 4. Smoke Test

- [ ] Visit homepage → loads correctly
- [ ] Sign up → creates account
- [ ] Login → works
- [ ] Create session → works
- [ ] Generate content → works
- [ ] Admin dashboard accessible → works

---

## ✅ POST-DEPLOYMENT

### Immediate (0-1 hour)

- [ ] Monitor Sentry for errors
- [ ] Check server logs for issues
- [ ] Test from different devices
- [ ] Verify all environment variables loaded
- [ ] Test critical user paths

### First 24 Hours

- [ ] Monitor error rate (should be < 1%)
- [ ] Check API response times
- [ ] Review cost metrics
- [ ] Respond to any user reports
- [ ] Check Web Vitals scores

### First Week

- [ ] Review user feedback
- [ ] Analyze usage patterns
- [ ] Identify optimization opportunities
- [ ] Plan next sprint
- [ ] Send thank-you to beta testers

---

## 🔄 ROLLBACK PLAN

If critical issues occur:

### Step 1: Assess Severity

- **Critical** (app unusable): Immediate rollback
- **High** (major feature broken): Rollback within 1 hour
- **Medium** (minor feature broken): Fix forward or rollback EOD
- **Low** (cosmetic issue): Fix in next release

### Step 2: Rollback Process

```bash
# Revert to previous deployment
git revert HEAD
git push production main

# Or use platform-specific rollback
# Vercel: vercel rollback
# Railway: Redeploy previous version
```

### Step 3: Communication

- [ ] Update status page (if you have one)
- [ ] Notify users via email/social
- [ ] Post incident report after resolution

---

## 📊 Success Metrics (First Month)

### Technical

- [ ] Uptime > 99.5%
- [ ] Error rate < 1%
- [ ] API response time < 500ms (p95)
- [ ] Zero data loss incidents

### User

- [ ] 50+ active users
- [ ] 200+ content generations
- [ ] 4/5 average satisfaction
- [ ] < 10% churn rate

### Business

- [ ] Total cost < $100/month
- [ ] Cost per user < $2/month
- [ ] 5+ pro tier conversions (if paid tiers active)
