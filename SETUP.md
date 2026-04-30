# Resume Master Pro v3 - Setup Guide

Complete guide to deploy the bulk auto-apply system on your own environment.

---

## 1. Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **npm** or **yarn** or **bun**
- **MongoDB Atlas account** (free tier available)
- **Google Cloud API Key** (Gemini 2.5 Flash for AI features)
- **OpenAI API Key** (optional, for alternate LLM provider)
- **GitHub account** (for code hosting)

---

## 2. Clone & Setup Repository

### Option A: Clone from existing repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-resume-builder.git
cd ai-resume-builder
npm install
```

### Option B: Create new repository on your GitHub account
1. Go to https://github.com/new
2. Create repository name: `ai-resume-builder`
3. Clone it locally:
```bash
git clone https://github.com/YOUR_USERNAME/ai-resume-builder.git
cd ai-resume-builder
```
4. Add the original code (ask @Jitendra7999 for access or use the codebase provided)

---

## 3. Environment Variables Setup

Create a `.env.local` file in the project root:

```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.XXXXX.mongodb.net/resume-builder?retryWrites=true&w=majority

# Gemini AI (Google)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

# OpenAI (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Application URLs
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_SECRET=generate_random_string_here

# Cron Job Secret (for scheduled applies)
CRON_SECRET_TOKEN=your_secure_random_token_here

# Development
NODE_ENV=development
DEBUG=true

# Port
PORT=4000
```

### How to get each API key:

#### MongoDB URI
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Add IP whitelist (click "Allow Current IP" or add 0.0.0.0/0)
4. Go to "Database" → "Connect" → "Drivers" → Node.js
5. Copy the connection string and replace USERNAME:PASSWORD
6. Add database name: `?retryWrites=true&w=majority`

#### Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Click "Create API Key"
3. Copy the key to `.env.local`

#### OpenAI API Key (optional)
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy to `.env.local`

#### NEXTAUTH_SECRET
Generate a random string:
```bash
openssl rand -base64 32
```

#### CRON_SECRET_TOKEN
Generate for cron job authentication:
```bash
openssl rand -base64 32
```

---

## 4. Install Dependencies

```bash
npm install
# or
yarn install
# or
bun install
```

---

## 5. Run Development Server

```bash
npm run dev
```

Server will start on **http://localhost:4000** (not 3000!)

Verify:
- ✅ Dashboard loads at http://localhost:4000
- ✅ Job board visible at http://localhost:4000/jobs
- ✅ API endpoints responding at http://localhost:4000/api/*

---

## 6. Create Initial User in MongoDB

In MongoDB Atlas console, insert a test user into `users` collection:

```json
{
  "username": "test-user",
  "email": "test@example.com",
  "password": "$2a$10$...", // bcrypt hashed password
  "profile": {
    "fullName": "Test User",
    "skills": "React, TypeScript, Node.js",
    "expYears": "3"
  },
  "appliedJobs": [],
  "scheduledJobs": [],
  "applicationAnalytics": {
    "totalApplications": 0,
    "responseRate": 0,
    "bestApplyTimes": []
  },
  "preferences": {
    "autoSchedule": true,
    "dailyApplyGoal": 100,
    "maxApplicationsPerHour": 10,
    "preferredApplyTimes": [9, 14, 17]
  }
}
```

Or use the API to create:
```bash
curl -X POST http://localhost:4000/api/user/profile \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{
    "profile": {
      "fullName": "Test User",
      "skills": "React, TypeScript, Node.js",
      "expYears": "3"
    }
  }'
```

---

## 7. Testing the System

### Test 1: Load Dashboard
```
http://localhost:4000
```
Should show stats and best apply times.

### Test 2: Test Job Board
```
http://localhost:4000/jobs?location=remote
```
Should load 100+ jobs from multiple sources.

### Test 3: Test User Profile API
```bash
curl http://localhost:4000/api/user/profile \
  -H "x-user-id: test-user"
```

### Test 4: Test Applied Jobs API
```bash
curl -X POST http://localhost:4000/api/user/applied-jobs \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{
    "jobUrl": "https://example.com/job/123",
    "jobTitle": "Senior React Developer",
    "companyName": "Tech Corp",
    "description": "Looking for...",
    "status": "applied",
    "appliedAt": "2026-04-30T10:00:00Z"
  }'
```

### Test 5: Test Bulk Apply (Single Job)
```bash
curl -X POST http://localhost:4000/api/bulk-apply \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{
    "jobs": [{
      "id": "1",
      "url": "https://example.com/apply",
      "title": "Frontend Developer",
      "company": "Tech Corp",
      "description": "..."
    }],
    "profile": {"fullName": "Test", "skills": "React"},
    "resumeContent": "Your resume text...",
    "autoSubmit": false,
    "alreadyAppliedUrls": []
  }' \
  --no-buffer
```

---

## 8. Set Up Scheduled Auto-Apply (Optional)

The system supports automatic applications at optimal times. To enable:

### Option A: GitHub Actions (FREE)

Create `.github/workflows/auto-apply.yml`:

```yaml
name: Auto-Apply to Jobs
on:
  schedule:
    - cron: '*/1 * * * *'  # Every 1 minute

jobs:
  apply:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger auto-apply
        run: |
          curl -X POST https://your-deployed-app.com/api/scheduler/process \
            -H "Authorization: Bearer ${{ secrets.CRON_TOKEN }}" \
            -H "Content-Type: application/json"
```

Add secret in GitHub repo settings:
- Name: `CRON_TOKEN`
- Value: Your `CRON_SECRET_TOKEN` from `.env.local`

### Option B: EasyCron (Service)

1. Go to [EasyCron.com](https://www.easycron.com)
2. Create account and login
3. Add new cron job:
   - **URL**: `https://your-deployed-app.com/api/scheduler/process`
   - **HTTP Headers**: Add header `Authorization: Bearer YOUR_CRON_SECRET`
   - **Execution Interval**: Every 1 minute
   - **HTTP Method**: POST

### Option C: Self-Hosted Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line (runs every minute)
* * * * * curl -X POST http://localhost:4000/api/scheduler/process \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

---

## 9. Production Deployment

### Option A: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# - MONGODB_URI
# - GOOGLE_GENERATIVE_AI_API_KEY
# - NEXTAUTH_SECRET
# - CRON_SECRET_TOKEN
```

### Option B: Render / Railway

1. Connect GitHub repository
2. Create new Web Service
3. Select Node.js environment
4. Add build command: `npm install && npm run build`
5. Add start command: `npm start`
6. Add environment variables in dashboard
7. Deploy

### Option C: Docker (Self-Hosted)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t ai-resume-builder .
docker run -p 4000:4000 \
  -e MONGODB_URI="..." \
  -e GOOGLE_GENERATIVE_AI_API_KEY="..." \
  ai-resume-builder
```

---

## 10. Database IP Whitelist (Important!)

If you get MongoDB connection error:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click your cluster → "Network Access"
3. Click "Add IP Address"
4. Choose "Allow Current IP" (for dev) OR "Allow Access from Anywhere" (0.0.0.0/0 for production)
5. Confirm

---

## 11. Features Overview

### Dashboard (`/`)
- 4 stat cards: Applications, Responses, Response Rate, Saved Jobs
- Best Apply Times card (top 3 hours with response rates)
- LinkedIn connection banner
- Quick action buttons to job board and resume builder

### Job Board (`/jobs`)
- Filter by location: Remote 🏠 | On-site 🏢 | India 🇮🇳 | All 🌐
- Filter by experience: Fresher | 1-2 Yrs | 3-5 Yrs | 5+ Yrs | 10+ Yrs
- Sort by relevance, salary, posted date, or "Best Match"
- Checkbox select mode for bulk selection
- "Auto-Select 100" button (picks top 100 by match score)
- Real-time match score (0-100%) for each job
- Difficulty badges: 🟢 Good Fit | 🟡 Stretch | 🔴 Too Advanced
- "Apply Queue" button with pending count

### Bulk Auto-Apply
- Right-side sliding panel showing queue status
- Per-job progress: pending → in-progress → success/failed/captcha
- Real-time logs for each application
- SSE streaming for live updates
- Duplicate prevention (won't apply twice to same job)
- 2-second delay between applications (rate limit)
- Automatic form filling for Greenhouse, Lever, Workable, Ashby, BambooHR, generic forms

### AI Features
- **Cover Letter Generator**: 3-paragraph professional letters (streams in 2-3 seconds)
- **Skill Gap Analysis**: Shows matched skills vs missing skills with learning time estimates
- **Job Recommendations**: AI-ranked jobs by relevance to your skills/experience

### Application Tracker (`/applications`)
- View all applications by status: Applied | Interviewing | Offered | Rejected | Ghosted
- Edit application: change status, add interview date, salary offer, rejection reason, notes
- Real-time response rate tracking
- Stats: total apps, response count, response rate %
- Export to CSV
- Direct database sync (no localStorage)

### Smart Scheduling
- Analyzes historical response patterns by hour and day of week
- Auto-applies at optimal times based on your history
- Configurable daily goal (default: 100 apps/day)
- Configurable max apps/hour (default: 10)
- Spread applications across preferred times (default: 9am, 2pm, 5pm)

---

## 12. API Endpoints Reference

### User Profile
- `GET /api/user/profile` - Get user profile
- `POST /api/user/profile` - Create/update profile
- `GET /api/user/stats` - Get application statistics

### Applied Jobs
- `GET /api/user/applied-jobs` - List applications (with status filter)
- `POST /api/user/applied-jobs` - Record new application
- `PATCH /api/user/applied-jobs` - Update application status
- `DELETE /api/user/applied-jobs` - Remove application

### Bulk Apply
- `POST /api/bulk-apply` - Queue and apply to multiple jobs (SSE)

### Smart Scheduling
- `GET /api/scheduler/best-times` - Get best hours to apply (from history)
- `POST /api/scheduler/schedule` - Queue jobs for optimal time apply
- `POST /api/scheduler/process` - Process scheduled jobs (cron trigger)

### AI Features
- `POST /api/cover-letter` - Generate cover letter (streaming)
- `POST /api/skill-gap` - Analyze skill gaps

### Job Search
- `GET /api/jobs` - Search jobs (all sources: Remotive, Arbeitnow, The Muse, JSearch, Adzuna)
- `GET /api/jobs/recommendations` - Get AI-ranked job recommendations

### LinkedIn
- `POST /api/linkedin/callback` - OAuth callback handler

---

## 13. Common Issues & Solutions

### "Cannot find module '@/lib/applyToJob'"
```bash
npm install
npm run dev
```

### "MongoDB connection failed"
- Check `.env.local` has correct `MONGODB_URI`
- Verify IP whitelist in MongoDB Atlas
- Check username:password is correct (URL-encode special chars)

### "Puppeteer timeout on form filling"
- Increase timeout in `/lib/applyToJob.ts` (default: 30s)
- Check if website requires manual CAPTCHA solving
- Try `autoSubmit: false` to review form before submission

### "Rate limited by job API"
- Add delay in bulk apply loop (currently 2 seconds)
- Use multiple API keys if available
- Check API docs for rate limits

### "Gemini API quota exceeded"
- Check your API usage at [Google AI Studio](https://aistudio.google.com/app/usage)
- Upgrade to paid plan if needed
- Rate limit requests in `/api/cover-letter` and `/api/skill-gap`

---

## 14. Architecture Overview

```
├── /app
│   ├── /api
│   │   ├── /bulk-apply          # Queue and process bulk applications
│   │   ├── /cover-letter        # AI cover letter generation
│   │   ├── /scheduler           # Cron endpoint and analysis
│   │   │   ├── /best-times      # Analyze response patterns
│   │   │   ├── /schedule        # Queue jobs for optimal time
│   │   │   └── /process         # Process queued jobs (cron)
│   │   ├── /user                # User profile and application CRUD
│   │   │   ├── /profile         # GET/POST user profile
│   │   │   ├── /applied-jobs    # GET/POST/PATCH/DELETE applications
│   │   │   └── /stats           # Analytics
│   │   ├── /skill-gap           # Skill gap analysis
│   │   ├── /jobs                # Job search APIs
│   │   ├── /recommendations     # AI job recommendations
│   │   └── /apply               # Single job apply (legacy)
│   ├── page.tsx                 # Dashboard home
│   ├── jobs/page.tsx            # Job board with bulk apply
│   └── applications/page.tsx    # Application tracker
├── /lib
│   ├── applyToJob.ts            # Shared form filling logic
│   ├── models/User.ts           # MongoDB User schema
│   └── mongodb.ts               # DB connection
├── .env.local                   # Secrets (DO NOT COMMIT)
└── package.json
```

---

## 15. Next Steps

1. ✅ Clone repository to your machine
2. ✅ Create `.env.local` with API keys
3. ✅ Set up MongoDB Atlas cluster
4. ✅ Run `npm install`
5. ✅ Start dev server: `npm run dev`
6. ✅ Test at http://localhost:4000
7. ✅ Create test user
8. ✅ Try job search and single apply
9. ✅ Configure bulk apply settings
10. ✅ Set up cron job for scheduled applies (optional)
11. ✅ Deploy to Vercel/Render/Docker
12. ✅ Monitor applications in `/applications` dashboard

---

## 16. Support & Debugging

### Enable Debug Logging
```bash
DEBUG=* npm run dev
```

### Check MongoDB Connection
```bash
mongosh "mongodb+srv://username:password@cluster.mongodb.net"
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:4000/api/jobs

# Check user profile
curl http://localhost:4000/api/user/profile -H "x-user-id: test-user"

# Check applied jobs
curl http://localhost:4000/api/user/applied-jobs -H "x-user-id: test-user"
```

### Monitor Server Logs
```bash
npm run dev 2>&1 | tee server.log
```

---

## 17. Performance Tips

- **Bulk Apply**: Start with 10-20 jobs, scale up to 100 once stable
- **Cron Frequency**: Every 1-5 minutes (higher frequency = more API calls)
- **MongoDB**: Use Atlas free tier for testing, upgrade for production
- **Gemini**: Cache cover letters to avoid repeated API calls
- **Job Board**: Load 100 jobs at a time, paginate as needed

---

## 18. Security Notes

- **Never commit `.env.local`** to Git (add to `.gitignore`)
- **Rotate `CRON_SECRET_TOKEN`** quarterly
- **Use HTTPS in production** (Vercel/Render handle automatically)
- **Whitelist MongoDB IP** carefully (0.0.0.0/0 only for dev, restrict in production)
- **Validate user input** on all API endpoints
- **Rate limit APIs** to prevent abuse

---

**Ready to deploy? Follow the steps above and start building! 🚀**

Questions? Check the API endpoints in `/app/api` for implementation details.
