# .env.local File Instructions

## ✅ File Created!

The `.env.local` file has been created in the root directory.

## 📝 What You Need to Do

1. **Open `.env.local`** in your code editor (VS Code, Notepad++, etc.)

2. **Find this line:**
   ```
   GEMINI_API_KEY="PASTE_YOUR_GEMINI_API_KEY_HERE"
   ```

3. **Replace the placeholder:**
   - Select/highlight: `PASTE_YOUR_GEMINI_API_KEY_HERE`
   - Paste your actual Gemini API key (keep the quotes)
   - It should look like: `GEMINI_API_KEY="AIzaSyC...your-actual-key..."`
   
4. **Save the file**

## 🔑 Getting Your Gemini API Key

If you don't have one yet:
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Paste it into `.env.local` (replacing `PASTE_YOUR_GEMINI_API_KEY_HERE`)

## ✅ Verification

After updating, your `.env.local` should have:
- ✅ DATABASE_URL set
- ✅ JWT_SECRET set (already done)
- ✅ SESSION_SECRET set (already done)
- ✅ GEMINI_API_KEY set (you just updated this)
- ✅ Other config values set

**Important:** Make sure there are no spaces around the `=` sign and the value is in quotes.

## 🚀 Next Steps

Once you've added your API key:
1. Set up database (Docker or PostgreSQL)
2. Run: `npm run db:push`
3. Run: `npm run dev`
4. Open: http://localhost:5000

