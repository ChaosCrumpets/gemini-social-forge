# Your Setup Steps - Do These Now

## ✅ Already Done For You
- Dependencies installed
- TypeScript check passed  
- Secrets generated

## 📝 Step 1: Create .env.local File

Create a file named `.env.local` in the root directory with this exact content:

```
DATABASE_URL="postgres://cal_dev:dev_password@localhost:5432/cal_local"
JWT_SECRET="7bf4d89a1271709f1cbdfa882e3158854522a926d061bd766a4dee180ec4f079"
SESSION_SECRET="c298b8861222c1dc71b7b175d720ea8d607d533540be655ec372264ad4a6de1d"
GEMINI_API_KEY="YOUR_API_KEY_HERE"
VITE_API_BASE_URL="http://localhost:3001"
VITE_APP_URL="http://localhost:5173"
NODE_ENV="development"
```

**⚠️ IMPORTANT:** 
- Replace `YOUR_API_KEY_HERE` with your actual Gemini API key
- Get your key from: https://makersuite.google.com/app/apikey

---

## 🗄️ Step 2: Set Up Database

### Option A: Docker (Easiest)

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Start Docker Desktop
3. Run: `docker-compose up -d`
4. Wait for it to start

### Option B: Local PostgreSQL

1. Install PostgreSQL 15+ from: https://www.postgresql.org/download/windows/
2. Create database: `createdb cal_local`
3. Update DATABASE_URL in `.env.local` with your username/password

---

## 🔄 Step 3: Run Migrations

```bash
npm run db:push
```

---

## 🚀 Step 4: Start the App

```bash
npm run dev
```

Wait for: `serving on port 5000`

---

## 🌐 Step 5: Open Browser

Open: **http://localhost:5000**

---

## ✅ Tell Me When Ready

Once you:
1. Created `.env.local` with your API key
2. Started the database
3. Ran migrations
4. Started the app
5. Opened http://localhost:5000

**Let me know and I'll help you test!**

