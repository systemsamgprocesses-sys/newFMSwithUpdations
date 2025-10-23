# Dependent Tasks Feature

## Overview
This feature allows tasks in the Task Management System to have dependencies on other tasks. When a task that has dependent tasks is completed, the system automatically prompts the user to provide planned dates for the dependent tasks.

## How It Works

### 1. Creating Tasks with Dependencies

When assigning a new task, you can specify which task it depends on by providing the `Dependent On Task ID` field. This establishes a dependency chain where:
- **Parent Task**: The task that must be completed first
- **Dependent Task**: The task that depends on the parent task's completion

### 2. Completing a Parent Task

When you complete a task that has dependent tasks:

1. **Click "Complete" button** on the parent task
2. **System checks for dependencies** - The backend automatically checks if any tasks depend on this one
3. **Modal appears** - If dependent tasks exist and need a planned date, a modal will appear showing:
   - List of all dependent tasks
   - Task IDs, descriptions, and assignees
   - Input fields for planned dates

4. **Set planned dates** - For each dependent task, provide a planned date (required)
5. **Submit** - Click "Submit Dates" to:
   - Mark the parent task as completed
   - Update planned dates for all dependent tasks
   - Refresh the task list

### 3. Workflow Example

```
Task AT-1: "Design Database Schema"
  ↓ (depends on)
Task AT-2: "Implement Database" (Dependent On Task ID: AT-1)
  ↓ (depends on)
Task AT-3: "Create API Endpoints" (Dependent On Task ID: AT-2)
```

**When AT-1 is completed:**
- System prompts for planned date of AT-2
- User provides date (e.g., 2025-11-01)
- AT-2's planned date is updated

**When AT-2 is completed:**
- System prompts for planned date of AT-3
- User provides date (e.g., 2025-11-10)
- AT-3's planned date is updated

## Technical Implementation

### Backend Changes (Code.gs)

1. **Added "Dependent On Task ID" column** to MASTER and SCORING sheets
   - Column 20: Stores the Task ID that this task depends on

2. **Updated `assignTask()` function**
   - Now accepts `dependentOnTaskId` parameter
   - Saves dependency relationship in the sheet

3. **Modified `updateTask()` function**
   - When marking a task as complete, checks for dependent tasks
   - Returns list of dependent tasks that need planned dates
   - Response includes: `{ success: true, dependentTasks: [...] }`

4. **Added `updateDependentTaskPlannedDate()` function**
   - Updates the planned date of a specific task
   - Called for each dependent task when dates are submitted

5. **Added case handler** in `doPost()`
   - Handles 'updateDependentTaskPlannedDate' action

### Frontend Changes

1. **Updated Types (src/types/index.ts)**
   - Added `'Dependent On Task ID'?: string` to `TaskData` interface
   - Created `DependentTask` interface for dependent task information

2. **Updated API (src/services/api.ts)**
   - Added `updateDependentTaskPlannedDate()` method
   - Calls backend with taskId and plannedDate

3. **Modified TaskManagement.tsx**
   - Added state for dependent tasks modal
   - Modified `handleUpdateTask()` to check for dependent tasks
   - Added `handleDependentTaskDatesSubmit()` to update dates
   - Created new modal UI for setting planned dates

## Usage Instructions

### For Task Assigners

When creating a task that depends on another task:

1. Go to **Task Management → Assign Task** tab
2. Fill in task details as usual
3. In the backend (Google Sheet), manually add the parent task ID in the "Dependent On Task ID" column
4. When the parent task is completed, the system will prompt for this task's planned date

### For Task Completers

When completing a task:

1. Click the **Complete** button on any task
2. If the task has dependent tasks:
   - A modal will appear showing all dependent tasks
   - Each task shows: Task ID, Assigned To, Description
   - Provide a planned date for each dependent task (required)
3. Click **Submit Dates** to complete the process
4. The task is marked as completed and dependent tasks are updated

### Important Notes

- Dependent tasks **without a planned date** will be prompted when their parent task completes
- Dependent tasks **with existing planned dates** will not be prompted (assumes already scheduled)
- You can cancel the modal without submitting, but the parent task will not be marked as completed
- Multiple dependent tasks can be updated at once
- Dates must be current or future dates (past dates not allowed)

## Future Enhancements

Possible improvements for this feature:

1. **UI for setting dependencies** - Add a dropdown in the Assign Task form to select parent task
2. **Dependency visualization** - Show dependency chains in a tree or flowchart
3. **Automatic date calculation** - Suggest planned dates based on parent completion date + estimated duration
4. **Notifications** - Email notifications when a parent task is completed and dependent task date is set
5. **Bulk dependency management** - Manage multiple dependencies at once
6. **Circular dependency detection** - Prevent tasks from depending on each other in a loop

## Screenshots

### Completing a Parent Task
When you click "Complete" on a task with dependents, a modal appears:

```
┌─────────────────────────────────────────────────┐
│ Set Planned Dates for Dependent Tasks      [X] │
├─────────────────────────────────────────────────┤
│ ℹ Task completed successfully! The following   │
│   task(s) depend on the completion of this      │
│   step. Please provide a planned date:          │
│                                                  │
│ ┌───────────────────────────────────────────┐  │
│ │ Task ID: AT-25                            │  │
│ │ Assigned To: john.doe                     │  │
│ │ Description: Implement user authentication│  │
│ │                                            │  │
│ │ 📅 Planned Date * [2025-11-15]            │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│ ┌───────────────────────────────────────────┐  │
│ │ Task ID: AT-26                            │  │
│ │ Assigned To: jane.smith                   │  │
│ │ Description: Create login page UI         │  │
│ │                                            │  │
│ │ 📅 Planned Date * [2025-11-20]            │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│              [Cancel] [✓ Submit Dates]          │
└─────────────────────────────────────────────────┘
```

## Benefits

1. **Better task planning** - Ensures dependent tasks have planned dates when their prerequisites complete
2. **Workflow management** - Enforces task dependencies and proper sequencing
3. **Improved visibility** - Team members know when to expect dependent tasks
4. **Reduced delays** - No more "waiting for someone to assign a date" after completion
5. **Accountability** - Clear ownership and deadlines for sequential work

## Troubleshooting

### Issue: Modal not appearing after completing task
**Solution:** The task may not have any dependent tasks, or dependent tasks already have planned dates set.

### Issue: Cannot submit dates
**Solution:** Ensure all dependent tasks have planned dates filled in. All fields are required.

### Issue: Dates not updating in sheet
**Solution:** Check your internet connection and ensure the backend server is running. Check browser console for errors.

### Issue: Need to add dependency relationships
**Solution:** Currently, dependencies must be set manually in the Google Sheet's "Dependent On Task ID" column. Future updates will add a UI for this.

## Support

For questions or issues with this feature, please contact the development team or check the system logs for detailed error messages.

