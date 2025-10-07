# ⚡ Quick Start Guide - Integrated System

## 🎯 You're 3 Steps Away from Launch!

### Step 1: Configure Google Apps Script (5 minutes)

1. Open your FMS Google Spreadsheet
2. Click **Extensions** → **Apps Script**
3. Delete existing code
4. Copy entire contents of `Code.gs`
5. Update these two lines at the top:
   ```javascript
   const MASTER_SHEET_ID = 'YOUR_TASK_SHEET_ID_HERE';
   const CREDENTIALS_SHEET_ID = 'YOUR_TASK_SHEET_ID_HERE';
   ```
6. Click **Deploy** → **New deployment**
7. Choose **Web app**
8. Set access to **Anyone**
9. Click **Deploy**
10. **Copy the Web App URL**

### Step 2: Configure Frontend (2 minutes)

1. Create/update `.env` in project root:
   ```env
   VITE_APPS_SCRIPT_URL=YOUR_WEB_APP_URL_HERE
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Step 3: Run & Test (1 minute)

```bash
npm run dev
```

Open http://localhost:5173

**Login with**:
- Username: `admin`
- Password: `fms2024`

**Navigate to**: Task Management (in the menu)

**Try**:
- View Overview (should show 0 tasks)
- Click "Assign Task" tab
- Create your first task!

---

## 🎉 That's It!

Your integrated system is now running!

### What You Can Do Now:

1. **Assign Tasks**
   - Go to "Task Management" → "Assign Task"
   - Fill the form and submit

2. **Track Tasks**
   - View in different tabs (Upcoming, Due, All)
   - Complete or request revisions

3. **View Performance**
   - "Performance" tab for analytics
   - Select date range and load data

4. **Use Existing FMS**
   - All original features still work
   - Create FMS templates
   - Start projects
   - Track progress

---

## 📚 Need More Help?

- **Detailed Setup**: See `DEPLOYMENT_GUIDE.md`
- **Features Guide**: See `TASK_MANAGEMENT_INTEGRATION.md`
- **System Overview**: See `README_INTEGRATED_SYSTEM.md`
- **Complete Summary**: See `INTEGRATION_COMPLETE.md`

---

## 🐛 Something Not Working?

### Login Fails
- Check API URL in `.env`
- Verify credentials in Google Sheets
- Restart dev server: `npm run dev`

### Tasks Not Loading
- Check Sheet IDs in `Code.gs`
- Verify sheet names match exactly
- Check browser console (F12) for errors

### Email Not Sending
- Check email addresses in Credentials sheet (Column D)
- Verify Apps Script has Gmail permissions
- Check Gmail quota (500/day limit)

---

## 🎊 Success Indicators

✅ You're successful if:
- Login page loads
- Can login successfully
- Dashboard appears
- "Task Management" menu item visible
- Task Management page loads
- No errors in browser console

---

## 🚀 Next Steps After Testing

1. Add real users to Google Sheets
2. Deploy to production (see DEPLOYMENT_GUIDE.md)
3. Train your team
4. Start assigning real tasks
5. Monitor performance

---

**Need detailed instructions?** → `DEPLOYMENT_GUIDE.md`

**Want to understand how it works?** → `TASK_MANAGEMENT_INTEGRATION.md`

**Ready to deploy to production?** → Follow Step 5 in `DEPLOYMENT_GUIDE.md`

---

Built with ❤️ - Get started in under 10 minutes!

