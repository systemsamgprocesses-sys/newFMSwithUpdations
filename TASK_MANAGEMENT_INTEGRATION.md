# Task Management System - Integration Documentation

## 🎉 Overview

This document describes the **complete integration** of the Task Management System into your existing FMS (Flow Management System) application. The integration is fully functional and preserves all existing FMS functionality while adding powerful new task management capabilities.

## 📋 What's Been Added

### 1. **Comprehensive Google Apps Script Backend** (`Code.gs`)

A unified backend that handles both FMS and Task Management operations:

#### FMS Features (Existing - Preserved)
- ✅ User authentication and management
- ✅ FMS template creation and retrieval
- ✅ Project creation and tracking
- ✅ Task status updates
- ✅ Activity logs

#### Task Management Features (New)
- ✅ Task assignment with auto-generated IDs (AT-1, AT-2, etc.)
- ✅ Email notifications on task assignment
- ✅ Task filtering (pending, completed, revisions, upcoming)
- ✅ Task status updates (complete, revise)
- ✅ Performance scoring system
- ✅ Date-based filtering and analytics

### 2. **Frontend Integration**

#### New Types (`src/types/index.ts`)
```typescript
- TaskUser          // User info for task assignment
- TaskData          // Complete task information
- TaskSummary       // Dashboard summary counts
- AssignTaskRequest // Task creation payload
- ScoringData       // Performance metrics
```

#### New API Endpoints (`src/services/api.ts`)
```typescript
- getTaskUsers()         // Get users for assignment
- assignTask()           // Create new task
- getTasks()             // Get tasks with filtering
- getTaskSummary()       // Get dashboard counts
- updateTask()           // Update task status
- batchUpdateTasks()     // Bulk updates
- getScoringData()       // Get performance data
```

#### New Page Component (`src/pages/TaskManagement.tsx`)
A comprehensive task management interface with:
- 📊 **Overview Tab**: Dashboard with task counts
- 📅 **Upcoming Tab**: Future tasks
- ⏰ **Due Tasks Tab**: Current and overdue tasks
- 📝 **All Tasks Tab**: Complete task list
- ✏️ **Revisions Tab**: Tasks requiring revision
- ➕ **Assign Task Tab**: Create and assign new tasks
- 📈 **Performance Tab**: Scoring and analytics

#### Updated Components
- **Layout**: Added "Task Management" navigation item
- **App.tsx**: Added `/tasks` route

## 🔧 Setup Instructions

### Step 1: Update Google Sheets IDs in Code.gs

Open `Code.gs` and update these constants with your actual Google Sheets IDs:

```javascript
const MASTER_SHEET_ID = 'YOUR_MASTER_SHEET_ID';
const CREDENTIALS_SHEET_ID = 'YOUR_CREDENTIALS_SHEET_ID';
```

### Step 2: Google Sheets Structure

#### Sheet 1: MASTER (Task Management)
Columns:
- Task Id
- GIVEN BY
- GIVEN TO
- GIVEN TO USER ID
- TASK DESCRIPTION
- HOW TO DO- TUTORIAL LINKS (OPTIONAL)
- DEPARTMENT
- TASK FREQUENCY
- PLANNED DATE (dd/MM/yyyy)
- Task Status
- Revision Date
- Reason for Revision
- completed on
- (3 BLANK columns)
- Revision Status & Log
- Revision Count
- Scoring Impact
- On time or not?
- Scoring

#### Sheet 2: SCORING (Performance Analytics)
Same structure as MASTER, used for performance calculations.

#### Sheet 3: Credentials (User Authentication)
Columns:
- User ID
- Password
- Department
- Email

#### Sheet 4: Users (FMS Users - Existing)
Columns:
- Username
- Password
- Name
- Role
- Department
- Last_Login

#### Sheet 5: FMS_MASTER (Existing)
Your existing FMS template storage.

#### Sheet 6: FMS_PROGRESS (Existing)
Your existing FMS project tracking.

### Step 3: Deploy Google Apps Script

1. Open Google Apps Script Editor (Extensions > Apps Script)
2. Replace all code with the contents of `Code.gs`
3. Click **Deploy** > **New deployment**
4. Choose **Web app**
5. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy**
7. **Copy the Web App URL**

### Step 4: Configure Frontend

Update your `.env` file:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Replace `YOUR_DEPLOYMENT_ID` with the actual ID from your deployment URL.

### Step 5: Install Dependencies & Run

```bash
npm install
npm run dev
```

## 🚀 Features Guide

### Task Assignment

1. Navigate to **Task Management** > **Assign Task**
2. Fill in the form:
   - **Assign To**: Select user from dropdown
   - **Description**: Task details
   - **Department**: Optional department name
   - **Planned Date**: Due date
   - **Tutorial Links**: Optional help resources
3. Click **Assign Task**
4. Email notification sent automatically to assignee

### Task Tracking

**Overview Tab**: Quick dashboard showing:
- Upcoming tasks (future due dates)
- Due tasks (today or past due)
- Completed tasks
- Revisions requested
- Overdue count

**Filtered Views**:
- **Upcoming**: Tasks with future due dates
- **Due Tasks**: Tasks due today or overdue
- **All Tasks**: Complete task list
- **Revisions**: Tasks marked for revision

### Task Updates

For pending tasks, you can:

1. **Complete**: Mark task as done
   - Automatically records completion time
   - Calculates "On Time" or "Not On Time"
   
2. **Request Revision**: Request changes
   - Optionally set new due date
   - Add revision reason
   - Task status changes to "Revise"

### Performance Scoring

1. Navigate to **Task Management** > **Performance**
2. Select date range (defaults to current week)
3. Click **Load**
4. View comprehensive metrics:
   - Total tasks in period
   - Completion rate
   - On-time vs late completions
   - Revision statistics
   - Final performance score (%)

### Search & Filters

All task list views include:
- **Search bar**: Filter by Task ID or description
- **Department filter**: Filter by department
- Real-time filtering as you type

## 🔄 How It Works

### Login Flow

1. User enters credentials
2. System checks **FMS Users sheet** first
3. If not found, checks **Task Management Credentials sheet**
4. Returns user info with department and role

### Task Assignment Flow

1. User fills assignment form
2. Backend generates next Task ID (e.g., AT-47)
3. Task saved to **MASTER sheet** with status "Pending"
4. System looks up assignee email from **Credentials sheet**
5. Sends formatted HTML email notification
6. Returns success with Task ID

### Task Update Flow

**Complete**:
1. Status → "Completed"
2. Records completion timestamp
3. Compares with planned date
4. Sets "On Time" or "Not On Time"

**Revise**:
1. Status → "Revise"
2. Saves new date (if provided)
3. Records revision reason

### Scoring Calculation

1. Queries **SCORING sheet** for user's tasks in date range
2. Counts:
   - Total tasks
   - Completed (on time / not on time)
   - Due but not completed
   - Revisions taken
   - Score impacts
3. Calculates final percentage score

## 📧 Email Notifications

Automated email sent on task assignment with:
- AMG logo header
- Task ID
- Assigned by
- Department
- Description
- Due date
- Tutorial links
- Professional HTML formatting

## 🎨 UI/UX Features

- **Responsive Design**: Works on mobile, tablet, desktop
- **Status Badges**: Color-coded task status
- **Real-time Updates**: Instant feedback on actions
- **Loading States**: Spinners during API calls
- **Error Handling**: Clear error messages
- **Success Notifications**: Confirmation messages
- **Modal Dialogs**: Clean task update interface
- **Keyboard Navigation**: Accessible forms

## 🔒 Security Features

- ✅ Authentication required for all operations
- ✅ User-specific task visibility
- ✅ Input validation on frontend and backend
- ✅ Secure password handling
- ✅ CORS-enabled API
- ✅ Error logging for debugging

## 🐛 Troubleshooting

### Issue: Tasks not loading
**Solution**: 
1. Check Google Sheets IDs in Code.gs
2. Verify MASTER sheet has correct column headers
3. Check browser console for errors

### Issue: Email notifications not sending
**Solution**:
1. Verify email addresses in Credentials sheet (Column D)
2. Check Gmail quota (500 emails/day limit)
3. Review Apps Script execution logs

### Issue: Scoring not calculating
**Solution**:
1. Ensure SCORING sheet exists
2. Verify column positions match code
3. Check date formats (dd/MM/yyyy in sheets)

### Issue: Login fails
**Solution**:
1. Verify credentials in both Users and Credentials sheets
2. Check Apps Script deployment is accessible
3. Confirm API URL in .env file

## 📊 Date Format Handling

The system handles two date formats:

1. **Google Sheets**: `dd/MM/yyyy` (e.g., "25/12/2024")
2. **Frontend/API**: `yyyy-MM-dd` (ISO format)

Automatic conversion happens in:
- `parseDMYDate()`: Sheets → JavaScript Date
- `formatDateToISO()`: Date → Frontend
- `formatDateForSheet()`: Date → Sheets

## 🔄 Data Flow

```
User Action (Frontend)
    ↓
API Call (src/services/api.ts)
    ↓
Google Apps Script (Code.gs)
    ↓
Google Sheets (Database)
    ↓
Response (JSON)
    ↓
UI Update (React Component)
```

## 🎯 Key Differences from Original user.html

### Preserved Features
- ✅ All task management functionality
- ✅ Performance scoring
- ✅ Email notifications
- ✅ Auto-generated Task IDs
- ✅ Status tracking
- ✅ Date-based filtering

### Improvements
- 🎨 Modern React UI instead of vanilla HTML/JS
- 📱 Fully responsive design
- 🔄 Integrated with existing FMS system
- 🎨 Consistent styling with FMS
- 🔐 Unified authentication
- 📊 Better error handling
- ⚡ Improved performance with React

## 📚 Testing Checklist

- [ ] Login with FMS user
- [ ] Login with Task Management user
- [ ] View task overview
- [ ] Assign new task
- [ ] Receive email notification
- [ ] View upcoming tasks
- [ ] View due tasks
- [ ] Complete a task
- [ ] Request task revision
- [ ] View performance score
- [ ] Search tasks
- [ ] Filter by department
- [ ] Check mobile responsiveness

## 🆘 Support

If you encounter issues:

1. Check browser console (F12)
2. Review Google Apps Script logs (View > Logs)
3. Verify all sheet structures match documentation
4. Confirm API URL is correct in .env
5. Test with simple data first

## 🎉 Success!

Your FMS system now includes a complete task management system with:
- ✅ Task assignment and tracking
- ✅ Email notifications
- ✅ Performance analytics
- ✅ Unified user management
- ✅ Beautiful, responsive UI
- ✅ All existing FMS features intact

Navigate to **/tasks** in your application to start using the new features!

