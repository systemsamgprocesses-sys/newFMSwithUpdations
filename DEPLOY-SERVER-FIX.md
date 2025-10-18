# 🚀 Server Fix Deployment Guide

## Problem Fixed
- ✅ Increased Express JSON payload limit from ~100KB → **10MB**
- ✅ Added URL-encoded payload support
- ✅ Increased request timeout to 60 seconds
- ✅ Added proper error handling and logging
- ✅ Added payload size validation

## Changes Made

### 1. `server.js`
- Increased `express.json()` limit to 10MB
- Added `express.urlencoded()` for form data
- Added request size logging
- Added 60-second timeout for large uploads
- Better error messages

### 2. `render.yaml` (NEW)
- Created Render configuration file
- Sets max request body size to 10MB
- Configures health checks and timeouts

### 3. `vercel.json`
- Added maxDuration: 60 seconds
- Increased memory to 1024MB

## 🔥 Deploy to Render (Your Current Platform)

### Option 1: Auto Deploy (if GitHub connected)
1. **Commit and push these changes:**
   ```bash
   git add server.js render.yaml vercel.json
   git commit -m "fix: Increase payload limit to 10MB for file uploads"
   git push origin main
   ```

2. **Render will auto-deploy** (if connected to GitHub)
   - Go to: https://dashboard.render.com
   - Check your service: `fms-api-server`
   - Watch the deploy logs

### Option 2: Manual Deploy
1. Go to Render Dashboard: https://dashboard.render.com
2. Find your service: `api-for-fms`
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait for deployment (2-5 minutes)

### Option 3: First Time Setup
If you haven't deployed yet:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "fix: Server payload limits for file uploads"
   git push origin main
   ```

2. **Create Render Service:**
   - Go to: https://dashboard.render.com/select-repo
   - Connect your GitHub repo
   - Render will detect `render.yaml` automatically
   - Click **"Apply"**

## 🧪 Testing After Deployment

1. **Check server is running:**
   ```bash
   curl https://api-for-fms.onrender.com/api
   ```
   Should return: `{"message": "FMS Proxy Server is running! 🚀", ...}`

2. **Check logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for: `🚀 FMS Proxy Server running on port 3000`
   - Should show: `📊 Max payload size: 10MB`

3. **Test file upload:**
   - Try uploading a file in your app
   - Check Render logs for: `📦 Request received: uploadFile | Size: X.XXmb`
   - Should see: `✅ Request completed: uploadFile`

## 🎯 What This Fixes

### Before:
- ❌ Express default limit: ~100KB-1MB
- ❌ Files > 1MB caused 413 errors
- ❌ No proper error messages
- ❌ Short timeouts

### After:
- ✅ Express limit: 10MB
- ✅ Files up to ~7-8MB supported (after base64 encoding)
- ✅ Clear error messages with file sizes
- ✅ 60-second timeout for large uploads
- ✅ Detailed logging for debugging

## 📊 File Size Limits

| Original File | Base64 Encoded | Server Accepts |
|---------------|----------------|----------------|
| 2MB           | ~2.7MB         | ✅ Yes         |
| 5MB           | ~6.7MB         | ✅ Yes         |
| 8MB           | ~10.7MB        | ❌ Too Large   |

**Recommended:** Keep files under 5MB for best performance.

## 🐛 Troubleshooting

### Still getting 413 errors?
1. Check Render logs: `https://dashboard.render.com`
2. Look for: `❌ Payload too large: X.XXmb`
3. If > 10MB, the file is too large even after optimization

### Render has its own limits?
- Render free tier: 512MB RAM
- Render paid tier: Can increase
- If still issues, consider:
  - Direct Google Drive API upload (skip proxy)
  - Chunked upload implementation
  - AWS S3 / Cloudflare R2 for files

### Google Apps Script timeout?
- Apps Script has 6-minute timeout limit
- For very large files, might hit this
- Solution: Use direct Drive API in future

## 🚀 Alternative: Deploy to Vercel

```bash
npm run deploy:vercel
```

Vercel config already updated with 60s timeout + 1024MB memory.

## 💡 Next Steps (Future Improvements)

1. **Direct Drive Upload:** Bypass proxy, upload directly from browser
2. **Chunked Upload:** Split large files into smaller chunks
3. **Progress Tracking:** Real-time upload progress
4. **Compression:** Compress files before upload
5. **CDN:** Use Cloudflare R2 or AWS S3 for large files

---

## ✅ Quick Deploy Checklist

- [ ] Commit changes: `git add . && git commit -m "fix: payload limits"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Wait for Render auto-deploy (~3 min)
- [ ] Check logs on Render dashboard
- [ ] Test file upload in app
- [ ] Verify in browser console (should see ✅ no 413 errors)

**Need help?** Check Render logs or DM me! 🔥

