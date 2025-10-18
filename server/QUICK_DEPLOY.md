# 🚀 Quick Deploy Reference

Super quick reference for deploying to Render.

## Prerequisites

- Code pushed to GitHub
- Render account created

## Deploy Commands

### 1. Push to GitHub

```bash
git add .
git commit -m "Add separate server directory for deployment"
git push origin main
```

### 2. Render Dashboard Settings

| Setting | Value |
|---------|-------|
| Root Directory | `server` |
| Build Command | `cd .. && npm install && npm run build && cd server && npm install` |
| Start Command | `npm start` |
| Environment | `NODE_ENV=production` |

### 3. Test Locally First

```bash
# From project root
cd server
npm install
npm start

# Server runs on http://localhost:3000
# Test: http://localhost:3000/api
```

## Deploy Steps (2 Minutes)

1. **Render Dashboard** → New Web Service
2. **Connect** your GitHub repo
3. **Set Root Directory** to `server`
4. **Deploy** (automatic from render.yaml)

## After Deployment

Update `src/services/api.ts`:

```typescript
const API_URL = "https://YOUR-SERVICE-NAME.onrender.com/api/fms";
```

## Test Deployment

```bash
# Health check
curl https://YOUR-SERVICE-NAME.onrender.com/api

# Frontend
# Visit: https://YOUR-SERVICE-NAME.onrender.com
```

## Common Issues

| Issue | Fix |
|-------|-----|
| "Cannot find dist" | Root Directory must be `server` |
| 404 on all routes | Frontend didn't build, check logs |
| CORS errors | Update API_URL in frontend |
| Slow first request | Free tier spins down after 15min |

## File Structure

```
Your Project/
├── server/           ← Deploy this directory
│   ├── server.js
│   ├── package.json
│   └── render.yaml
└── dist/            ← Built by frontend build
```

## Need More Details?

- Full guide: `DEPLOYMENT_GUIDE.md`
- Server docs: `README.md`
- What changed: `MIGRATION_NOTES.md`

---

**That's it! Deploy takes ~2 minutes.** 🎉

