# Security Audit Checklist

## 🔐 Authentication & Authorization

### Firebase Auth

- [ ] JWT tokens properly verified on all routes
- [ ] Tokens expire appropriately (1 hour)
- [ ] Token refresh implemented
- [ ] No tokens in URL parameters
- [ ] Tokens stored in httpOnly cookies OR localStorage (with XSS protections)

### Authorization

- [ ] Role-based access control (RBAC) enforced
- [ ] Admin routes protected with requireAdmin
- [ ] Users can only access their own data
- [ ] No privilege escalation vulnerabilities

---

## 🛡️ Input Validation & Sanitization

### Server-Side

- [ ] All inputs validated with express-validator
- [ ] SQL injection not possible (using Firestore, but still check)
- [ ] NoSQL injection attempts handled
- [ ] File uploads sanitized (if applicable)
- [ ] Max length enforced on all text inputs

### Client-Side

- [ ] XSS protection via React's auto-escaping
- [ ] User input sanitized before rendering
- [ ] No dangerouslySetInnerHTML usage
- [ ] External links open in new tab with noopener/noreferrer

---

## 🌐 Network Security

### HTTPS

- [ ] All production traffic over HTTPS
- [ ] HSTS header set
- [ ] No mixed content warnings

### CORS

- [ ] Only allowed origins permitted
- [ ] Credentials: true set correctly
- [ ] No wildcard (*) origins in production

### Headers

- [ ] Content-Security-Policy enforced
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy set
- [ ] Permissions-Policy configured

---

## 🔑 Secrets Management

### Environment Variables

- [ ] No secrets in git (check with git log)
- [ ] .env in .gitignore
- [ ] Production secrets different from dev
- [ ] Secrets rotated regularly
- [ ] Minimum necessary permissions for API keys

### Firebase

- [ ] Private key not exposed
- [ ] Firebase config restricted to domain
- [ ] Firestore security rules deployed
- [ ] No admin SDK credentials client-side

---

## 💾 Data Security

### Firestore Security Rules

- [ ] Users can only read/write their own data
- [ ] Admins have appropriate elevated permissions
- [ ] No allow read, write: if true rules
- [ ] All collections have explicit rules

### Data Encryption

- [ ] Sensitive data encrypted at rest (Firebase default)
- [ ] Sensitive data encrypted in transit (HTTPS)
- [ ] No sensitive data in logs
- [ ] No sensitive data in error messages

---

## 🚨 Error Handling

### Production

- [ ] Stack traces not exposed to users
- [ ] Generic error messages for 500 errors
- [ ] Detailed errors only in Sentry
- [ ] No database structure revealed in errors

### Logging

- [ ] No passwords logged
- [ ] No tokens logged
- [ ] No PII in logs (or properly redacted)
- [ ] Logs sanitized before external services

---

## ⏱️ Rate Limiting

### API Endpoints

- [ ] Global rate limit (100 req/15 min)
- [ ] Tier-based limits enforced
- [ ] Strict limits on auth endpoints (5/hour)
- [ ] Rate limit bypass prevented

---

## 🧪 Dependency Security

### NPM Packages

- [ ] Run `npm audit` (no critical vulnerabilities)
- [ ] Dependencies up to date
- [ ] No unused dependencies
- [ ] License compliance checked

---

## 🔍 Testing

### Penetration Testing (Basic)

- [ ] Try SQL injection on all inputs
- [ ] Try XSS on all inputs
- [ ] Try CSRF attacks
- [ ] Try privilege escalation (user → admin)
- [ ] Try accessing other users' data

### Tools to Run

```bash
# NPM audit
npm audit --production

# Check for known vulnerabilities
npx retire

# Frontend security scan
npx eslint-plugin-security

# OWASP ZAP scan (if available)
```

---

## ✅ Security Checklist Summary

Before production:

- [ ] All authentication secure
- [ ] All inputs validated
- [ ] HTTPS enforced
- [ ] Secrets properly managed
- [ ] Firestore rules deployed
- [ ] Rate limiting active
- [ ] Error handling secure
- [ ] Dependencies audited
- [ ] Basic penetration testing passed
