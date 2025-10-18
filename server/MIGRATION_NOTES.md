# Server Directory Migration Notes

## What Changed?

The server code has been moved into a dedicated `server/` directory for cleaner deployment and better separation of concerns.

## Changes Made

### 1. New Directory Structure

```
FMS-TO-DEPLOY/
├── server/                    # 🆕 NEW: Separate server directory
│   ├── server.js             # Express server (moved & updated)
│   ├── package.json          # Server-only dependencies
│   ├── render.yaml           # Render deployment config
│   ├── .gitignore           # Server-specific ignores
│   ├── README.md            # Server documentation
│   ├── DEPLOYMENT_GUIDE.md  # Deployment instructions
│   └── MIGRATION_NOTES.md   # This file
├── dist/                     # Built frontend (served by server)
├── src/                      # Frontend source code
├── server.js                 # ⚠️ OLD: Can be removed
├── render.yaml               # ⚠️ DEPRECATED: Use server/render.yaml
└── ...
```

### 2. Updated Files

#### `server/server.js`
- Updated static file paths: `path.join(__dirname, 'dist')` → `path.join(__dirname, '..', 'dist')`
- Updated SPA fallback path to `'..', 'dist', 'index.html'`
- Default PORT is 3000 (can be overridden by environment variable)

#### `server/package.json`
- **New file**: Contains only server dependencies
- Dependencies: `express`, `cors`, `node-fetch`
- DevDependencies: `nodemon`
- Scripts: `start`, `dev`

#### `server/render.yaml`
- **New file**: Deployment configuration for Render
- Build command builds frontend first, then installs server dependencies
- Uses `server` as root directory

### 3. Old Files

#### Root `server.js`
- ⚠️ **Can be removed** - replaced by `server/server.js`
- Kept for now for reference

#### Root `render.yaml`
- ⚠️ **DEPRECATED** - marked with warning comments
- Use `server/render.yaml` instead

## Why These Changes?

### Benefits

1. **Cleaner Deployment**
   - Only deploy what's needed for the server
   - Smaller deployment size
   - Faster builds

2. **Separation of Concerns**
   - Frontend and backend are clearly separated
   - Independent dependency management
   - Easier to maintain

3. **Better Organization**
   - Server code is self-contained
   - Clear deployment documentation
   - Professional project structure

4. **Flexible Deployment**
   - Can deploy frontend and backend separately
   - Can use different hosting services
   - Easier to scale

## Migration for Existing Deployments

If you already have a deployment on Render:

### Option 1: Update Existing Service

1. Go to your Render dashboard
2. Select your service
3. Go to **Settings**
4. Update **Root Directory** to `server`
5. The new `server/render.yaml` will be detected
6. Trigger a manual deploy

### Option 2: Create New Service

1. Create a new Web Service on Render
2. Connect your repository
3. Set **Root Directory** to `server`
4. Follow instructions in `DEPLOYMENT_GUIDE.md`
5. Delete the old service after testing

## Files You Can Delete (Optional)

After confirming everything works:

- `/server.js` (root) - replaced by `server/server.js`
- `/render.yaml` (root) - replaced by `server/render.yaml`

⚠️ **Important**: Test your deployment first before deleting these files!

## Next Steps

1. ✅ Review the changes in this document
2. ✅ Read `server/DEPLOYMENT_GUIDE.md`
3. ✅ Test locally: `cd server && npm install && npm start`
4. ✅ Deploy to Render following the guide
5. ✅ Update frontend API URL with your new server URL
6. ✅ Test the full application
7. ✅ Clean up old files (optional)

## Need Help?

- Deployment issues? Check `server/DEPLOYMENT_GUIDE.md`
- Server issues? Check `server/README.md`
- General issues? Check root `README.md`

## Summary

| Before | After |
|--------|-------|
| Server files in root | Server files in `server/` |
| Mixed dependencies | Separate dependencies |
| Single render.yaml | Dedicated server/render.yaml |
| Manual path management | Organized structure |

The migration improves project organization and makes deployment more straightforward!

