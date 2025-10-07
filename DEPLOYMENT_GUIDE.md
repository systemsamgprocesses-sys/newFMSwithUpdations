# 🚀 Quick Deployment Guide - Integrated FMS + Task Management

## Pre-Deployment Checklist

- [ ] Two Google Sheets prepared (one for FMS, one for Task Management)
- [ ] Google Apps Script access
- [ ] Node.js installed (v16 or higher)
- [ ] Git repository cloned

---

## Step 1: Prepare Google Sheets

### Sheet 1: FMS Database (Existing or New)

Create/verify these sheets in one spreadsheet:

1. **Users**
   ```
   Username | Password | Name | Role | Department | Last_Login
   admin    | fms2024  | Admin| Admin| Management | 
   ```

2. **FMS_MASTER**
   ```
   FMS_ID | FMS_Name | Step_No | WHAT | WHO | HOW | WHEN | When_Unit | When_Days | When_Hours | Created_By | Created_On | Last_Updated_By | Last_Updated_On
   ```

3. **FMS_PROGRESS**
   ```
   Project_ID | FMS_ID | Project_Name | Step_No | WHAT | WHO | HOW | Planned_Due_Date | Actual_Completed_On | Status | Completed_By | Is_First_Step | Created_By | Created_On | Last_Updated_By | Last_Updated_On
   ```

**Get FMS Spreadsheet ID**: From URL `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### Sheet 2: Task Management Database (New)

Create a new spreadsheet with these sheets:

1. **Credentials**
   ```
   User ID       | Password    | Department  | Email
   John Doe      | john@123    | IT          | john@example.com
   Jane Smith    | jane@123    | HR          | jane@example.com
   ```

2. **MASTER**
   ```
   Task Id | GIVEN BY | GIVEN TO | GIVEN TO USER ID | TASK DESCRIPTION | HOW TO DO- TUTORIAL LINKS (OPTIONAL) | DEPARTMENT | TASK FREQUENCY | PLANNED DATE | Task Status | Revision Date | Reason for Revision | completed on | BLANK | BLANK | BLANK | Revision Status & Log | Revision Count | Scoring Impact | On time or not? | Scoring
   ```
   (21 columns total - add 3 blank columns after "completed on")

3. **SCORING**
   (Same structure as MASTER - used for performance calculations)

**Get Task Management Spreadsheet ID**: From URL `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

---

## Step 2: Deploy Google Apps Script

### 2.1 Create Apps Script Project

1. Open the **FMS Spreadsheet**
2. Click **Extensions** > **Apps Script**
3. Delete default code
4. Copy entire contents of `Code.gs` from this project
5. Paste into Apps Script editor

### 2.2 Configure Sheet IDs

In the Apps Script code, update these lines at the top:

```javascript
const MASTER_SHEET_ID = 'YOUR_TASK_MANAGEMENT_SPREADSHEET_ID';
const CREDENTIALS_SHEET_ID = 'YOUR_TASK_MANAGEMENT_SPREADSHEET_ID';
```

**Important**: Both should be the same ID (your Task Management spreadsheet).

### 2.3 Deploy as Web App

1. Click **Deploy** button (top right)
2. Choose **New deployment**
3. Click gear icon ⚙️ next to "Select type"
4. Choose **Web app**
5. Configure:
   - **Description**: "FMS + Task Management API"
   - **Execute as**: Me (your-email@gmail.com)
   - **Who has access**: Anyone
6. Click **Deploy**
7. **Authorize access** (click Review Permissions)
8. Select your Google account
9. Click **Advanced** > "Go to [Your Project]"
10. Click **Allow**
11. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/ABC123.../exec`)

### 2.4 Test Deployment

Open the Web App URL in browser. You should see:
```json
{
  "status": "success",
  "message": "FMS + Task Management API is running"
}
```

---

## Step 3: Configure Frontend

### 3.1 Create Environment File

In your project root, create/update `.env`:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID_HERE/exec
```

Replace `YOUR_DEPLOYMENT_ID_HERE` with the ID from your Web App URL.

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Start Development Server

```bash
npm run dev
```

Application should open at `http://localhost:5173`

---

## Step 4: Initial Login & Testing

### 4.1 Test FMS Login

1. Navigate to `http://localhost:5173`
2. Login with:
   - **Username**: `admin`
   - **Password**: `fms2024`
3. Should redirect to Dashboard

### 4.2 Test Task Management

1. Click **Task Management** in navigation
2. You should see:
   - Overview with zero tasks
   - All tabs accessible
   - No errors in browser console

### 4.3 Assign First Task

1. Go to **Assign Task** tab
2. Fill form:
   - **Assign To**: Select a user from Credentials sheet
   - **Description**: "Test task"
   - **Department**: "IT"
   - **Planned Date**: Tomorrow's date
   - **Tutorial Links**: (leave empty)
3. Click **Assign Task**
4. Should see success message with Task ID (AT-1)
5. Check recipient's email for notification

### 4.4 Verify Task Appears

1. Go to **All Tasks** tab
2. Should see AT-1 in the list
3. Click **Complete** to test update
4. Go to **Overview** - completed count should increase

---

## Step 5: Production Build

### 5.1 Build for Production

```bash
npm run build
```

Creates optimized files in `dist/` folder.

### 5.2 Deploy to Hosting

Choose your hosting platform:

#### Option A: Vercel
```bash
npm install -g vercel
vercel
```

#### Option B: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Option C: GitHub Pages
1. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```
2. Push to GitHub
3. Enable GitHub Pages in repository settings

---

## Step 6: Configure Production Environment

### 6.1 Set Environment Variables

For Vercel/Netlify, add environment variable in dashboard:
- **Key**: `VITE_APPS_SCRIPT_URL`
- **Value**: Your Web App URL

### 6.2 Update CORS (if needed)

If you encounter CORS errors in production:

1. Open Apps Script
2. Add to top of doPost():
```javascript
function doPost(e) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  // ... rest of your code
}
```

---

## Step 7: Post-Deployment Tasks

### 7.1 Add Real Users

**FMS Users** (in FMS spreadsheet):
```
Username | Password | Name           | Role    | Department
john     | secure1  | John Smith     | Manager | Operations
jane     | secure2  | Jane Doe       | Lead    | IT
```

**Task Users** (in Task Management spreadsheet):
```
User ID    | Password | Department | Email
John Smith | secure1  | Operations | john@company.com
Jane Doe   | secure2  | IT         | jane@company.com
```

### 7.2 Configure Email Settings

Verify Gmail settings:
1. Apps Script uses your Gmail account
2. Daily limit: 500 emails
3. Test with real email addresses
4. Check spam folders if emails not received

### 7.3 Set Up Monitoring

Add to Apps Script for logging:
```javascript
function onError(error) {
  Logger.log('Error: ' + error);
  // Optional: Send email to admin
  GmailApp.sendEmail('admin@company.com', 'FMS Error', error.toString());
}
```

---

## Troubleshooting Common Issues

### Issue: "API URL not configured"

**Solution**: 
```bash
# Ensure .env file exists with correct URL
cat .env
# Should show: VITE_APPS_SCRIPT_URL=https://...

# Restart dev server
npm run dev
```

### Issue: Login fails

**Solution**:
1. Check credentials in Google Sheets
2. Verify sheet names exactly match: "Users" and "Credentials"
3. Check Apps Script execution logs
4. Ensure Web App is deployed with "Anyone" access

### Issue: Tasks not loading

**Solution**:
1. Verify MASTER sheet has all 21 columns
2. Check MASTER_SHEET_ID in Code.gs
3. Look for errors in browser console (F12)
4. Check Apps Script logs: View > Logs

### Issue: Email not sending

**Solution**:
1. Verify email addresses in Column D of Credentials sheet
2. Check Gmail quota (500/day)
3. Ensure Apps Script has Gmail permissions
4. Review Apps Script execution logs

### Issue: CORS error in production

**Solution**:
1. Redeploy Apps Script with updated CORS headers
2. Ensure Web App is deployed as "Anyone" access
3. Clear browser cache
4. Try in incognito mode

---

## Security Checklist

- [ ] Change default passwords
- [ ] Use strong passwords for all users
- [ ] Limit Apps Script access to required people
- [ ] Enable 2FA on Google account
- [ ] Regular backups of Google Sheets
- [ ] Monitor Apps Script execution logs
- [ ] Review email notification settings
- [ ] Set up SSL/HTTPS for production domain

---

## Backup Strategy

### Automated Backup (Recommended)

Create Apps Script trigger:
```javascript
function backupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backupFolder = DriveApp.getFolderById('YOUR_BACKUP_FOLDER_ID');
  ss.makeCopy('Backup ' + new Date().toISOString(), backupFolder);
}
```

Set daily trigger:
1. Apps Script > Triggers
2. Add Trigger
3. Function: backupSheets
4. Time-driven > Day timer > 2am-3am

---

## Performance Optimization

### For Large Datasets

1. **Enable Caching**:
```javascript
const cache = CacheService.getScriptCache();
const cachedData = cache.get('users');
if (cachedData) return JSON.parse(cachedData);
```

2. **Batch Operations**:
```javascript
// Instead of multiple getRange() calls
const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
```

3. **Index Sheets**: Add index column for faster lookups

---

## Success Metrics

After deployment, verify:

- [ ] Users can login from both systems
- [ ] Tasks can be assigned and appear in lists
- [ ] Email notifications are received
- [ ] Task status updates work
- [ ] Performance scoring loads correctly
- [ ] Mobile responsive design works
- [ ] All FMS features still functional
- [ ] No console errors
- [ ] Page load < 3 seconds

---

## Next Steps

1. **Train Users**: Share login credentials and quick guide
2. **Monitor Usage**: Check Apps Script quotas and logs
3. **Gather Feedback**: Ask users about experience
4. **Iterate**: Make improvements based on usage
5. **Scale**: Add more users and features as needed

---

## Support Resources

- **Google Apps Script Docs**: https://developers.google.com/apps-script
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev

---

## 🎉 Deployment Complete!

Your integrated FMS + Task Management system is now live!

Access at: `https://your-domain.com`

Questions? Check TASK_MANAGEMENT_INTEGRATION.md for detailed documentation.

