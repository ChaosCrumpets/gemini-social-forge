# C.A.L. Enhanced System - Rollback Procedures

**Version:** 1.0  
**Last Updated:** 2026-01-14

---

## Overview

This document provides comprehensive rollback procedures for the C.A.L. Enhanced System, ensuring safe recovery from any production issues.

**Two Rollback Strategies:**
1. **Instant Rollback** (Feature Flag) - < 1 minute
2. **Full Rollback** (Git Revert) - 5-10 minutes

---

## When to Rollback

### Immediate Rollback Required ⚠️

Execute **Instant Rollback** immediately if:
- Critical production errors in enhanced mode
- User reports of data loss or corruption
- System performance degradation >50%
- Enhanced features causing security vulnerabilities
- Unable to complete content generation

### Standard Rollback Recommended

Consider **Full Rollback** if:
- Multiple bug reports related to enhanced features
- Feature adoption below expectations
- Need to free disk space (133KB+ prompt)
- Planning major refactoring
- Enhanced mode not needed for extended period

### Monitor Without Rollback

Continue monitoring if:
- Minor UI glitches (cosmetic only)
- Isolated user reports (<5%)
- Performance impact <10%
- Issues have known workarounds
- Fix deployment within 30 minutes

---

## Decision Flowchart

```
Production Issue?
├─ Critical? → YES → INSTANT ROLLBACK
├─ Enhanced Feature? → YES → INSTANT ROLLBACK
├─ Affecting >10% users? → YES → INSTANT ROLLBACK
├─ Fix time >30 min? → YES → INSTANT ROLLBACK
└─ None of above → Monitor & Log
```

After Instant Rollback:
```
Issue Resolved?
├─ YES → Monitor for 24h, plan fix deployment
└─ NO → Execute FULL ROLLBACK
```

---

## Strategy 1: Instant Rollback (Feature Flag)

### Speed
< 1 minute

### Use Cases
- Emergency production issues
- Quick testing of legacy vs enhanced
- Temporary disable during maintenance
- Investigation of enhanced-specific bugs

### Prerequisites
- Access to server environment
- Permission to edit `.env` file
- Ability to restart server

### Procedure

**Method A: Automated Script** (Recommended)

```bash
# Navigate to project root
cd Gemini-Social-Forge

# Run instant rollback script
node scripts/rollback-instant.js

# Follow prompts:
# 1. Review current status
# 2. Type 'yes' to confirm
# 3. Note backup location

# Restart server
npm run dev
# OR
pm2 restart all
```

**Method B: Manual**

```bash
# 1. Backup current .env
cp .env .env.backup-rollback

# 2. Edit .env file
nano .env  # or your preferred editor

# 3. Change this line:
ENHANCED_CAL=true

# To:
ENHANCED_CAL=false

# 4. Save and exit

# 5. Restart server
npm run dev
```

### Verification Steps

1. **Check Server Console:**
   ```
   Look for: "📝 [CAL] Using legacy prompt v1.0"
   Should NOT see: "🧠 [CAL] Using enhanced prompt v2.0"
   ```

2. **Check UI:**
   - Navigate to  any project
   - Count output panels: Should be **5** (not 6)
   - 3rd tab should say **"Tech Specs"** (not "Cinematography")
   - No "Deployment" tab should be visible

3. **Test Content Generation:**
   - Create new project
   - Should see fixed number of discovery questions
   - Hooks should use generic templates
   - Output should show 5 panels

### Re-Enable Enhanced Mode

```bash
# Edit .env
ENHANCED_CAL=true

# Restart server
npm run dev

# Verify in console:
# "🧠 [CAL] Using enhanced prompt v2.0"
```

---

## Strategy 2: Full Rollback (Git Revert)

### Speed
5-10 minutes (includes rebuild)

### Use Cases
- Instant rollback didn't resolve issue
- Need to completely remove enhanced system
- Disk space recovery required
- Planning to stay on legacy long-term
- Post-incident investigation required

### Prerequisites
- Git access to repository
- No uncommitted changes
- Permission to revert commits
- Ability to run build scripts

### Procedure

**Windows (PowerShell):**

```powershell
# Navigate to project root
cd Gemini-Social-Forge

# Ensure no uncommitted changes
git status

# Run full rollback script
.\scripts\rollback-full.ps1

# Follow prompts:
# 1. Review commits to be reverted
# 2. Type 'ROLLBACK' to confirm
# 3. Wait for rebuild to complete

# Restart server
npm run dev
```

**Linux/Mac (Coming Soon):**
```bash
# Use git revert manually for now
git log --oneline | grep -E "(CAL|Enhanced|Phase)"
git revert <commit-hash>
npm run build
npm run dev
```

### What Gets Removed

**Backend:**
- `server/prompts/cal-enhanced-v2.ts` (133KB)
- `server/discovery.ts`
- Enhanced hook functions in `server/hookDatabase.ts`
- Feature flag logic

**Frontend:**
- `client/src/components/ProgressionGate.tsx`
- CinematographyPanel (dual-mode)
- DeploymentPanel
- 6th tab navigation

**Schema:**
- Cinematography interface
- Deployment interface
- Enhanced ContentOutput fields

**Scripts:**
- All Phase 2-6 test scripts
- Rollback scripts themselves (ironic!)

### Verification Steps

1. **Check File System:**
   ```bash
   # These should NOT exist:
   ls server/prompts/cal-enhanced-v2.ts  # Should error
   ls server/discovery.ts                 # Should error
   ls client/src/components/ProgressionGate.tsx  # Should error
   ```

2. **Check `.env`:**
   ```bash
   cat .env | grep ENHANCED_CAL
   # Should NOT exist or be commented out
   ```

3. **Check Build:**
   ```bash
   npm run build
   # Should complete without errors
   ```

4. **Check UI:**
   - 5 panels only
   - "Tech Specs" tab (not "Cinematography")
   - No "Deployment" tab

### Restore Enhanced System

```bash
# Switch to backup branch created during rollback
git checkout backup-before-rollback-<timestamp>

# Rebuild
npm run build

# Restart
npm run dev
```

---

## Post-Rollback Checklist

### Immediate (< 5 minutes)

- [ ] Server restarted successfully
- [ ] No errors in console logs
- [ ] Application loads in browser
- [ ] Users can create projects
- [ ] Content generation works
- [ ] Correct number of panels showing

### Short-Term (< 1 hour)

- [ ] Monitor error logs for anomalies
- [ ] Check user activity metrics
- [ ] Verify database integrity
- [ ] Test critical user flows
- [ ] Document incident details
- [ ] Notify stakeholders

### Medium-Term (< 24 hours)

- [ ] Analyze root cause
- [ ] Plan fix implementation
- [ ] Test fix in development
- [ ] Prepare deployment plan
- [ ] Update incident log
- [ ] Review rollback effectiveness

---

## Troubleshooting

### Issue: Instant Rollback Didn't Work

**Symptoms:** Enhanced features still active after rollback

**Solutions:**
1. Verify `.env` file was actually updated
2. Check server was restarted (not just reloaded)
3. Clear browser cache
4. Check for cached `dist/` folder (rebuild)
5. Escalate to Full Rollback

### Issue: Full Rollback Merge Conflicts

**Symptoms:** Git revert fails with merge conflicts

**Solutions:**
1. Run `git revert --abort`
2. Manually identify problematic commits
3. Revert commits one by one
4. Resolve conflicts individually
5. Contact DevOps team if needed

### Issue: Build Fails After Rollback

**Symptoms:** `npm run build` fails after rollback

**Solutions:**
1. Check `node_modules` integrity: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf dist`
3. Check TypeScript errors: `npx tsc --noEmit`
4. Restore from git: `git reset --hard HEAD~1`
5. Use backup branch if available

### Issue: Data Loss After Rollback

**Symptoms:** User projects missing enhanced data

**Expected Behavior:**
- Projects created in enhanced mode may lose:
  - Cinematography data (falls back to techSpecs)
  - Deployment data (not displayed)
  - Enhanced discovery answers

**Solutions:**
- This is expected behavior (backward compatible)
- Data is preserved in database
- Re-enabling enhanced mode restores access
- Legacy fields (techSpecs) remain functional

---

## Emergency Contacts

**Primary:** DevOps Team  
**Secondary:** Project Owner  
**Escalation:** Technical Lead

**Incident Reporting:**
- Create incident log in `rollback.log`
- Document in project management system
- Notify stakeholders within 15 minutes

---

## Rollback Log Template

```
TIMESTAMP: 2026-01-14 23:00:00
ROLLBACK TYPE: Instant / Full
REASON: [Brief description of issue]
EXECUTED BY: [Name/Email]
DURATION: [Minutes]
STATUS: Success / Failed
ISSUES ENCOUNTERED: [None / Description]
POST-ROLLBACK STATUS: [Stable / Monitoring / Issues]
NEXT STEPS: [Action items]
```

---

## Appendix: File Locations

**Scripts:**
- `scripts/rollback-instant.js` - Instant rollback
- `scripts/rollback-full.ps1` - Full rollback (Windows)
- `scripts/verify-rollback.js` - Verify rollback success

**Configuration:**
- `.env` - Feature flag configuration
- `.env.backup-rollback` - Auto-created backup

**Logs:**
- `rollback.log` - Rollback history
- Server console logs - Runtime verification

**Backups:**
- Git backup branch: `backup-before-rollback-<timestamp>`
- `.env` backup: `.env.backup-rollback`

---

**Document Version:** 1.0  
**Maintained By:** Development Team  
**Review Frequency:** After each rollback incident
