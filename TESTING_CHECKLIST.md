# C.A.L. Testing Checklist

Use this checklist to verify all fixes and features work correctly.

## Pre-Testing Setup

- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Copy `.env.local.example` to `.env.local` and configure:
  - [ ] `DATABASE_URL` - PostgreSQL connection string
  - [ ] `GEMINI_API_KEY` - Your Gemini API key
  - [ ] `JWT_SECRET` - Random 32+ character string
  - [ ] `SESSION_SECRET` - Another random secret
- [ ] Start PostgreSQL: `docker-compose up -d` (or use local PostgreSQL)
- [ ] Run migrations: `npm run db:push`
- [ ] Type check: `npm run check` (should pass with no errors)

## Critical Flow Tests

### ✅ Flow 1: New User Journey
**Steps:**
1. Start app: `npm run dev` or `npm run dev:local`
2. Open http://localhost:5173 (or port 5000)
3. Click "Get Started" → Should redirect to `/auth`
4. Sign up with test credentials
5. Should redirect to `/projects` after successful signup
6. Click "New Project" → Should create session and navigate to `/app?session=ID`
7. Assembly Line should load with empty chat interface
8. Type a message → Should send and receive AI response

**Expected Results:**
- [ ] No errors in browser console
- [ ] Smooth navigation between pages
- [ ] Loading states visible during async operations
- [ ] AI responses appear correctly

---

### ✅ Flow 2: Session Switching (Tests Fix #1 - Sticky Navigation)
**Steps:**
1. Create 3+ projects (or use existing ones)
2. In Assembly Line, click different projects in sidebar
3. Observe URL and content updates

**Expected Results:**
- [ ] URL changes immediately (`/app?session=123`)
- [ ] Content updates within 200ms
- [ ] Active session highlighted in sidebar
- [ ] No stale content shown
- [ ] No console errors

**Success Criteria:**
- ✅ Click → URL changes → Visual feedback within 50ms
- ✅ Main content updates within 200ms
- ✅ No mismatched URL/content states

---

### ✅ Flow 3: Back Button Navigation (Tests Fix #2 - Auth Redirects)
**Steps:**
1. Navigate: `/projects` → `/app?session=123` → `/membership`
2. Click browser back button
3. Should return to `/app?session=123`
4. Click back again → Should go to `/projects`
5. Click back again → Should go to `/` (landing page)

**Expected Results:**
- [ ] Returns to previous page correctly
- [ ] Shows loading spinner briefly (<500ms) during auth check
- [ ] No false redirect to `/auth` when authenticated
- [ ] Content loads correctly after navigation

**Success Criteria:**
- ✅ Browser back button works 100% when authenticated
- ✅ Loading state visible during auth verification
- ✅ No flickering or false redirects

---

### ✅ Flow 4: Chat Smart Scroll (Tests Fix #3 - Smart Scroll)
**Steps:**
1. In Assembly Line, send several messages to build chat history
2. Scroll up to read previous messages
3. Send a new message
4. Verify scroll behavior
5. Scroll up again
6. Click "Jump to bottom" button (if visible)

**Expected Results:**
- [ ] Auto-scrolls to new message only when near bottom (<100px)
- [ ] Manual scroll up disables auto-scroll
- [ ] "Jump to bottom" button appears when scrolled up
- [ ] Button works when clicked
- [ ] No jarring jumps or layout shifts

**Success Criteria:**
- ✅ New messages auto-scroll smoothly when user is within 100px of bottom
- ✅ Manual scroll up disables auto-scroll
- ✅ "Jump to bottom" button appears when scrolled up
- ✅ No jarring jumps or layout shifts

---

### ✅ Flow 5: New Chat Functionality
**Steps:**
1. Open existing session: `/app?session=123`
2. Click "New Project" in sidebar
3. Verify state reset

**Expected Results:**
- [ ] URL changes to `/app` (no session param)
- [ ] State resets to new project
- [ ] No stale data from previous session
- [ ] Chat interface is empty and ready

---

### ✅ Flow 6: Error Handling
**Steps:**
1. Navigate to invalid session: `/app?session=99999`
2. Should show error message
3. URL param should be cleared
4. Try to trigger a React error (if possible in dev mode)

**Expected Results:**
- [ ] Error boundary catches errors gracefully
- [ ] User-friendly error message displayed
- [ ] "Try Again" button works
- [ ] "Go Home" button navigates correctly

---

## Edge Cases

### Network Interruption
- [ ] Simulate offline mode (DevTools → Network → Offline)
- [ ] Should show error message or "Reconnecting..." banner
- [ ] Go online → Should auto-reconnect

### Rapid Clicks
- [ ] Click "Generate Hooks" 5 times quickly
- [ ] Should only send one request
- [ ] Button should be disabled during loading

### Special Characters
- [ ] Input emojis in content goal
- [ ] Should save and display correctly

### Concurrent Sessions
- [ ] Open same project in two tabs
- [ ] Edit in one tab
- [ ] Changes should sync (or show conflict message)

---

## Performance Checks

Run these in Chrome DevTools (Performance tab):

- [ ] **First Contentful Paint**: < 1.5s
- [ ] **Time to Interactive**: < 2.5s
- [ ] **API Response Time**: < 500ms for all endpoints
- [ ] **Bundle Size**: Check Network tab, should be reasonable

---

## Accessibility Checks

- [ ] All interactive elements Tab-accessible
- [ ] Visible focus indicators on all controls
- [ ] Proper ARIA labels on icon buttons
- [ ] Text contrast meets WCAG AA (4.5:1 minimum)
- [ ] Keyboard navigation works throughout app

---

## Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest) - if on Mac
- [ ] Edge (latest)
- [ ] Mobile viewport (Chrome DevTools)

---

## Console Checks

- [ ] No console warnings
- [ ] No console errors
- [ ] No React warnings
- [ ] No network errors (404s, 500s)

---

## Final Verification

- [ ] All critical flows tested and working
- [ ] No console errors or warnings
- [ ] TypeScript compiles: `npm run check`
- [ ] ESLint passes (if configured)
- [ ] All fixes verified:
  - [ ] Sticky navigation fixed
  - [ ] Back button auth fixed
  - [ ] Smart scroll working
  - [ ] Error boundaries working

---

## Quick Test Commands

```bash
# Setup
npm install
cp .env.local.example .env.local
# Edit .env.local with your values
docker-compose up -d
npm run db:push

# Type check
npm run check

# Start app
npm run dev
# or
npm run dev:local
```

---

## Reporting Issues

If you find any issues during testing:

1. Note the exact steps to reproduce
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Check database connection
5. Review server logs for backend errors

---

**Testing completed on:** _______________
**Tester:** _______________
**Notes:** _______________

