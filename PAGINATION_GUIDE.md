# LinkedIn Jobs Pagination Guide

## 🎯 Pagination Features

### 1. **Infinite Scroll with Load More**
- ✅ Click "↓ Load More Jobs" button to load next batch
- ✅ Shows current page number and total jobs
- ✅ Smooth infinite scrolling experience
- ✅ Works on all sources (LinkedIn, Jobicy, etc.)

### 2. **Page Number Navigation**
- ✅ Navigate between pages using numbered buttons
- ✅ Previous/Next buttons for easy navigation
- ✅ Shows current page highlighted
- ✅ Max 5 page buttons visible at a time

### 3. **Pagination Info Display**
- Shows: "Showing X of Y jobs"
- Current page number in badge
- Total jobs count
- Has more indicator

---

## 📊 LinkedIn Jobs Pagination Details

### **Total Jobs Available**: 20 jobs
- **Jobs Per Page**: 5 jobs
- **Total Pages**: 4 pages
- **Pagination Type**: Both Load More + Page Numbers

### **Page Breakdown**
- **Page 1**: Jobs 1-5
- **Page 2**: Jobs 6-10
- **Page 3**: Jobs 11-15
- **Page 4**: Jobs 16-20

---

## 🔗 API Endpoints

### **Fetch LinkedIn Jobs with Pagination**

```bash
# Page 1 (default)
GET /api/jobs?source=linkedin&page=1

# Page 2
GET /api/jobs?source=linkedin&page=2

# Page 3
GET /api/jobs?source=linkedin&page=3

# With search term
GET /api/jobs?source=linkedin&search=engineer&page=1
```

### **API Response Format**

```json
{
  "jobs": [
    {
      "id": "linkedin-1",
      "title": "Senior Software Engineer",
      "company_name": "Google",
      "salary": "$180k–$220k",
      "location": "Remote",
      "url": "https://www.linkedin.com/jobs/view/1/",
      "description": "..."
    }
  ],
  "total": 20,
  "page": 1,
  "pageSize": 5,
  "totalPages": 4,
  "hasMore": true
}
```

---

## 🎮 UI Controls

### **Infinite Scroll Mode** (Default)
1. Scroll down to bottom of job list
2. Click "↓ Load More Jobs" button
3. Next 5 jobs load automatically
4. Page number updates in display

### **Page Navigation Mode**
1. Use Previous/Next buttons to navigate
2. Click page numbers (1, 2, 3, 4, 5) to jump
3. Current page highlighted in green
4. Jobs update instantly

---

## 💡 Features

✅ **Flexible Navigation**
- Load more as you scroll
- Direct page jumping
- Previous/Next navigation

✅ **Smart Loading**
- Only loads what you need
- Shows loading spinner while fetching
- Prevents duplicate jobs

✅ **User Feedback**
- Shows current page
- Shows total jobs count
- Shows loading state
- Disabled states when no more jobs

✅ **Mobile Friendly**
- Touch-friendly buttons
- Responsive pagination
- Fast loading

---

## 🔄 How It Works

### **Step 1: Initial Load**
```
GET /api/jobs?source=linkedin&page=1
→ Returns jobs 1-5 (hasMore: true)
```

### **Step 2: Load More Click**
```
GET /api/jobs?source=linkedin&page=2
→ Appends jobs 6-10 (hasMore: true)
```

### **Step 3: Continue Loading**
```
GET /api/jobs?source=linkedin&page=3
→ Appends jobs 11-15 (hasMore: true)
```

### **Step 4: Last Page**
```
GET /api/jobs?source=linkedin&page=4
→ Appends jobs 16-20 (hasMore: false)
→ Load More button disabled
```

---

## ⚙️ Configuration

### **Jobs Per Page**
Currently set to **5 jobs per page**

To change, modify `/app/api/jobs/route.ts`:
```typescript
const jobsPerPage = 5; // Change this number
```

### **Total Jobs**
Currently **20 LinkedIn jobs** available

To add more jobs, add to the `allLinkedInJobs` array in the API.

---

## 🚀 Usage Examples

### **Scenario 1: Infinite Scroll**
```
1. User opens job board
2. Sees first 5 LinkedIn jobs
3. Scrolls to bottom
4. Clicks "Load More Jobs"
5. Next 5 jobs appear
6. Repeat until all jobs loaded
```

### **Scenario 2: Direct Page Jump**
```
1. User opens job board
2. Sees first 5 LinkedIn jobs
3. Clicks page "3" button
4. Jobs 11-15 load instantly
5. Page number updates
```

### **Scenario 3: Previous/Next Navigation**
```
1. User on page 2 (jobs 6-10)
2. Clicks "Next →" button
3. Page 3 loads (jobs 11-15)
4. Clicks "← Previous" button
5. Back to page 2
```

---

## 🐛 Troubleshooting

### **Load More button not showing**
- Check if `hasMore` is true
- Verify total jobs > 20
- Check if showing saved jobs only (pagination hidden)

### **Page numbers not showing**
- Need at least 20+ total jobs
- Disabled when viewing saved jobs

### **Slow pagination**
- Check network speed
- API response time
- Browser performance

---

## 📈 Future Enhancements

- [ ] Dynamic jobs per page setting
- [ ] Cursor-based pagination (more efficient)
- [ ] Search-aware pagination
- [ ] Pagination history
- [ ] Jump to last page button
- [ ] Custom pagination size selector

---

**Version**: 1.0
**Last Updated**: April 2026
**Status**: Active & Working
