# Quick Start Guide - Test the App

Follow these steps to get the app running for testing.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory with these values:

```env
# Database (use Docker or local PostgreSQL)
DATABASE_URL="postgres://cal_dev:dev_password@localhost:5432/cal_local"

# Generate these secrets (32+ characters each)
JWT_SECRET="your-random-jwt-secret-here"
SESSION_SECRET="your-random-session-secret-here"

# Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY="your-gemini-api-key"

# App URLs
VITE_API_BASE_URL="http://localhost:3001"
VITE_APP_URL="http://localhost:5173"
NODE_ENV="development"
```

**Quick secret generation:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run this twice to get JWT_SECRET and SESSION_SECRET.

## Step 3: Start Database

**Option A: Docker (Recommended)**
```bash
docker-compose up -d
```

**Option B: Local PostgreSQL**
- Install PostgreSQL 15+
- Create database: `createdb cal_local`
- Update DATABASE_URL in `.env.local`

## Step 4: Run Database Migrations

```bash
npm run db:push
```

## Step 5: Type Check (Optional)

```bash
npm run check
```

## Step 6: Start the App

**Option A: Combined (Replit style - single port)**
```bash
npm run dev
```
Opens on http://localhost:5000

**Option B: Separate (local dev - two ports)**
```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend  
npm run dev:client
```
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## Step 7: Test the App

1. Open http://localhost:5173 (or 5000 if using `npm run dev`)
2. Sign up for a new account
3. Create a new project
4. Test the critical flows from `TESTING_CHECKLIST.md`

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running: `docker ps` (for Docker) or `pg_isready`
- Verify DATABASE_URL in `.env.local`
- Check port 5432 is not in use

### Port Already in Use
- Change PORT in `.env.local` or kill the process using the port
- Windows: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`

### TypeScript Errors
- Run `npm install` again
- Check `tsconfig.json` is valid
- Verify all dependencies are installed

### API Errors
- Check backend is running
- Verify GEMINI_API_KEY is set correctly
- Check browser console for errors

## Testing Checklist

See `TESTING_CHECKLIST.md` for detailed test scenarios.

**Quick Test:**
1. ✅ App loads without errors
2. ✅ Can sign up/login
3. ✅ Can create new project
4. ✅ Sidebar navigation works (no sticky behavior)
5. ✅ Back button works (no false auth redirects)
6. ✅ Chat scrolls smartly (doesn't interrupt reading)

## Next Steps

Once the app is running:
1. Complete the testing checklist
2. Report any issues found
3. Verify all fixes are working
4. Test edge cases

