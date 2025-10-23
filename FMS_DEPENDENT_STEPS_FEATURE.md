# FMS Dependent Steps Feature - Complete Implementation

## Overview
This feature allows FMS steps to be dependent on the completion of previous steps. When a dependent step's predecessor is completed, the system prompts the user to provide a planned date for the dependent step via a modal dialog.

## Key Features

### 1. **All Steps Created at Project Start**
- When a project is created, ALL steps are now created in FMS_PROGRESS immediately
- No more creating steps one-by-one as previous steps complete
- This allows visibility of all steps from the beginning

### 2. **Step Types**
- **Step 1**: Always "Fixed" duration (calculated from project start date)
- **Step 2+**: Can be either:
  - **Fixed Duration**: Calculated date based on project start + cumulative duration
  - **Dependent**: Awaits planned date from previous step completion

### 3. **Dependent Step Status**
- Dependent steps show:
  - **Status**: "Awaiting Date"
  - **Planned Date**: "Pending to be planned"
- When the previous step completes, a modal prompts for the planned date
- After date is set:
  - **Status**: Changes to "Pending"
  - **Planned Date**: Set to the provided date

### 4. **Smart UI Behavior**
- **CreateFMS**: Radio buttons to select "Fixed Duration" or "Dependent on Previous Step"
- **Dashboard**: Modal appears when completing a step with dependent next steps
- **Validation**: Dependent option disabled if previous step has multiple assignees

## How It Works

### Creating an FMS with Dependent Steps

1. Go to **Create FMS** page
2. Add steps to your FMS
3. For **Step 2 and onwards**:
   - You'll see "Timing Type" section
   - Choose between:
     - **Fixed Duration**: Set a specific duration (days/hours)
     - **Dependent on Previous Step**: No duration needed

### Example FMS Creation:
```
FMS: "Website Development"
├── Step 1: "Design Mockups" (Fixed: 5 days)
├── Step 2: "Client Approval" (Dependent on Step 1)
├── Step 3: "Frontend Development" (Dependent on Step 2)
└── Step 4: "Testing" (Fixed: 3 days)
```

### Starting a Project

When you start a project:
- **All 4 steps** are created in FMS_PROGRESS
- **Step 1**: Status = "Pending", Planned Date = Project Start + 5 days
- **Step 2**: Status = "Awaiting Date", Planned Date = "Pending to be planned"
- **Step 3**: Status = "Awaiting Date", Planned Date = "Pending to be planned"
- **Step 4**: Status = "Pending", Planned Date = Project Start + 5 days + 3 days

### Completing Steps with Dependent Next Steps

**Scenario**: Completing Step 1 (which has dependent Step 2)

1. Click **"Complete"** on Step 1
2. **Modal appears** showing:
   - "Task completed successfully!"
   - "The next step depends on the completion of this step"
   - Step 2 details: Project name, step description, assignee
   - **Date input**: "Planned Date *" (required)

3. Enter planned date for Step 2 (e.g., 2025-11-15)
4. Click **"Submit Date"**
5. System updates:
   - Step 2 status changes to "Pending"
   - Step 2 planned date = 2025-11-15
   - Dashboard refreshes

6. Step 2 now appears in the assignee's task list as "Pending"

## Technical Implementation

### Backend (Code.gs)

#### 1. Modified `createProject()` function
```javascript
// Creates ALL steps at project start
for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
  const step = steps[stepIndex];
  
  if (step.whenType === 'dependent') {
    plannedDueDate = 'Pending to be planned';
    status = 'Awaiting Date';
  } else {
    // Calculate planned date based on cumulative duration
    plannedDueDate = cumulativeDate.toISOString();
    status = 'Pending';
  }
  
  progressSheet.appendRow([...rowData]);
}
```

#### 2. Updated `updateTaskStatus()` function
```javascript
// After completing a step, check for dependent next steps
if (status === 'Done') {
  // Find next step in progress sheet
  const nextStepInfo = progressData.find(row => 
    row.projectId === projectId && 
    row.stepNo === currentStepNo + 1
  );
  
  if (nextStepInfo && nextStepInfo.whenType === 'dependent') {
    // Return dependent step info for modal
    return {
      success: true,
      dependentStep: {
        projectId, projectName, stepNo, what, who, rowIndex
      }
    };
  }
}
```

#### 3. Added `updateFMSStepPlannedDate()` function
```javascript
function updateFMSStepPlannedDate(projectId, stepNo, plannedDate) {
  // Find the step in FMS_PROGRESS
  // Update Planned_Due_Date column
  // Change Status from "Awaiting Date" to "Pending"
  return { success: true };
}
```

#### 4. Added API endpoint
- Case: `'updateFMSStepPlannedDate'`
- Params: `{ projectId, stepNo, plannedDate }`

### Frontend

#### 1. Updated Types (src/types/index.ts)
```typescript
export interface DependentFMSStep {
  projectId: string;
  projectName: string;
  stepNo: number;
  what: string;
  who: string;
  rowIndex: number;
}
```

#### 2. Added API Method (src/services/api.ts)
```typescript
async updateFMSStepPlannedDate(
  projectId: string, 
  stepNo: number, 
  plannedDate: string
) {
  return callAppsScript('updateFMSStepPlannedDate', {
    projectId, stepNo, plannedDate
  });
}
```

#### 3. Updated Dashboard.tsx
- Added state for dependent step modal
- Modified `completeTaskDirectly()` to check for `result.dependentStep`
- Added `handleDependentStepSubmit()` handler
- Created modal UI for setting dependent step planned date

#### 4. CreateFMS.tsx (Already Implemented!)
- Radio buttons for "Fixed Duration" vs "Dependent on Previous Step"
- Duration inputs shown only for fixed steps
- Warning message when dependent is selected
- Smart validation (disables dependent if previous step has multiple assignees)

## User Experience Flow

### Scenario: 2-Step FMS

**FMS Setup:**
- Step 1: "Review Document" (Fixed: 2 days)
- Step 2: "Approval" (Dependent on Step 1)

**Project Created:**
```
Project: "Contract Review #123"
├── Step 1: Status="Pending", Planned Date="2025-11-05"
└── Step 2: Status="Awaiting Date", Planned Date="Pending to be planned"
```

**User Dashboard:**
- User sees Step 1 as a pending task
- User does NOT see Step 2 yet (status is "Awaiting Date")

**User Completes Step 1:**
1. Click "Complete" button
2. **Modal appears:**
   ```
   ┌─────────────────────────────────────────┐
   │ Set Planned Date for Dependent Step [X]│
   ├─────────────────────────────────────────┤
   │ ✓ Task completed successfully!         │
   │   The next step depends on completion   │
   │                                          │
   │ Project: Contract Review #123           │
   │ Step 2: Approval                        │
   │ Assigned To: manager@company.com        │
   │                                          │
   │ 📅 Planned Date * [2025-11-07]         │
   │                                          │
   │        [Cancel] [Submit Date]           │
   └─────────────────────────────────────────┘
   ```
3. User enters date: 2025-11-07
4. Click "Submit Date"
5. System updates Step 2:
   - Status: "Pending"
   - Planned Date: "2025-11-07"
6. Success message: "Task completed and dependent step date updated successfully!"
7. Dashboard refreshes
8. Manager now sees Step 2 in their dashboard with planned date

## Benefits

### 1. **Flexible Workflow Planning**
- Support both fixed-schedule and flexible-schedule workflows
- Realistic project timelines (some steps can't be planned until predecessor completes)

### 2. **Better Task Visibility**
- All steps visible in FMS_PROGRESS from day 1
- Clear status indicators ("Awaiting Date" vs "Pending")
- No surprise tasks appearing unexpectedly

### 3. **Improved Communication**
- Forces explicit date setting for dependent steps
- Person completing a step sets expectations for next person
- Reduces delays and miscommunication

### 4. **Smart Validation**
- Prevents dependent steps after multi-assignee steps
- Clear error messages and warnings
- Intuitive UI for step configuration

## Important Notes

### Limitation: Multi-Assignee Previous Steps
If Step 1 has multiple assignees (e.g., Alice AND Bob both need to complete it):
- Step 2 **cannot** be dependent
- Why? It's unclear when to prompt for the planned date:
  - When first person completes?
  - When last person completes?
- Solution: Use "Fixed Duration" instead

### Status Meanings
- **Pending**: Has a planned date, waiting to be worked on
- **In Progress**: Currently being worked on
- **Done**: Completed
- **Awaiting Date**: Dependent step waiting for predecessor completion

### Planned Date Display
- Fixed steps: ISO date (e.g., "2025-11-05T10:30:00.000Z")
- Dependent steps (before completion): "Pending to be planned"
- After setting date: ISO date

## Testing Guide

### Test Case 1: Create FMS with Dependent Steps
1. Go to Create FMS
2. Add 3 steps:
   - Step 1: Fixed (2 days)
   - Step 2: Dependent
   - Step 3: Fixed (1 day)
3. Submit FMS
4. Verify mermaid diagram shows "Dependent on prev" for Step 2

### Test Case 2: Start Project
1. Start a project from the FMS
2. Go to Dashboard
3. Verify:
   - Step 1 shows with planned date
   - Step 2 NOT visible (or shows "Awaiting Date")
   - Step 3 shows with planned date

### Test Case 3: Complete Step with Dependent Next Step
1. Complete Step 1
2. Verify modal appears
3. Enter planned date
4. Click Submit
5. Verify:
   - Success message appears
   - Dashboard refreshes
   - Step 2 now shows with planned date
   - Step 2 assignee sees it in their dashboard

### Test Case 4: Multi-Assignee Validation
1. Create FMS
2. Set Step 1 with multiple assignees
3. Verify Step 2 shows warning about dependent being disabled
4. Verify "Dependent" radio is disabled
5. Can only select "Fixed Duration"

## Troubleshooting

### Issue: Modal not appearing after completing step
**Check:**
- Is the next step marked as "dependent" in FMS?
- Does the next step have status "Awaiting Date"?
- Check browser console for errors

### Issue: Can't select "Dependent" option
**Cause:** Previous step has multiple assignees
**Solution:** Use "Fixed Duration" instead

### Issue: All steps show "Pending to be planned"
**Check:** Did you mark all steps as dependent? Only step 2+ should be dependent, and usually not all of them.

### Issue: Dependent step not showing in dashboard after setting date
**Check:**
- Was the date set successfully? (check for success message)
- Refresh the dashboard
- Check FMS_PROGRESS sheet - status should be "Pending"

## Summary

This feature provides a powerful and flexible way to manage FMS workflows with dependencies. It combines the benefits of:
- **Forward planning**: All steps visible from the start
- **Flexibility**: Dates can be set based on actual completion times
- **Clear communication**: Explicit date-setting prompts
- **Smart validation**: Prevents invalid configurations

The feature is fully implemented across:
- ✅ Backend (Code.gs)
- ✅ Frontend Types
- ✅ API Layer
- ✅ Dashboard UI
- ✅ CreateFMS UI

**Ready to use!** Just deploy the updated Code.gs to Google Apps Script.

