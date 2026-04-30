# Quick Start Guide for PratikPatidar Setup

Your bulk auto-apply system is ready to deploy! Here's how to get it running on your GitHub account.

---

## 📦 Code Reference

**Latest Commit**: `0b6a49c`

**Commit Message**:
```
feat: Add bulk auto-apply system with smart scheduling and database integration

Major Features:
- Bulk auto-apply: Apply to 100+ jobs daily with SSE real-time progress streaming
- Smart job matching: Skill-based relevance scoring
- Intelligent scheduling: Auto-applies at optimal times
- AI cover letter generation via Gemini 2.5 Flash
- Skill gap analysis with Zod validation
- Application tracking dashboard (MongoDB)
- Daily progress tracking (goal: 100/day)
```

---

## 🚀 Step 1: Get the Code

### Option A (Direct): Ask Jitendra for repository access
Ask @Jitendra7999 to add you as collaborator to `https://github.com/Jitendra7999/ai-resume-builder.git`

Then clone and push to your own repo:
```bash
git clone https://github.com/Jitendra7999/ai-resume-builder.git
cd ai-resume-builder
git remote set-url origin https://github.com/PratikPatidar/ai-resume-builder.git
git push -u origin job-hunt
```

### Option B (Your Own): Create new repository
1. Create new repo at: https://github.com/new
   - **Repo name**: `ai-resume-builder`
   - **Visibility**: Public (for portfolio) or Private

2. Copy all files from the current codebase (ask for the files)

3. Initialize and push:
```bash
cd your-local-folder
git init
git add .
git commit -m "Initial commit - bulk auto-apply system"
git branch -M main
git remote add origin https://github.com/PratikPatidar/ai-resume-builder.git
git push -u origin main
```

---

## ⚙️ Step 2: Environment Setup

Create `.env.local` file in root with:

```env
# 🔗 MongoDB Atlas - REQUIRED
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/resume-builder?retryWrites=true&w=majority

# 🤖 Google Gemini API - REQUIRED for AI features
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# 🔐 Next.js Auth
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_SECRET=openssl_rand_-base64_32_output_here

# ⏱️ Cron Job Secret - REQUIRED for auto-apply scheduling
CRON_SECRET_TOKEN=openssl_rand_-base64_32_output_here

# Environment
NODE_ENV=development
PORT=4000
```

### Get API Keys (5 min):

**MongoDB**:
1. https://www.mongodb.com/cloud/atlas → Create Free Cluster
2. Add IP: Cluster → Network Access → Allow Current IP
3. Get connection string from Connect → Drivers → Node.js

**Google Gemini** (Free 60 calls/min):
1. https://aistudio.google.com/app/apikeys
2. Create API Key
3. Copy to `.env.local`

**Generate Random Secrets**:
```bash
# macOS/Linux
openssl rand -base64 32
```

---

## 💾 Step 3: Install & Run

```bash
# Install dependencies
npm install

# Start dev server (IMPORTANT: Port 4000)
npm run dev
```

✅ Should see:
```
> ai-chatboot@0.1.0 dev
> next dev -p 4000

  ▲ Next.js 16.1.6
  - Local:        http://localhost:4000
  - Environments: .env.local

✓ Ready in 2.1s
```

---

## ✅ Step 4: Quick Verification Tests

### Test 1: Dashboard
```
http://localhost:4000
```
Should show dashboard with stat cards.

### Test 2: Job Board
```
http://localhost:4000/jobs
```
Should show 100+ job listings.

### Test 3: Test User API
```bash
curl http://localhost:4000/api/user/profile \
  -H "x-user-id: test-user"
```

Should return empty profile or create new user.

---

## 🎯 Step 5: Create Test User

### Option A: Via API
```bash
curl -X POST http://localhost:4000/api/user/profile \
  -H "Content-Type: application/json" \
  -H "x-user-id: pratik-patidar" \
  -d '{
    "profile": {
      "fullName": "Pratik Patidar",
      "skills": "React, TypeScript, Node.js, Next.js",
      "expYears": "3"
    }
  }'
```

### Option B: Via MongoDB Atlas Console
Insert directly into `users` collection.

---

## 🔥 Step 6: Try Bulk Auto-Apply

1. Go to http://localhost:4000/jobs
2. Set "My Skills": `React, TypeScript`
3. Click "Auto-Select 100" button
4. See queue panel fill with top 100 matched jobs
5. Click "▶ Start" to begin applying

**Note**: First few apps will need manual form review (set `autoSubmit: false`). Enable auto-submit once you verify forms fill correctly.

---

## 📊 Step 7: Track Applications

1. Go to http://localhost:4000/applications
2. See all applications by status (Applied, Interviewing, Rejected, etc.)
3. Edit applications: change status, add interview date, notes
4. View real-time response rate %

---

## 🔄 Step 8: Enable Scheduled Auto-Apply (Optional)

Use **GitHub Actions** for automatic applies at optimal times:

1. In your repo, create folder: `.github/workflows/`

2. Create `.github/workflows/auto-apply.yml`:
```yaml
name: Auto-Apply at Optimal Times
on:
  schedule:
    - cron: '*/1 * * * *'  # Every minute
  workflow_dispatch:       # Manual trigger button

jobs:
  apply:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger auto-apply
        run: |
          curl -X POST https://YOUR-DEPLOYED-APP.vercel.app/api/scheduler/process \
            -H "Authorization: Bearer ${{ secrets.CRON_TOKEN }}" \
            -H "Content-Type: application/json"
```

3. Add GitHub Secret:
   - Go to Settings → Secrets and variables → Actions
   - New secret: `CRON_TOKEN` = Your `CRON_SECRET_TOKEN` from `.env.local`

---

## 🌐 Step 9: Deploy to Production

### Option A: Vercel (Fastest - 2 min)
```bash
npm i -g vercel
vercel
```
Then set environment variables in Vercel dashboard.

### Option B: Render
1. https://render.com → New Web Service
2. Connect GitHub repo
3. Set environment variables
4. Deploy

### Option C: Railway
1. https://railway.app → New Project
2. Deploy from GitHub
3. Set environment variables

---

## 📋 Features Included

✅ **Job Board**
- 100+ jobs from 5 sources
- Filter by: location, experience, salary, posted date
- Smart match scoring (0-100%)
- Difficulty badges

✅ **Bulk Auto-Apply**
- Apply to 100 jobs/day automatically
- Form auto-filling for all major ATS (Greenhouse, Lever, etc.)
- Real-time progress streaming
- Duplicate prevention

✅ **AI Features**
- Cover letter generation (3 paragraphs, 2-3 seconds)
- Skill gap analysis
- Job recommendations by relevance

✅ **Analytics Dashboard**
- Applications by status (Applied, Interviewing, Offered, Rejected, Ghosted)
- Response rate tracking
- Best apply times analysis
- Daily goal progress bar (100/day)

✅ **Smart Scheduling**
- Auto-analyzes which hours/days get most responses
- Queues applications at optimal times
- Spreads across preferred times (default: 9am, 2pm, 5pm)
- Configurable daily goal and per-hour limits

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection failed | Check IP whitelist in MongoDB Atlas |
| API returns 400 x-user-id required | Add `-H "x-user-id: your-username"` to curl |
| Gemini API quota exceeded | Check usage at https://aistudio.google.com/app/usage |
| Forms not filling | Check ATS type, may need Puppeteer config adjustment |
| Localhost:3000 instead of 4000 | Use `npm run dev` (not `next dev`) |

---

## 📚 Full Documentation

See **SETUP.md** for:
- Detailed MongoDB setup
- All API endpoint reference
- Architecture overview
- Performance optimization
- Security best practices
- Docker deployment
- Custom integration examples

---

## 🎯 Next Actions

1. ✅ Clone code to `https://github.com/PratikPatidar/ai-resume-builder`
2. ✅ Create `.env.local` with API keys (5 minutes)
3. ✅ Run `npm install && npm run dev`
4. ✅ Test at http://localhost:4000
5. ✅ Create test user
6. ✅ Try bulk auto-apply with 10 jobs first
7. ✅ Deploy to Vercel (1-click from CLI)
8. ✅ Set up GitHub Actions cron (optional)
9. ✅ Start auto-applying to jobs!

---

## 💡 Pro Tips

- **Start small**: Try 10 jobs before scaling to 100
- **Monitor first**: Watch form filling before enabling `autoSubmit: true`
- **Track responses**: Check `/applications` daily to see which companies respond fastest
- **Optimize timing**: Let system collect 50+ applications before relying on "best times"
- **Resume library**: Build 3-5 tailored resumes for different roles (engineer, product, etc.)

---

**Ready to deploy? 🚀**

```bash
git clone https://github.com/Jitendra7999/ai-resume-builder.git
cd ai-resume-builder
# Create .env.local
npm install
npm run dev
```

Visit http://localhost:4000 and start building! 💪

---

**Questions?**
- Check SETUP.md for detailed documentation
- See /app/api/* for API implementation
- Check /lib/applyToJob.ts for form-filling logic
