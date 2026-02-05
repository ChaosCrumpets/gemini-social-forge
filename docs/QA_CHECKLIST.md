# C.A.L. Quality Assurance Checklist

## 🔐 AUTHENTICATION & AUTHORIZATION

### Sign Up

- [ ] Email/password signup works
- [ ] Google OAuth signup works
- [ ] Password requirements enforced (min 8 chars)
- [ ] Duplicate email shows error
- [ ] User document created in Firestore
- [ ] User assigned 'free' tier by default

### Login

- [ ] Email/password login works
- [ ] Google OAuth login works
- [ ] Wrong password shows error
- [ ] Non-existent email shows error
- [ ] Token stored in localStorage
- [ ] Token persists across page refresh
- [ ] Token expires after 1 hour (test with old token)

### Logout

- [ ] Logout clears token
- [ ] Logout redirects to login page
- [ ] Cannot access protected routes after logout

### Protected Routes

- [ ] Unauthenticated user redirected to login
- [ ] Authenticated user can access app
- [ ] Admin-only routes blocked for non-admins
- [ ] Admin routes accessible to admins

---

## 📝 SESSION MANAGEMENT

### Create Session

- [ ] New session button works
- [ ] Session created with unique ID
- [ ] Session appears in sidebar immediately
- [ ] URL updates to ?session=<id>
- [ ] Session name is editable
- [ ] Default name is "Untitled Session"

### Load Session

- [ ] Clicking session in sidebar loads it
- [ ] URL updates correctly
- [ ] Previous session content preserved
- [ ] Loading state shown while fetching
- [ ] Error shown if session not found

### Rename Session

- [ ] Inline rename works (click, edit, check)
- [ ] Enter key saves name
- [ ] Escape key cancels rename
- [ ] Empty name not allowed
- [ ] Name > 100 chars shows error
- [ ] Name persists after page refresh

### Delete Session

- [ ] Delete from dropdown menu works
- [ ] Confirmation dialog shown
- [ ] Session removed from sidebar
- [ ] Current session resets if deleted
- [ ] Deleted session not accessible via URL
- [ ] Soft delete (status='deleted', not actually removed)

### Recent Sessions List

- [ ] Shows most recent 20 sessions
- [ ] Ordered by updatedAt DESC
- [ ] Excludes deleted sessions
- [ ] Shows relative timestamps
- [ ] Empty state shown when no sessions
- [ ] Loading skeleton while fetching

---

## 🎬 CONTENT GENERATION

### Discovery Phase

- [ ] Discovery questions appear one at a time
- [ ] Questions are relevant and specific
- [ ] Can answer and continue
- [ ] Can skip questions
- [ ] Conversation history preserved
- [ ] Agent status shows "Discovering..."

### Hook Selection

- [ ] Text hooks generated (5 options)
- [ ] Verbal hooks generated
- [ ] Visual hooks generated
- [ ] Hook overview synthesizes all types
- [ ] Can select a hook
- [ ] Selected hook highlighted
- [ ] Progress indicator updates

### Content Generation

- [ ] All 5 panels generate successfully:
  - [ ] Script (5-part structure)
  - [ ] Storyboard (shot descriptions)
  - [ ] Tech Specs (duration, hashtags)
  - [ ] B-Roll (footage suggestions)
  - [ ] Captions (on-screen text)
- [ ] Generation time < 30 seconds
- [ ] Progress indicator shows current stage
- [ ] Can cancel generation mid-process
- [ ] Error message if generation fails

### Content Quality

- [ ] Script follows Hook→Context→Conflict→Turning Point→Resolution
- [ ] Each script section has clear timing
- [ ] Storyboard has shot-by-shot details
- [ ] Tech specs are realistic (duration, aspect ratio)
- [ ] B-Roll suggestions are specific and actionable
- [ ] Captions are concise and impactful
- [ ] Content matches user's inputs

---

## ✏️ CONTENT EDITING

### Chat-Based Editing

- [ ] Can send edit message after generation
- [ ] Edit applies to correct panel
- [ ] UI updates immediately
- [ ] Multiple edits compound correctly
- [ ] Edit preserves rest of content
- [ ] Loading state during edit

### Specific Edit Tests

- [ ] "Add a joke to the script" → Script panel updated
- [ ] "Make hook shorter" → Hook text updated
- [ ] "Change aspect ratio to 9:16" → Tech specs updated
- [ ] "Add more B-roll ideas" → B-Roll panel updated
- [ ] "Simplify captions" → Captions updated

---

## 💾 AUTO-SAVE & STATE MANAGEMENT

### Auto-Save

- [ ] Changes auto-save after 2 seconds of inactivity
- [ ] Auto-save indicator shown
- [ ] "All changes saved" message appears
- [ ] No duplicate save requests

### Browser Close Protection

- [ ] Unsaved changes trigger warning
- [ ] Warning shown only if changes exist
- [ ] Can cancel browser close
- [ ] Can confirm and lose changes

### State Persistence

- [ ] Page refresh preserves session
- [ ] URL parameter loads correct session
- [ ] Generation state persists
- [ ] Edit history preserved

---

## 👥 USER MANAGEMENT (ADMIN)

### View All Users

- [ ] Admin can see all users
- [ ] User list shows email, tier, stats
- [ ] Non-admin gets 403 error
- [ ] Table sortable by columns
- [ ] Pagination works for >20 users

### Update User Tier

- [ ] Can change free → pro
- [ ] Can change pro → admin
- [ ] Cannot demote self from admin
- [ ] Tier change persists
- [ ] Audit log created
- [ ] User notified of change (future feature)

### Password Reset

- [ ] Can generate reset link
- [ ] Reset link is valid
- [ ] Audit log created
- [ ] Email sent (if email service configured)

---

## 📊 ADMIN DASHBOARD

### Metrics Overview

- [ ] Total users count correct
- [ ] Active users (30 days) count correct
- [ ] Tier distribution accurate
- [ ] Total generations count correct
- [ ] Total cost calculated correctly

### Cost Analytics

- [ ] System-wide costs displayed
- [ ] Cost breakdown by feature
- [ ] Top users by cost (top 10)
- [ ] Time range filter works (7/30/90 days)

### Error Monitoring

- [ ] Recent errors displayed
- [ ] Errors sorted by timestamp
- [ ] Severity badges correct
- [ ] Error details expandable
- [ ] Filter by severity works

---

## 🔒 SECURITY & RATE LIMITING

### Rate Limiting

- [ ] Free tier: 10 generations/hour enforced
- [ ] Pro tier: 100 generations/hour enforced
- [ ] Admin tier: Unlimited
- [ ] 429 error shows retry time
- [ ] Rate limit headers in response
- [ ] Upgrade message shown to free users

### Input Validation

- [ ] Session name >100 chars rejected
- [ ] Empty session name rejected
- [ ] Invalid tier rejected
- [ ] SQL injection attempts sanitized
- [ ] XSS attempts sanitized

### CORS & Headers

- [ ] Only allowed origins accepted
- [ ] Unauthorized origin blocked
- [ ] Security headers present (Helmet)
- [ ] CSP policy enforced

### Firestore Security Rules

- [ ] User A cannot read User B's sessions
- [ ] User A cannot update User B's tier
- [ ] Admin can read all sessions
- [ ] Unauthenticated users blocked

---

## 📱 RESPONSIVE DESIGN

### Mobile (375px viewport)

- [ ] Sidebar becomes drawer
- [ ] All buttons have 44x44px touch targets
- [ ] Text is 16px minimum
- [ ] No horizontal scroll
- [ ] Forms are usable
- [ ] Content readable without zoom

### Tablet (768px viewport)

- [ ] Sidebar visible
- [ ] Two-column layout works
- [ ] Navigation usable
- [ ] Content properly sized

### Desktop (1920px viewport)

- [ ] Full layout displayed
- [ ] No excessive white space
- [ ] Max-width containers used
- [ ] Sidebar fixed

---

## ⚡ PERFORMANCE

### Load Times

- [ ] Initial page load < 3 seconds
- [ ] Subsequent navigation < 1 second
- [ ] Time to interactive < 5 seconds
- [ ] Font loading doesn't block rendering

### Web Vitals

- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] TTFB (Time to First Byte) < 600ms

### Optimization

- [ ] Images lazy loaded
- [ ] Code split by route
- [ ] CSS/JS minified in production
- [ ] No console.logs in production build

---

## 🔍 ERROR HANDLING

### Network Errors

- [ ] Offline mode shows message
- [ ] Failed requests retry automatically
- [ ] Timeout errors handled gracefully
- [ ] User-friendly error messages

### Application Errors

- [ ] React error boundary catches crashes
- [ ] Sentry captures errors
- [ ] User can recover from errors
- [ ] Stack traces not exposed in production

### Validation Errors

- [ ] Clear field-level error messages
- [ ] Errors appear inline
- [ ] Form submission blocked until fixed
- [ ] Success messages shown

---

## 💰 COST TRACKING

### User Usage Dashboard

- [ ] Total generations displayed
- [ ] Tokens used calculated correctly
- [ ] Total cost accurate
- [ ] Cost breakdown by feature shown
- [ ] Percentages add up to 100%

### System Cost Tracking

- [ ] Usage events logged to Firestore
- [ ] Cost calculated with correct pricing
- [ ] User's usage field updated
- [ ] Session metrics updated

---

## 📤 EXPORT FUNCTIONALITY (Future)

### PDF Export

- [ ] All 5 panels included
- [ ] Formatting preserved
- [ ] Download works
- [ ] Filename includes session name

### CSV Export

- [ ] Data formatted correctly
- [ ] All fields included
- [ ] Download works

---

## 🧪 CROSS-BROWSER TESTING

### Chrome (Latest)

- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

### Firefox (Latest)

- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

### Safari (Latest)

- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

### Edge (Latest)

- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

---

## 📊 MONITORING & OBSERVABILITY

### Sentry Integration

- [ ] Errors sent to Sentry
- [ ] User context attached
- [ ] Breadcrumbs captured
- [ ] Source maps uploaded

### Logging

- [ ] Server logs structured (JSON)
- [ ] Important events logged
- [ ] Sensitive data not logged
- [ ] Log levels appropriate

---

## ✅ PRODUCTION READINESS

### Environment Variables

- [ ] All variables documented
- [ ] .env.example up to date
- [ ] Production values set
- [ ] No secrets in code

### Build Process

- [ ] `npm run build` succeeds (client)
- [ ] `npm run build` succeeds (server)
- [ ] No TypeScript errors
- [ ] Bundle size reasonable (< 500KB gzipped)

### Deployment

- [ ] Health check endpoint works
- [ ] Database migrations run
- [ ] Firestore indexes deployed
- [ ] Security rules deployed
