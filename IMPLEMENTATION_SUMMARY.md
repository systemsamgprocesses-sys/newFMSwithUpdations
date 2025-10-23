# Multiple WHO and Dependent Timing Feature - Implementation Summary

## What Has Been Completed ✅

### 1. Type Definitions (`src/types/index.ts`) ✅
- Updated `FMSStep` interface to support:
  - `who`: Can now be `string | string[]` (array of user IDs)
  - `whenType`: Added `'fixed' | 'dependent'` option for timing
- Updated `ProjectTask` interface:
  - `who`: Can now be `string | string[]`
  - `status`: Added `'Awaiting Date'` for dependent steps
  - `completedBy`: Can now be `string | string[]`
  - `completionsByUser`: Added `{[userId: string]: string}` to track each user's completion
  - `whenType`: Added `'fixed' | 'dependent'`

### 2. Create FMS UI (`src/pages/CreateFMS.tsx`) ✅
- Changed WHO field from single-select to multi-select
- Users can now select multiple people for a step
- Shows selected users as removable chips below the dropdown
- Added "Timing Type" selector for steps 2 onwards:
  - Radio buttons: "Fixed Duration" vs "Dependent on Previous Step"
  - Only step 1 must have fixed duration
  - Steps with dependent timing show warning message
  - Duration fields only show when "Fixed Duration" is selected
- Updated diagram generation to handle multiple WHOs
- Updated form validation to handle WHO as array

### 3. Start Project UI (`src/pages/StartProject.tsx`) ✅
- Added informational notes about:
  - Multiple responsible persons
  - Timing-dependent steps
  - Date setting for dependent steps

### 4. Backend - Sheet Structure (`Code.gs`) ✅
- Updated `FMS_MASTER` sheet header to include:
  - `When_Type` column (column 18)
- Updated `FMS_PROGRESS` sheet header to include:
  - `When_Type` column (column 20)
  - `Completed_By_Users` column (column 21) for tracking multi-WHO completions

### 5. Backend - FMS Creation (`Code.gs`) ✅
- Updated `createFMS` function to:
  - Store WHO as JSON array if multiple users selected
  - Store `whenType` ('fixed' or 'dependent')
  - Handle both string and array formats for WHO

### 6. Backend - Project Creation (`Code.gs`) ✅
- Updated `createProject` function to:
  - Parse WHO from JSON if stored as array
  - Read `whenType` from FMS_MASTER
  - Store WHO and whenType in FMS_PROGRESS for first step
  - Initialize `Completed_By_Users` column

## What Still Needs Implementation ⚠️

### 1. Backend - Task Completion Logic (`Code.gs` - `updateTaskStatus` function)
**CRITICAL - This is the most complex part**

The `updateTaskStatus` function needs complete rewrite to:

#### For Multi-WHO Tasks:
```javascript
// When a user completes a task:
1. Check if WHO is an array (multi-WHO task)
2. If YES:
   a. Parse Completed_By_Users JSON (or initialize as {})
   b. Add current user's completion: { userId: timestamp }
   c. Check if ALL WHO users have completed
   d. If NOT all complete:
      - Update Completed_By_Users column
      - Keep status as "In Progress"
      - Return success with message "Task marked complete for you. Waiting for others..."
   e. If ALL complete:
      - Set status to "Done"
      - Set Actual_Completed_On to latest completion time
      - Proceed to create next step
3. If NO (single WHO):
   - Complete task immediately as before
```

#### For Creating Next Step with Dependent Timing:
```javascript
// When creating next step after current completes:
1. Read next step's whenType from FMS_MASTER
2. If whenType === 'fixed':
   - Calculate planned date (existing logic)
   - Set status to "Pending"
   - Create step normally
3. If whenType === 'dependent':
   - Do NOT calculate planned date
   - Set Planned_Due_Date to empty string or special marker
   - Set status to "Awaiting Date"
   - Add note/flag that date needs to be set
```

### 2. Frontend - Dashboard Task Display (`src/pages/Dashboard.tsx`)
**IN PROGRESS**

#### Display Multi-WHO Tasks:
```typescript
// In task display:
1. Check if task.who is array
2. If YES:
   - Display all assigned users (comma-separated or badges)
   - Show completion status per user if available
   - Example: "John (✓), Mary (pending), Bob (pending)"
3. Show appropriate messaging based on completion status
```

#### Complete Button Logic:
```typescript
// When clicking Complete:
1. Check if WHO is array
2. If YES and current user is in the array:
   - Check if user already completed
   - If yes: Show "You already completed this"
   - If no: Call API to record completion
3. Show feedback: "Task completed. Waiting for N other(s)"
```

### 3. Frontend - Set Planned Date Modal (`src/pages/Dashboard.tsx`)
**NEW COMPONENT NEEDED**

When a task with dependent next step completes, show modal:
```typescript
// Modal appears automatically or via notification
<SetPlannedDateModal
  nextStepDetails={...}
  onDateSet={(date) => {
    // Call API to update next step's planned date
    // Change status from "Awaiting Date" to "Pending"
  }}
/>
```

### 4. New Backend Function - Set Planned Date
**NEW FUNCTION NEEDED in Code.gs**

```javascript
function setPlannedDateForDependentStep(params) {
  // params: { rowIndex, plannedDate, username }
  
  try {
    const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
    const validRowIndex = parseInt(params.rowIndex);
    
    // Validate step is in "Awaiting Date" status
    const currentStatus = progressSheet.getRange(validRowIndex, 10).getValue();
    if (currentStatus !== 'Awaiting Date') {
      return { success: false, message: 'Step is not awaiting date' };
    }
    
    // Set planned date
    progressSheet.getRange(validRowIndex, 8).setValue(params.plannedDate);
    
    // Change status to Pending
    progressSheet.getRange(validRowIndex, 10).setValue('Pending');
    
    // Update last updated info
    const timestamp = new Date().toISOString();
    progressSheet.getRange(validRowIndex, 15).setValue(params.username);
    progressSheet.getRange(validRowIndex, 16).setValue(timestamp);
    
    return { success: true, message: 'Planned date set successfully' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
```

### 5. Frontend API Service
**NEW API CALL NEEDED in `src/services/api.ts`**

```typescript
async setPlannedDateForStep(rowIndex: number, plannedDate: string) {
  cache.invalidatePattern('getAllProjects');
  cache.invalidatePattern('getMyTasks');
  return callAppsScript('setPlannedDateForDependentStep', {
    rowIndex,
    plannedDate,
    username: getCurrentUser()
  });
}
```

### 6. Backend - Read Functions Updates
Several functions in Code.gs that read from FMS_PROGRESS need updates:

- `getAllProjects()` - Parse WHO and completionsByUser when reading
- `getMyTasks()` - Filter by current user when WHO is array
- `getFMSByUser()` - Handle multi-WHO filtering

For each, add logic like:
```javascript
// Parse WHO
let whoValue = row[5];
try {
  if (typeof whoValue === 'string' && whoValue.startsWith('[')) {
    whoValue = JSON.parse(whoValue);
  }
} catch (e) {}

// Check if task belongs to user
const isAssignedToUser = Array.isArray(whoValue) 
  ? whoValue.includes(username)
  : whoValue === username;

// Parse completion tracking
let completionsByUser = {};
try {
  if (row[21]) {
    completionsByUser = JSON.parse(row[21]);
  }
} catch (e) {}
```

## Testing Checklist

### Creating FMS with New Features:
- [ ] Create FMS with multiple WHOs for a step
- [ ] Create FMS with step 2 set to "Dependent" timing
- [ ] Verify FMS_MASTER stores data correctly

### Starting Project:
- [ ] Start project from FMS with multi-WHO steps
- [ ] Verify step 1 shows all assigned users
- [ ] Verify dependent step 2 has status "Awaiting Date"

### Completing Multi-WHO Tasks:
- [ ] User 1 completes task - should stay "In Progress"
- [ ] User 2 completes task - should change to "Done"
- [ ] Verify both users see completion status

### Dependent Timing:
- [ ] Complete step 1 with dependent step 2
- [ ] Modal should appear to set date for step 2
- [ ] Set date and verify step 2 becomes "Pending"
- [ ] Verify step 2 appears on assignee's dashboard

## Migration Notes

For existing data:
1. Run `initializeAllSheets()` to add new columns
2. Existing single-WHO tasks will work as-is (backward compatible)
3. New multi-WHO and dependent timing features work alongside existing data

## Estimated Remaining Work

- Backend completion logic: 4-6 hours
- Frontend dashboard updates: 2-3 hours
- Set date modal: 1-2 hours
- Backend read function updates: 2-3 hours
- Testing and bug fixes: 3-4 hours

**Total: 12-18 hours of development work**

## Priority Order for Remaining Work

1. **CRITICAL**: Backend `updateTaskStatus` function (multi-WHO completion logic)
2. **HIGH**: Backend `setPlannedDateForDependentStep` function
3. **HIGH**: Frontend dashboard display updates for multi-WHO
4. **MEDIUM**: Set planned date modal in dashboard
5. **MEDIUM**: Backend read function updates
6. **LOW**: Polish and edge case handling

