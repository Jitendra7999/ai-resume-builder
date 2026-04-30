# Location-Based Job Filtering

## 🎯 Overview

Jobs are now **filtered by location AFTER receiving responses** from the API. All jobs are fetched, then filtered client-side based on user selection.

---

## 📍 Available Filters

### **1. All Locations (Default)**
- Shows jobs from everywhere
- Remote + On-site + India + International

### **2. Remote (🏠)**
- `job.remote === true`
- OR location contains: "remote", "worldwide", "global"
- Works across all job sources

### **3. On-site (🏢)**
- `job.remote === false`
- Location does NOT contain "remote"
- Specific office locations

### **4. India (🇮🇳)**
- Location contains: "india"
- Jobs specifically in India
- Can be remote or on-site in India

---

## 🔍 How It Works

### **Step 1: Fetch All Jobs**
```javascript
GET /api/jobs?source=linkedin&page=1
// Returns: ALL jobs (100+ jobs without location filter)
```

### **Step 2: Client-Side Filter**
```javascript
const displayedJobs = jobs.filter((job) => {
  const location = (job.candidate_required_location || '').toLowerCase();

  if (workMode === 'remote')
    return job.remote === true || location.includes('remote');

  if (workMode === 'india')
    return location.includes('india');

  if (workMode === 'onsite')
    return !location.includes('remote');

  return true; // All
});
```

### **Step 3: Display Filtered Results**
- Shows only jobs matching selected location
- Updates job count in banner
- Pagination works with filtered results

---

## 💻 UI Elements

### **Location Filter Buttons**
Located below source tabs:
```
🌐 All Locations | 🏠 Remote | 🏢 On-site | 🇮🇳 India
```

### **Smart Banner**
Shows current filter:
```
Filtering: 🏠 Remote jobs only (45 results)
```

### **Clear Filters Button**
Resets to:
- Work mode: 'all'
- Search: empty
- Job type: empty
- Reset to page 1

---

## 📊 Filter Logic

| Filter | Remote Field | Location Match | Result |
|--------|--------------|-----------------|--------|
| All | Any | Any | Show all |
| Remote | `true` | Contains "remote", "worldwide", "global" | ✅ Show |
| Remote | `false` | Contains "remote" | ✅ Show |
| Remote | Any | Other location | ❌ Hide |
| On-site | `false` | Does NOT contain "remote" | ✅ Show |
| On-site | `true` | Any | ❌ Hide |
| India | Any | Contains "india" | ✅ Show |
| India | Any | Other location | ❌ Hide |

---

## 🚀 Usage Examples

### **Example 1: Find Remote Jobs**
1. Go to `/jobs`
2. Click "💼 LinkedIn" (or any source)
3. Click **"🏠 Remote"** button
4. Only remote jobs show
5. Use pagination to browse pages

### **Example 2: Find India Jobs**
1. Go to `/jobs`
2. Click "💼 LinkedIn"
3. Click **"🇮🇳 India"** button
4. Only India-based jobs show
5. Can be remote or on-site IN India

### **Example 3: Find On-site Jobs**
1. Go to `/jobs`
2. Click "💼 LinkedIn"
3. Click **"🏢 On-site"** button
4. Only office-based jobs show
5. Specific location required (Not Remote)

---

## 🔄 How Filtering Works with Pagination

```
Page 1: Fetch 20 jobs
  ↓ Filter by location
  ↓ Show 12 remote jobs (out of 20)

Click "Load More"
  ↓ Fetch Page 2: 20 more jobs
  ↓ Filter by location
  ↓ Show 15 remote jobs (out of 20)
  ↓ Total: 27 remote jobs shown
```

---

## 📈 Real-Time Updates

When you change location filter:
- Jobs list updates **instantly**
- No new API call needed
- Uses already-fetched data
- Banner shows new count
- Pagination resets to page 1

---

## 🔧 Configuration

### **Location Keywords** (in code)
```typescript
// Remote: Matches these keywords
['remote', 'worldwide', 'global', 'flexible']

// India: Matches
['india']

// On-site: Does NOT have remote keywords
```

To add more keywords, update the filter logic in `/app/jobs/page.tsx` line ~560

---

## ✨ Features

✅ **No network calls** - Filters existing data
✅ **Instant results** - No lag or loading
✅ **Works with all sources** - Remote, Jobicy, LinkedIn, etc.
✅ **Smart banner** - Shows active filter
✅ **Maintains pagination** - Works across pages
✅ **Clear filters** - One click to reset

---

## 🎯 What Gets Filtered

**Filtered:**
- Job title
- Job location
- Job remote status

**NOT filtered:**
- Salary
- Company
- Job type
- Experience level

(Can add more filters if needed)

---

## 📱 Mobile Friendly

- Filter buttons responsive
- Touch-friendly buttons
- Wraps on small screens
- Banner adjusts width
- Works great on mobile

---

## 🐛 Troubleshooting

### **No jobs showing for "India"**
- Check API response has "india" in location
- Try "Remote" to see if filtering works
- Check job.candidate_required_location field

### **Wrong count showing**
- Refresh page
- Try different filter
- Clear filters and reset

### **Filter not working**
- Make sure jobs are loaded
- Check browser console for errors
- Try different job source

---

**Version**: 1.0
**Status**: Active & Working
**Last Updated**: April 2026
