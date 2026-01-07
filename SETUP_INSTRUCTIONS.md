# Setup Instructions - Follow These Steps

## ✅ Step 1: Create .env.local File

Create a file named `.env.local` in the root directory with this content:

```env
DATABASE_URL="postgres://cal_dev:dev_password@localhost:5432/cal_local"
JWT_SECRET="7bf4d89a1271709f1cbdfa882e3158854522a926d061bd766a4dee180ec4f079"
SESSION_SECRET="c298b8861222c1dc71b7b175d720ea8d607d533540be655ec372264ad4a6de1d"
GEMINI_API_KEY="YOUR_API_KEY_HERE"
VITE_API_BASE_URL="http://localhost:3001"
VITE_APP_URL="http://localhost:5173"
NODE_ENV="development"
```

**⚠️ IMPORTANT:** Replace `YOUR_API_KEY_HERE` with your actual Gemini API key from:
https://makersuite.google.com/app/apikey

---

## 🗄️ Step 2: Database Setup

You have two options:

### Option A: Docker (Recommended - Easiest)

1. **Install Docker Desktop** (if not installed):
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop

2. **Start PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

3. **Verify it's running:**
   ```bash
   docker ps
   ```
   You should see `cal_postgres` container running.

### Option B: Local PostgreSQL

1. **Install PostgreSQL 15+** (if not installed):
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, remember the password you set

2. **Create database:**
   ```bash
   createdb cal_local
   ```
   Or using psql:
   ```bash
   psql -U postgres
   CREATE DATABASE cal_local;
   \q
   ```

3. **Update DATABASE_URL in .env.local:**
   ```env
   DATABASE_URL="postgres://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/cal_local"
   ```

---

## 🔄 Step 3: Run Database Migrations

Once database is running:

```bash
npm run db:push
```

This will create all necessary tables.

---

## 🚀 Step 4: Start the App

```bash
npm run dev
```

Wait for the message: `serving on port 5000`

---

## 🌐 Step 5: Open in Browser

Open: **http://localhost:5000**

---

## ✅ Verification Checklist

Before testing, verify:
- [ ] `.env.local` file exists with all variables set
- [ ] `GEMINI_API_KEY` is set (not "YOUR_API_KEY_HERE")
- [ ] Database is running (Docker or local PostgreSQL)
- [ ] Migrations ran successfully (`npm run db:push`)
- [ ] App starts without errors
- [ ] Can access http://localhost:5000

---

## 🆘 Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env.local` is correct
- For Docker: `docker ps` to see if container is running

### "GEMINI_API_KEY is required"
- Make sure you replaced `YOUR_API_KEY_HERE` in `.env.local`
- Restart the app after updating `.env.local`

### Port already in use
- Change PORT in `.env.local` or kill the process using port 5000
- Windows: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`

---

**Ready? Follow the steps above and let me know when you're ready to test!**

