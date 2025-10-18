# Deployment Guide for FMS Server on Render

This guide will walk you through deploying the FMS backend server on Render.

## Prerequisites

- GitHub repository with your code pushed
- Render account (sign up at https://render.com)

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Add separate server directory for deployment"
git push origin main
```

### 2. Create a New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository: `FMS-TO-DEPLOY`

### 3. Configure the Web Service

Use these settings:

| Setting | Value |
|---------|-------|
| **Name** | `fms-api-server` (or any name you prefer) |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `server` ⚠️ **IMPORTANT** |
| **Runtime** | `Node` |
| **Build Command** | `cd .. && npm install && npm run build && cd server && npm install` |
| **Start Command** | `npm start` |

### 4. Environment Variables

The following environment variables are automatically set via `render.yaml`:
- `NODE_ENV` = `production`
- `PORT` = `3000`

You can override these in the Render dashboard if needed.

### 5. Advanced Settings (Optional)

- **Health Check Path**: `/api` (already configured)
- **Auto-Deploy**: Enable to automatically deploy on git push

### 6. Deploy

Click **"Create Web Service"**

Render will:
1. Clone your repository
2. Navigate to the `server` directory
3. Build the frontend (from parent directory)
4. Install server dependencies
5. Start the server

### 7. Verify Deployment

Once deployed, your service will be available at:
```
https://your-service-name.onrender.com
```

Test the API:
```bash
curl https://your-service-name.onrender.com/api
```

You should see:
```json
{
  "message": "FMS Proxy Server is running! 🚀",
  "status": "active",
  "endpoints": {
    "GET /api": "This message",
    "GET /api/fms": "API info",
    "POST /api/fms": "Proxy to Google Apps Script"
  }
}
```

## Alternative: Using render.yaml

If you prefer automated configuration:

1. When creating the web service, Render will detect `render.yaml`
2. Set **Root Directory** to `server` in the dashboard
3. All other settings will be read from `server/render.yaml`

## Troubleshooting

### Build Fails with "Cannot find dist folder"

**Solution**: Make sure the build command includes:
```bash
cd .. && npm install && npm run build && cd server && npm install
```

This builds the frontend first, then installs server dependencies.

### Server starts but returns 404

**Problem**: The dist folder wasn't created or is in the wrong location.

**Solution**: 
- Verify the build command ran successfully
- Check build logs for errors during `npm run build`
- Ensure the frontend builds to `dist/` in the root directory

### CORS Errors

**Problem**: Frontend can't connect to the API.

**Solution**: Update your frontend API URL to point to:
```
https://your-service-name.onrender.com/api/fms
```

Update in `src/services/api.ts`:
```typescript
const API_URL = "https://your-service-name.onrender.com/api/fms";
```

### Large File Upload Fails

**Problem**: File uploads timeout or fail.

**Solution**:
- Maximum payload size is 10MB
- Uploads timeout after 60 seconds
- For larger files, consider direct Google Drive integration

## Post-Deployment

### Update Frontend API URL

After deployment, update your frontend to use the Render URL:

1. Open `src/services/api.ts`
2. Update the API URL:
```typescript
const API_URL = import.meta.env.VITE_API_URL || "https://your-service-name.onrender.com/api/fms";
```

3. Rebuild and redeploy frontend

### Monitor Your Service

- View logs: Render Dashboard → Your Service → Logs
- View metrics: Render Dashboard → Your Service → Metrics
- Set up alerts for downtime

## Free Tier Limitations

Render's free tier includes:
- ⚠️ Services spin down after 15 minutes of inactivity
- First request after spin-down will be slow (~30 seconds)
- 750 hours/month of runtime

**Recommendation**: Upgrade to paid plan for production use to avoid spin-down delays.

## Need Help?

- Check Render docs: https://render.com/docs
- View deployment logs in Render dashboard
- Check server logs for API errors

## Directory Structure

After deployment, your structure looks like:
```
/opt/render/project/src/
├── dist/                 # Built frontend (served by server)
├── server/              # Server directory (Root Directory)
│   ├── server.js        # Express server
│   ├── package.json     # Server dependencies
│   └── node_modules/    # Server dependencies
├── src/                 # Frontend source (not used in production)
└── package.json         # Frontend dependencies
```

The server in `server/` serves static files from `../dist/`.

