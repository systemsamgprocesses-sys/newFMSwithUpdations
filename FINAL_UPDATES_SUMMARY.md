# Final Updates Summary

## Date: 2025-10-18

---

## ✅ COMPLETED CHANGES

### 1. Objection Routing Logic (Already Correct)
- ✅ **Assigned Tasks**: Routes to the person who assigned the task
- ✅ **FMS Tasks**: Routes to Step 1 person of the FMS
- No changes needed - already working correctly!

### 2. Objection Sub-Tabs
- ✅ Added 4 sub-tabs in Objections view:
  1. **All Objections** - Shows everything
  2. **📝 I Raised** - Only objections you raised
  3. **⚖️ For My Review** - Only objections assigned to you for review
  4. **🏷️ Tagged** - Only objections where you're tagged
- ✅ Each tab shows count badges
- ✅ Filtering logic implemented
- ✅ Color-coded tabs (Red, Purple, Green, Blue)

### 3. Warning Message on Objection Modal
- ✅ Added prominent warning message:
  > "**Important:** Please note this should be a genuine reason to raise the objection. Raising unnecessary objections will negatively affect your performance evaluation."
- ✅ Yellow background with alert icon
- ✅ Positioned prominently in the modal

---

## 🔄 PENDING: FMS WHEN Field Enhancement

### Current State:
The WHEN field currently works with fixed durations:
- Days
- Hours  
- Days + Hours

### Required Enhancement:
Two modes for WHEN planning:

#### Mode 1: Fixed (Use Case Based)
When user selects "Fixed":
1. Show date picker for "Maximum Date"
2. Show duration input:
   - **Option A**: Days only
   - **Option B**: Hours only
   - **Option C**: Days + Hours combined

```
┌─────────────────────────────────┐
│ WHEN (Planning Mode)            │
│                                 │
│ ○ Fixed                         │
│ ○ Dynamic                       │
│                                 │
│ Maximum Date: [Date Picker]     │
│                                 │
│ Duration Type:                  │
│ ○ Days     Input: [__] days    │
│ ○ Hours    Input: [__] hours   │
│ ○ Days+Hours                    │
│   Days: [__]  Hours: [__]      │
└─────────────────────────────────┘
```

#### Mode 2: Dynamic
When user selects "Dynamic":
1. NO planned date input during FMS creation
2. Skip planned date field entirely
3. During project execution:
   - When Step N-1 is completed
   - Ask the person who completed it: "What's the planned date for Step N?"
   - That date becomes the planned date for Step N
4. Then proceed normally with that step

```
┌─────────────────────────────────┐
│ WHEN (Planning Mode)            │
│                                 │
│ ○ Fixed                         │
│ ● Dynamic                       │
│                                 │
│ [Info Icon] Planned date will   │
│ be determined when previous     │
│ step is completed               │
└─────────────────────────────────┘
```

---

## 📋 Implementation Plan for FMS WHEN Enhancement

### Step 1: Update Types

**File**: `src/types/index.ts`

```typescript
export interface FMSStep {
  stepNo: number;
  what: string;
  who: string;
  how: string;
  whenMode: 'fixed' | 'dynamic';  // NEW
  when: number;
  whenUnit: 'days' | 'hours' | 'days+hours';
  whenDays?: number;
  whenHours?: number;
  maxDate?: string;  // NEW - for fixed mode
  requiresChecklist?: boolean;
  checklistItems?: ChecklistItem[];
  attachments?: Attachment[];
  triggersFMSId?: string;
}
```

### Step 2: Update CreateFMS Component

**File**: `src/pages/CreateFMS.tsx`

1. Add mode selector:
```typescript
<div>
  <label>WHEN (Planning Mode)</label>
  <div className="flex gap-4">
    <label>
      <input 
        type="radio" 
        name="whenMode"
        value="fixed"
        checked={step.whenMode === 'fixed'}
        onChange={() => updateStep(index, 'whenMode', 'fixed')}
      />
      Fixed (Use Case Based)
    </label>
    <label>
      <input 
        type="radio"
        name="whenMode"
        value="dynamic"
        checked={step.whenMode === 'dynamic'}
        onChange={() => updateStep(index, 'whenMode', 'dynamic')}
      />
      Dynamic (On Previous Completion)
    </label>
  </div>
</div>
```

2. Conditional rendering based on mode:
```typescript
{step.whenMode === 'fixed' && (
  <>
    <input type="date" 
           value={step.maxDate}
           onChange={(e) => updateStep(index, 'maxDate', e.target.value)}
           label="Maximum Date" />
    
    <select onChange={(e) => updateStep(index, 'whenUnit', e.target.value)}>
      <option value="days">Days</option>
      <option value="hours">Hours</option>
      <option value="days+hours">Days + Hours</option>
    </select>
    
    {/* Show duration inputs based on whenUnit */}
  </>
)}

{step.whenMode === 'dynamic' && (
  <div className="info-box">
    Planned date will be determined when previous step is completed
  </div>
)}
```

### Step 3: Update StartProject Logic

**File**: `src/pages/StartProject.tsx` or backend

When starting a project:
- For **Fixed** steps: Calculate planned date from start date + duration
- For **Dynamic** steps: Set planned date as null/empty

### Step 4: Update Backend (Code.gs)

**File**: `Code.gs`

1. **startFMSProject function**:
```javascript
// For each step
if (stepData.whenMode === 'fixed') {
  // Calculate planned date
  const daysToAdd = calculateDays(stepData);
  const plannedDate = new Date(startDate);
  plannedDate.setDate(plannedDate.getDate() + daysToAdd);
  row.push(formatDate(plannedDate));
} else {
  // Dynamic - no planned date yet
  row.push('PENDING_PREVIOUS_COMPLETION');
}
```

2. **completeFMSStep function**:
```javascript
// When completing a step
const nextStep = getNextStep(projectId, currentStepNo);

if (nextStep && nextStep.whenMode === 'dynamic') {
  // Prompt for next step's planned date
  // This could be done via modal in frontend
  // Or return a flag that frontend should ask
  return {
    success: true,
    requiresPlannedDate: true,
    nextStepNo: nextStep.stepNo,
    nextStepWhat: nextStep.what
  };
}
```

3. **setDynamicStepPlannedDate function** (NEW):
```javascript
function setDynamicStepPlannedDate(params) {
  const { projectId, stepNo, plannedDate } = params;
  
  const sheet = FMS_SS.getSheetByName('FMS_PROGRESS');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === projectId && data[i][3] === stepNo) {
      // Update WHEN column with planned date
      sheet.getRange(i + 1, WHEN_COLUMN).setValue(plannedDate);
      return { success: true };
    }
  }
  
  return { success: false, message: 'Step not found' };
}
```

### Step 5: Update Frontend Task Completion

When completing a task in Dashboard:
```typescript
const result = await api.completeFMSStep(projectId, stepNo, checklist);

if (result.requiresPlannedDate) {
  // Show modal asking for next step's planned date
  setShowPlannedDateModal(true);
  setNextStepInfo({
    projectId,
    stepNo: result.nextStepNo,
    what: result.nextStepWhat
  });
}
```

Add new modal:
```typescript
{showPlannedDateModal && (
  <Modal>
    <h3>Set Planned Date for Next Step</h3>
    <p>Step {nextStepInfo.stepNo}: {nextStepInfo.what}</p>
    <input 
      type="date"
      value={nextStepPlannedDate}
      onChange={(e) => setNextStepPlannedDate(e.target.value)}
    />
    <button onClick={async () => {
      await api.setDynamicStepPlannedDate({
        projectId: nextStepInfo.projectId,
        stepNo: nextStepInfo.stepNo,
        plannedDate: nextStepPlannedDate
      });
      setShowPlannedDateModal(false);
    }}>
      Set Planned Date
    </button>
  </Modal>
)}
```

---

## Files That Need Changes for FMS WHEN Enhancement

### Frontend:
1. ✅ `src/types/index.ts` - Add `whenMode` and `maxDate` fields
2. ✅ `src/pages/CreateFMS.tsx` - Add mode selector and conditional rendering
3. ✅ `src/pages/StartProject.tsx` - Handle dynamic steps (optional changes)
4. ✅ `src/pages/Dashboard.tsx` - Add planned date modal for dynamic steps
5. ✅ `src/services/api.ts` - Add `setDynamicStepPlannedDate` API call

### Backend:
1. ✅ `Code.gs` - Update `startFMSProject` function
2. ✅ `Code.gs` - Update `completeFMSStep` function
3. ✅ `Code.gs` - Add `setDynamicStepPlannedDate` function
4. ✅ `Code.gs` - Update FMS_MASTER sheet structure (add whenMode column)

---

## Testing Checklist for FMS WHEN

### Fixed Mode:
- [ ] Create FMS with Fixed mode
- [ ] Enter maximum date
- [ ] Select Days only - works
- [ ] Select Hours only - works
- [ ] Select Days+Hours - works
- [ ] Start project - dates calculated correctly
- [ ] Complete steps - no planned date prompt

### Dynamic Mode:
- [ ] Create FMS with Dynamic mode
- [ ] No date input required during creation
- [ ] Start project - no planned date set
- [ ] Complete Step 1 - prompts for Step 2 date
- [ ] Enter date - Step 2 gets the date
- [ ] Complete Step 2 - prompts for Step 3 date
- [ ] Verify dates saved correctly

### Mixed Mode:
- [ ] Create FMS with mix of Fixed and Dynamic steps
- [ ] Step 1: Fixed - has date
- [ ] Step 2: Dynamic - no date initially
- [ ] Step 3: Fixed - has calculated date
- [ ] Complete steps - only Dynamic steps prompt

---

## Current Status

### ✅ Completed (Ready to Deploy):
1. Objection routing logic (already correct)
2. Objection sub-tabs with filtering
3. Warning message on objection modal
4. Backend support for tagged objections
5. Complete objection status visibility

### 🔄 In Progress:
FMS WHEN Enhancement - Requires implementation following the plan above

---

## Deployment Instructions

### For Completed Features:

1. **Update Google Apps Script**:
   - Already updated with objection changes
   - Deploy new version

2. **Update Frontend**:
   ```bash
   npm run build
   # Deploy dist/ folder
   ```

3. **Test**:
   - Navigate to Objections tab
   - Verify sub-tabs work
   - Raise objection and see warning
   - Check filtering works correctly

### For FMS WHEN Enhancement:
Follow the implementation plan above. This is a significant feature that requires:
- Type updates
- UI changes in CreateFMS
- Backend logic updates
- New API endpoints
- Frontend completion flow updates

Estimated time: 2-3 hours of focused development

---

**Summary**: Most requested features are complete and ready! The FMS WHEN enhancement requires additional implementation work as outlined above.

