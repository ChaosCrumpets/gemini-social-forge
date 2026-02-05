#!/bin/bash

echo "🚀 C.A.L. Pre-Launch Checklist"
echo "=============================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track pass/fail
TOTAL=0
PASSED=0

check() {
  TOTAL=$((TOTAL + 1))
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗${NC} $1"
  fi
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Environment Variables
echo "1️⃣ Checking Environment Variables..."
[ ! -z "$FIREBASE_PROJECT_ID" ] && check "FIREBASE_PROJECT_ID set" || check "FIREBASE_PROJECT_ID missing"
[ ! -z "$ANTHROPIC_API_KEY" ] && check "ANTHROPIC_API_KEY set" || check "ANTHROPIC_API_KEY missing"
[ ! -z "$SENTRY_DSN" ] && check "SENTRY_DSN set" || check "SENTRY_DSN missing"
[ "$NODE_ENV" = "production" ] && check "NODE_ENV=production" || warn "NODE_ENV not set to production"
echo ""

# 2. Build Status
echo "2️⃣ Checking Build Status..."
[ -d "client/dist" ] && check "Client build exists" || check "Client build missing"
[ -d "server/dist" ] && check "Server build exists" || check "Server build missing"
echo ""

# 3. Dependencies
echo "3️⃣ Checking Dependencies..."
cd server
npm audit --production --audit-level=high > /dev/null 2>&1
check "Server dependencies secure"
cd ../client
npm audit --production --audit-level=high > /dev/null 2>&1
check "Client dependencies secure"
cd ..
echo ""

# 4. Git Status
echo "4️⃣ Checking Git Status..."
[ -z "$(git status --porcelain)" ] && check "Working directory clean" || warn "Uncommitted changes"
[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] && check "On main branch" || warn "Not on main branch"
echo ""

# 5. Database
echo "5️⃣ Checking Database..."
# This would need Firebase CLI installed
firebase deploy --only firestore:rules --dry-run > /dev/null 2>&1
check "Firestore rules valid"
firebase deploy --only firestore:indexes --dry-run > /dev/null 2>&1
check "Firestore indexes valid"
echo ""

# 6. Files
echo "6️⃣ Checking Critical Files..."
[ -f ".env.example" ] && check ".env.example exists" || check ".env.example missing"
[ -f "README.md" ] && check "README.md exists" || check "README.md missing"
[ -f ".gitignore" ] && check ".gitignore exists" || check ".gitignore missing"
grep -q "\.env$" .gitignore && check ".env in .gitignore" || check ".env NOT in .gitignore"
echo ""

# Summary
echo "=============================="
echo "Summary: $PASSED/$TOTAL checks passed"
echo ""

if [ $PASSED -eq $TOTAL ]; then
  echo -e "${GREEN}🎉 All checks passed! Ready for deployment.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some checks failed. Fix issues before deploying.${NC}"
  exit 1
fi
