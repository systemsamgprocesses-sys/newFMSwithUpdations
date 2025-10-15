// ============================================
// COMPREHENSIVE FMS + TASK MANAGEMENT SYSTEM
// Google Apps Script Web App Backend
// Enhanced Version with ALL Features
// ============================================
//
// 🔧 SETUP & TROUBLESHOOTING:
// ---------------------------
// If Task Management features are not working (assign, complete, revise):
//
// 1. Open Google Apps Script Editor
// 2. Run: initializeAllSheets()
//    - This creates all required sheets with proper structure
//    - Creates MASTER sheet for assigned tasks
//    - Creates SCORING sheet for performance tracking
//
// 3. Run: checkSystemHealth()
//    - Verifies all sheets exist
//    - Shows detailed diagnostics
//    - Highlights any missing components
//
// 4. If issues persist, check:
//    - MASTER_SHEET_ID is correct
//    - You have edit permissions on all sheets
//    - No sheet name conflicts
//
// 🔍 WHAT WAS FIXED:
// ------------------
// 1. Created MASTER sheet auto-generation for Task Management
// 2. Fixed sheet name inconsistencies (MASTER vs Task Management)
// 3. Added proper column structure (19 columns including attachments)
// 4. Added validation and better error messages
// 5. Fixed objection review functions to use correct sheet
//
// ============================================

// ===== CONFIGURATION =====
// Replace these IDs with your actual Google Sheets IDs
const MASTER_SHEET_ID = '1SGVw2xbVoLPmggNJKgpjWIaEgzukU8byE2nQLqfeGTo';
const CREDENTIALS_SHEET_ID = '1ipCXOWo1A8w3sbmhaQcrhFHaCPgaHaHWR6Wr-MPDZ14';

// Get the active spreadsheet for FMS data
const FMS_SS = SpreadsheetApp.getActiveSpreadsheet();

// ===== SHEET AUTO-CREATION =====

/**
 * Manual initialization function - Run this from Apps Script Editor
 * to create all required sheets with proper structure
 */
function initializeAllSheets() {
  Logger.log('🔧 Initializing all sheets...');
  const result = ensureSheetsExist();
  Logger.log(result.message);
  return result;
}

/**
 * Diagnostic function to check system health
 * Run this from Apps Script Editor to verify all sheets exist
 */
function checkSystemHealth() {
  Logger.log('🔍 Checking system health...\n');
  
  const results = {
    fmsSpreadsheet: false,
    fmsMaster: false,
    fmsProgress: false,
    users: false,
    objections: false,
    fmsRevisions: false,
    fileUploadsLog: false,
    masterSheetAccess: false,
    masterSheet: false,
    scoringSheet: false,
    credentialsAccess: false,
    overall: false
  };
  
  // Check FMS Spreadsheet
  try {
    const fmsName = FMS_SS.getName();
    Logger.log('✅ FMS Spreadsheet: ' + fmsName);
    results.fmsSpreadsheet = true;
    
    // Check FMS sheets
    if (FMS_SS.getSheetByName('FMS_MASTER')) {
      Logger.log('✅ FMS_MASTER sheet exists');
      results.fmsMaster = true;
    } else {
      Logger.log('❌ FMS_MASTER sheet missing');
    }
    
    if (FMS_SS.getSheetByName('FMS_PROGRESS')) {
      Logger.log('✅ FMS_PROGRESS sheet exists');
      results.fmsProgress = true;
    } else {
      Logger.log('❌ FMS_PROGRESS sheet missing');
    }
    
    if (FMS_SS.getSheetByName('Users')) {
      Logger.log('✅ Users sheet exists');
      results.users = true;
    } else {
      Logger.log('❌ Users sheet missing');
    }
    
    if (FMS_SS.getSheetByName('OBJECTIONS')) {
      Logger.log('✅ OBJECTIONS sheet exists');
      results.objections = true;
    } else {
      Logger.log('❌ OBJECTIONS sheet missing');
    }
    
    if (FMS_SS.getSheetByName('FMS_REVISIONS')) {
      Logger.log('✅ FMS_REVISIONS sheet exists');
      results.fmsRevisions = true;
    } else {
      Logger.log('❌ FMS_REVISIONS sheet missing');
    }
    
    if (FMS_SS.getSheetByName('FILE_UPLOADS_LOG')) {
      Logger.log('✅ FILE_UPLOADS_LOG sheet exists');
      results.fileUploadsLog = true;
    } else {
      Logger.log('❌ FILE_UPLOADS_LOG sheet missing');
    }
  } catch (e) {
    Logger.log('❌ Error accessing FMS Spreadsheet: ' + e.toString());
  }
  
  // Check MASTER_SHEET (Task Management)
  try {
    const masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const masterName = masterSS.getName();
    Logger.log('\n✅ MASTER_SHEET Spreadsheet accessible: ' + masterName);
    results.masterSheetAccess = true;
    
    if (masterSS.getSheetByName('MASTER')) {
      const sheet = masterSS.getSheetByName('MASTER');
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      Logger.log('✅ MASTER sheet exists with ' + headers.length + ' columns');
      Logger.log('   Headers: ' + headers.join(', '));
      results.masterSheet = true;
    } else {
      Logger.log('❌ MASTER sheet missing');
    }
    
    if (masterSS.getSheetByName('SCORING')) {
      Logger.log('✅ SCORING sheet exists');
      results.scoringSheet = true;
    } else {
      Logger.log('❌ SCORING sheet missing');
    }
  } catch (e) {
    Logger.log('❌ Error accessing MASTER_SHEET: ' + e.toString());
    Logger.log('   Please check MASTER_SHEET_ID in configuration');
  }
  
  // Check Credentials
  try {
    const credSS = SpreadsheetApp.openById(CREDENTIALS_SHEET_ID);
    const credName = credSS.getName();
    Logger.log('\n✅ Credentials Spreadsheet accessible: ' + credName);
    results.credentialsAccess = true;
  } catch (e) {
    Logger.log('❌ Error accessing Credentials: ' + e.toString());
  }
  
  // Overall status
  const totalChecks = Object.keys(results).length - 1; // Exclude 'overall'
  const passedChecks = Object.values(results).filter(v => v === true).length;
  results.overall = passedChecks === totalChecks;
  
  Logger.log('\n' + '='.repeat(50));
  Logger.log('System Health: ' + passedChecks + '/' + totalChecks + ' checks passed');
  
  if (results.overall) {
    Logger.log('✅ All systems operational!');
  } else {
    Logger.log('⚠️  Some issues detected. Run initializeAllSheets() to create missing sheets.');
  }
  Logger.log('='.repeat(50));
  
  return results;
}

/**
 * Ensure all required sheets exist with proper structure
 */
function ensureSheetsExist() {
  const ss = FMS_SS;
  
  // 1. FMS_MASTER sheet
  let masterSheet = ss.getSheetByName('FMS_MASTER');
  if (!masterSheet) {
    masterSheet = ss.insertSheet('FMS_MASTER');
    masterSheet.appendRow([
      'FMS_ID', 'FMS_Name', 'Step_No', 'WHAT', 'WHO', 'HOW', 'WHEN',
      'When_Unit', 'When_Days', 'When_Hours', 'Created_By', 'Created_On',
      'Last_Updated_By', 'Last_Updated_On', 'Requires_Checklist', 
      'Checklist_Items', 'Attachments', 'Triggers_FMS_ID'
    ]);
    Logger.log('✓ Created FMS_MASTER sheet');
  }
  
  // 2. FMS_PROGRESS sheet
  let progressSheet = ss.getSheetByName('FMS_PROGRESS');
  if (!progressSheet) {
    progressSheet = ss.insertSheet('FMS_PROGRESS');
    progressSheet.appendRow([
      'Project_ID', 'FMS_ID', 'Project_Name', 'Step_No', 'WHAT', 'WHO', 'HOW',
      'Planned_Due_Date', 'Actual_Completed_On', 'Status', 'Completed_By',
      'Is_First_Step', 'Created_By', 'Created_On', 'Last_Updated_By',
      'Last_Updated_On', 'Requires_Checklist', 'Checklist_Items', 'Attachments',
      'Triggers_FMS_ID'
    ]);
    Logger.log('✓ Created FMS_PROGRESS sheet');
  }
  
  // 3. Users sheet
  let usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
    usersSheet.appendRow([
      'Username', 'Password', 'Name', 'Role', 'Department', 'Last_Login'
    ]);
    Logger.log('✓ Created Users sheet');
  }
  
  // 4. OBJECTIONS sheet
  let objectionsSheet = ss.getSheetByName('OBJECTIONS');
  if (!objectionsSheet) {
    objectionsSheet = ss.insertSheet('OBJECTIONS');
    objectionsSheet.appendRow([
      'Objection_ID', 'Task_ID', 'Project_ID', 'Task_Description', 'Reason',
      'Raised_By', 'Raised_On', 'Route_To', 'Task_Type', 'Status',
      'Reviewed_By', 'Reviewed_On', 'Action_Taken', 'New_Task_ID'
    ]);
    Logger.log('✓ Created OBJECTIONS sheet');
  }
  
  // 5. FMS_REVISIONS sheet
  let revisionsSheet = ss.getSheetByName('FMS_REVISIONS');
  if (!revisionsSheet) {
    revisionsSheet = ss.insertSheet('FMS_REVISIONS');
    revisionsSheet.appendRow([
      'Revision_ID', 'Project_ID', 'Project_Name', 'Step_No', 'Task_Description',
      'Current_Due_Date', 'Requested_New_Date', 'Reason', 'Requested_By',
      'Requested_On', 'Row_Index', 'Status', 'Approved_New_Date',
      'Approved_By', 'Approved_On', 'Rejected_By', 'Rejected_On'
    ]);
    Logger.log('✓ Created FMS_REVISIONS sheet');
  }
  
  // 6. FILE_UPLOADS_LOG sheet
  let uploadsSheet = ss.getSheetByName('FILE_UPLOADS_LOG');
  if (!uploadsSheet) {
    uploadsSheet = ss.insertSheet('FILE_UPLOADS_LOG');
    uploadsSheet.appendRow([
      'File_ID', 'File_Name', 'File_URL', 'File_Size', 'MIME_Type',
      'Uploaded_By', 'Uploaded_On', 'Context', 'Folder_Path'
    ]);
    Logger.log('✓ Created FILE_UPLOADS_LOG sheet');
  }
  
  // 7. MASTER sheet (for Task Management Assigned Tasks) - Create in MASTER_SHEET
  try {
    const masterSheetSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
    let masterSheet = masterSheetSS.getSheetByName('MASTER');
    if (!masterSheet) {
      masterSheet = masterSheetSS.insertSheet('MASTER');
      masterSheet.appendRow([
        'Task Id', 'GIVEN BY', 'GIVEN TO', 'GIVEN TO USER ID', 
        'TASK DESCRIPTION', 'HOW TO DO- TUTORIAL LINKS (OPTIONAL)', 
        'DEPARTMENT', 'TASK FREQUENCY', 'PLANNED DATE', 'Task Status',
        'completed on', 'Task Completed On', 'Revision 1 Date', 
        'Reason for Revision', 'On time or not?', 'Revision Count',
        'Revision Penalty', 'Calculated Score', 'Attachments'
      ]);
      Logger.log('✓ Created MASTER sheet for Task Management');
    }
    
    // 8. SCORING sheet (for performance tracking) - Create in MASTER_SHEET
    let scoringSheet = masterSheetSS.getSheetByName('SCORING');
    if (!scoringSheet) {
      scoringSheet = masterSheetSS.insertSheet('SCORING');
      scoringSheet.appendRow([
        'Task Id', 'GIVEN BY', 'GIVEN TO', 'GIVEN TO USER ID', 
        'TASK DESCRIPTION', 'HOW TO DO- TUTORIAL LINKS (OPTIONAL)', 
        'DEPARTMENT', 'TASK FREQUENCY', 'PLANNED DATE', 'Task Status',
        'completed on', 'Task Completed On', 'Revision 1 Date', 
        'Reason for Revision', 'On time or not?', 'Revision Count',
        'Revision Penalty', 'Calculated Score', 'Attachments'
      ]);
      Logger.log('✓ Created SCORING sheet for Task Management');
    }
  } catch (e) {
    Logger.log('Warning: Could not access MASTER_SHEET: ' + e.toString());
  }
  
  Logger.log('✅ All sheets verified/created!');
  return { success: true, message: 'All sheets ready' };
}

// ===== MAIN HANDLERS =====

/**
 * Create a response with CORS headers
 */
function createCORSResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // Ensure sheets exist on first load
  ensureSheetsExist();

  const payload = { success: true, message: 'FMS backend is running' };
  return createCORSResponse(payload);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    Logger.log('Action received: ' + action);
    
    let result;
    
    // Route to appropriate handler
    switch(action) {
      // ===== AUTHENTICATION =====
      case 'login':
        result = handleLogin(params);
        break;
      case 'changePassword':
        result = changePassword(params);
        break;
        
      // ===== FMS SYSTEM =====
      case 'getUsers':
        result = getUsers();
        break;
      case 'getAllUsers':
        result = getUsers();
        break;
      case 'createUser':
        result = createUser(params);
        break;
      case 'updateUser':
        result = updateUser(params);
        break;
      case 'deleteUser':
        result = deleteUser(params);
        break;
      case 'createFMS':
        result = createFMS(params);
        break;
      case 'getAllFMS':
        result = getAllFMS(params);
        break;
      case 'getFMSById':
        result = getFMSById(params.fmsId);
        break;
      case 'createProject':
        result = createProject(params);
        break;
      case 'getAllProjects':
        result = getAllProjects();
        break;
      case 'getProjectsByUser':
        result = getProjectsByUser(params.username);
        break;
      case 'updateTaskStatus':
        result = updateTaskStatus(params.rowIndex, params.status, params.username);
        break;
      case 'submitProgressWithAttachments':
        result = submitProgressWithAttachments(params);
        break;
      case 'getAllLogs':
        result = getAllLogs();
        break;
        
      // ===== TASK MANAGEMENT SYSTEM =====
      case 'assignTask':
        result = assignTask(params);
        break;
      case 'getTasks':
        result = getTasks(params.userId, params.filter || 'all');
        break;
      case 'getTaskSummary':
        result = getTaskSummary(params.userId);
        break;
      case 'updateTask':
        result = updateTask(params.taskId, params.taskAction, params.extraData || {});
        break;
      case 'batchUpdateTasks':
        result = batchUpdateTasks(params.updates);
        break;
      case 'getScoringData':
        result = getScoringData(params);
        break;
      case 'getTaskUsers':
        result = getTaskUsers();
        break;

      // ===== FMS REVISION SYSTEM =====
      case 'requestFMSRevision':
        result = requestFMSRevision(params);
        break;
      case 'getFMSRevisions':
        result = getFMSRevisions(params.userId);
        break;
      case 'approveFMSRevision':
        result = approveFMSRevision(params);
        break;
      case 'rejectFMSRevision':
        result = rejectFMSRevision(params);
        break;

      // ===== OBJECTION SYSTEM =====
      case 'raiseObjection':
        result = raiseObjection(params);
        break;
      case 'getObjections':
        result = getObjections(params.userId);
        break;
      case 'reviewObjection':
        result = reviewObjection(params);
        break;

      // ===== DRIVE FILE UPLOAD =====
      case 'uploadFile':
        result = uploadFileToDrive(params);
        break;
      case 'uploadMultipleFiles':
        result = uploadMultipleFiles(params);
        break;
      case 'deleteFile':
        result = deleteFileFromDrive(params);
        break;
      case 'getFileMetadata':
        result = getFileMetadata(params);
        break;
        
      default:
        result = { success: false, message: 'Invalid action: ' + action };
    }
    
    return createCORSResponse(result);
      
  } catch(error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createCORSResponse({ success: false, message: error.toString() });
  }
  
}

// ===== DATE HELPER FUNCTIONS =====

/**
 * Parse dd/MM/yyyy date format safely
 */
function parseDMYDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  const str = value.toString().trim();
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    if (!isNaN(date.getTime())) return date;
  }
  
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Format Date to ISO (yyyy-MM-dd)
 */
function formatDateToISO(date) {
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

/**
 * Format Date to dd/MM/yyyy for sheets
 */
function formatDateForSheet(date) {
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

// ===== AUTHENTICATION =====

/**
 * Unified login handling both FMS Users and Task Management Credentials
 */
function handleLogin(params) {
  const userId = (params.username || params.userId || '').toString().trim();
  const password = (params.password || '').toString().trim();
  
  if (!userId || !password) {
    return { success: false, message: 'Missing username or password' };
  }
  
  // Try FMS Users sheet first
  const fmsUsersSheet = FMS_SS.getSheetByName('Users');
  if (fmsUsersSheet) {
    const userData = fmsUsersSheet.getDataRange().getValues();
    for (let i = 1; i < userData.length; i++) {
      const row = userData[i];
      if (String(row[0]) === userId && String(row[1]) === password) {
        const timestamp = new Date().toISOString();
        fmsUsersSheet.getRange(i + 1, 6).setValue(timestamp);
        
        return {
          success: true,
          user: {
            username: userId,
            name: row[2] || userId,
            role: row[3] || 'User',
            department: row[4] || '',
            lastLogin: timestamp
          }
        };
      }
    }
  }
  
  // Try Task Management Credentials sheet
  try {
    const credSheet = SpreadsheetApp.openById(CREDENTIALS_SHEET_ID).getSheetByName('Credentials');
    if (credSheet) {
      const credData = credSheet.getDataRange().getValues();
      for (let i = 1; i < credData.length; i++) {
        const row = credData[i];
        if (String(row[0]) === userId && String(row[1]) === password) {
          return {
            success: true,
            user: {
              username: userId,
              name: row[0],
              role: 'User',
              department: row[2] ? row[2].toString().trim() : 'No Department',
              email: row[3] || ''
            },
            userId: userId,
            message: 'Login successful'
          };
        }
      }
    }
  } catch (e) {
    Logger.log('Credentials sheet not accessible: ' + e.toString());
  }
  
  return { success: false, message: 'Invalid credentials' };
}

/**
 * Change user password with current password verification
 */
function changePassword(params) {
  const username = (params.username || '').toString().trim();
  const currentPassword = (params.currentPassword || '').toString().trim();
  const newPassword = (params.newPassword || '').toString().trim();
  
  if (!username || !currentPassword || !newPassword) {
    return { success: false, message: 'All fields are required' };
  }
  
  // Validate new password
  if (newPassword.length < 6) {
    return { success: false, message: 'New password must be at least 6 characters long' };
  }
  
  // Check FMS Users sheet
  const fmsUsersSheet = FMS_SS.getSheetByName('Users');
  if (fmsUsersSheet) {
    const userData = fmsUsersSheet.getDataRange().getValues();
    for (let i = 1; i < userData.length; i++) {
      const row = userData[i];
      if (String(row[0]) === username) {
        // Verify current password
        if (String(row[1]) !== currentPassword) {
          return { success: false, message: 'Current password is incorrect' };
        }
        
        // Update password
        fmsUsersSheet.getRange(i + 1, 2).setValue(newPassword);
        
        return {
          success: true,
          message: 'Password changed successfully'
        };
      }
    }
  }
  
  // Check Task Management Credentials sheet
  try {
    const credSheet = SpreadsheetApp.openById(CREDENTIALS_SHEET_ID).getSheetByName('Credentials');
    if (credSheet) {
      const credData = credSheet.getDataRange().getValues();
      for (let i = 1; i < credData.length; i++) {
        const row = credData[i];
        if (String(row[0]) === username) {
          // Verify current password
          if (String(row[1]) !== currentPassword) {
            return { success: false, message: 'Current password is incorrect' };
          }
          
          // Update password
          credSheet.getRange(i + 1, 2).setValue(newPassword);
          
          return {
            success: true,
            message: 'Password changed successfully'
          };
        }
      }
    }
  } catch (e) {
    Logger.log('Error accessing credentials sheet: ' + e.toString());
  }
  
  return { success: false, message: 'User not found' };
}

// ===== FMS USER MANAGEMENT =====

function getUsers() {
  try {
    const usersSheet = FMS_SS.getSheetByName('Users');
    if (!usersSheet) {
      return { success: false, message: 'Users sheet not found' };
    }
    
    const data = usersSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, users: [] };
    }
    
    const users = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      users.push({
        username: row[0],
        name: row[2] || row[0],
        role: row[3] || 'User',
        department: row[4] || '',
        lastLogin: row[5] || ''
      });
    }
    
    return { success: true, users: users };
  } catch (error) {
    Logger.log('Error getting users: ' + error.toString());
    return { success: false, message: 'Error getting users: ' + error.toString() };
  }
}

function createUser(params) {
  try {
    const usersSheet = FMS_SS.getSheetByName('Users');
    if (!usersSheet) {
      return { success: false, message: 'Users sheet not found' };
    }
    
    const username = params.username;
    const password = params.password;
    const name = params.name || username;
    const role = params.role || 'User';
    const department = params.department || '';
    
    // Check if user already exists
    const data = usersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        return { success: false, message: 'User already exists' };
      }
    }
    
    usersSheet.appendRow([username, password, name, role, department, '']);
    
    return { success: true, message: 'User created successfully' };
  } catch (error) {
    Logger.log('Error creating user: ' + error.toString());
    return { success: false, message: 'Error creating user: ' + error.toString() };
  }
}

function updateUser(params) {
  try {
    const usersSheet = FMS_SS.getSheetByName('Users');
    if (!usersSheet) {
      return { success: false, message: 'Users sheet not found' };
    }
    
    const userId = params.id || params.username;
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        if (params.password !== undefined) usersSheet.getRange(i + 1, 2).setValue(params.password);
        if (params.name !== undefined) usersSheet.getRange(i + 1, 3).setValue(params.name);
        if (params.role !== undefined) usersSheet.getRange(i + 1, 4).setValue(params.role);
        if (params.department !== undefined) usersSheet.getRange(i + 1, 5).setValue(params.department);
        
        return { success: true, message: 'User updated successfully' };
      }
    }
    
    return { success: false, message: 'User not found' };
  } catch (error) {
    Logger.log('Error updating user: ' + error.toString());
    return { success: false, message: 'Error updating user: ' + error.toString() };
  }
}

function deleteUser(params) {
  try {
    const usersSheet = FMS_SS.getSheetByName('Users');
    if (!usersSheet) {
      return { success: false, message: 'Users sheet not found' };
    }
    
    const userId = params.id || params.username;
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        usersSheet.deleteRow(i + 1);
        return { success: true, message: 'User deleted successfully' };
      }
    }
    
    return { success: false, message: 'User not found' };
  } catch (error) {
    Logger.log('Error deleting user: ' + error.toString());
    return { success: false, message: 'Error deleting user: ' + error.toString() };
  }
}

// ===== FMS MANAGEMENT =====

function createFMS(params) {
  try {
    const masterSheet = FMS_SS.getSheetByName('FMS_MASTER');
    if (!masterSheet) {
      return { success: false, message: 'FMS_MASTER sheet not found' };
    }
    
    const fmsId = 'FMS' + Date.now();
    const fmsName = params.fmsName;
    const steps = params.steps;
    const username = params.username;
    const timestamp = new Date().toISOString();
    
    steps.forEach((step, index) => {
      // For Master sheet, only store checklist items without 'completed' status
      let checklistForMaster = [];
      if (step.checklistItems && step.checklistItems.length > 0) {
        checklistForMaster = step.checklistItems.map(item => ({
          id: item.id,
          text: item.text
          // Do NOT include 'completed' field in Master sheet
        }));
      }
      
      masterSheet.appendRow([
        fmsId,
        fmsName,
        index + 1,
        step.what,
        step.who,
        step.how,
        step.when,
        step.whenUnit || 'days',
        step.whenDays || 0,
        step.whenHours || 0,
        username,
        timestamp,
        username,
        timestamp,
        step.requiresChecklist || false,
        JSON.stringify(checklistForMaster),
        JSON.stringify(step.attachments || []),
        step.triggersFMSId || ''  // FMS to trigger when this step completes
      ]);
    });
    
    return {
      success: true,
      fmsId: fmsId,
      message: 'FMS created successfully'
    };
  } catch (error) {
    Logger.log('Error creating FMS: ' + error.toString());
    return { success: false, message: 'Error creating FMS: ' + error.toString() };
  }
}

// Helper function to get users in a specific department
function getDepartmentUsers(department) {
  try {
    const usersSheet = FMS_SS.getSheetByName('Users');
    if (!usersSheet) {
      return [];
    }
    
    const data = usersSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    
    const departmentUsers = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[4] === department) { // department column (index 4)
        departmentUsers.push(row[0]); // username column (index 0)
      }
    }
    
    return departmentUsers;
  } catch (error) {
    Logger.log('Error getting department users: ' + error.toString());
    return [];
  }
}

function getAllFMS(params = {}) {
  try {
    const masterSheet = FMS_SS.getSheetByName('FMS_MASTER');
    if (!masterSheet) {
      return { success: false, message: 'FMS_MASTER sheet not found' };
    }
    
    const { username, userRole, userDepartment } = params;
    
    // Log the received parameters for debugging
    Logger.log(`getAllFMS called with params: username=${username}, userRole=${userRole}, userDepartment=${userDepartment}`);
    
    const data = masterSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, fmsList: [] };
    }
    
    const fmsMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const fmsId = row[0];
      const fmsName = row[1];
      const stepNo = row[2];
      const whenDays = row[8] || 0;
      const whenHours = row[9] || 0;
      
      if (!fmsMap[fmsId]) {
        fmsMap[fmsId] = {
          fmsId: fmsId,
          fmsName: fmsName,
          stepCount: 0,
          createdBy: row[10],
          createdOn: row[11],
          totalDays: 0,
          totalHours: 0
        };
      }
      
      fmsMap[fmsId].stepCount = Math.max(fmsMap[fmsId].stepCount, stepNo);
      fmsMap[fmsId].totalDays += parseInt(whenDays) || 0;
      fmsMap[fmsId].totalHours += parseInt(whenHours) || 0;
    }
    
    // Convert excess hours to days and format total time
    Object.values(fmsMap).forEach(function(fms) {
      if (fms.totalHours >= 24) {
        fms.totalDays += Math.floor(fms.totalHours / 24);
        fms.totalHours = fms.totalHours % 24;
      }
      
      // Create formatted string
      if (fms.totalDays > 0 && fms.totalHours > 0) {
        fms.totalTimeFormatted = fms.totalDays + ' days ' + fms.totalHours + ' hours';
      } else if (fms.totalDays > 0) {
        fms.totalTimeFormatted = fms.totalDays + ' days';
      } else if (fms.totalHours > 0) {
        fms.totalTimeFormatted = fms.totalHours + ' hours';
      } else {
        fms.totalTimeFormatted = '0 days';
      }
    });
    
    // Apply role-based filtering
    let filteredFmsList = Object.values(fmsMap);
    Logger.log(`Total FMS found before filtering: ${filteredFmsList.length}`);
    
    if (username && userRole) {
      const role = userRole.toLowerCase();
      
      // Log filtering details
      Logger.log(`Filtering FMS for user: ${username}, role: ${role}, department: ${userDepartment}`);
      
      if (role === 'superadmin' || role === 'super admin') {
        // Super Admin sees everything - no filtering
        Logger.log('User is Super Admin - showing all FMS');
        filteredFmsList = Object.values(fmsMap);
      } else if (role === 'admin') {
        // Admin sees FMS where users in their department are assigned (WHO column)
        // First, get all users in the admin's department
        const departmentUsers = getDepartmentUsers(userDepartment);
        Logger.log(`Admin department users: ${departmentUsers.join(', ')}`);
        
        filteredFmsList = Object.values(fmsMap).filter(fms => {
          // Get all steps for this FMS to check WHO assignments
          const fmsSteps = data.filter(row => row[0] === fms.fmsId);
          
          // Check if any step is assigned to someone in admin's department
          const hasDepartmentAssignment = fmsSteps.some(step => {
            const who = step[4]; // WHO column (index 4)
            // Check if the assigned person is in admin's department
            const isDepartmentUser = departmentUsers.includes(who);
            if (isDepartmentUser) {
              Logger.log(`FMS ${fms.fmsId} assigned to department user: ${who}`);
            }
            return isDepartmentUser;
          });
          
          return hasDepartmentAssignment;
        });
      } else {
        // Regular users see only FMS where they are assigned (WHO column)
        Logger.log('User is Regular User - filtering by WHO assignments');
        filteredFmsList = Object.values(fmsMap).filter(fms => {
          // Get all steps for this FMS to check WHO assignments
          const fmsSteps = data.filter(row => row[0] === fms.fmsId);
          
          // Debug: Log all WHO assignments for this FMS
          Logger.log(`Checking FMS ${fms.fmsId} (${fms.fmsName})`);
          fmsSteps.forEach((step, index) => {
            Logger.log(`  Step ${index + 1} WHO: "${step[4]}"`);
          });
          
          // Check if user is assigned to any step in this FMS
          const hasUserAssignment = fmsSteps.some(step => {
            const who = step[4]; // WHO column (index 4)
            const isAssigned = who === username;
            Logger.log(`  Comparing WHO="${who}" with username="${username}": ${isAssigned}`);
            if (isAssigned) {
              Logger.log(`✓ FMS ${fms.fmsId} assigned to user: ${username}`);
            }
            return isAssigned;
          });
          
          Logger.log(`  Result for ${fms.fmsId}: ${hasUserAssignment ? 'INCLUDE' : 'EXCLUDE'}`);
          return hasUserAssignment;
        });
      }
    } else {
      Logger.log('No username or userRole provided - showing all FMS (no filtering)');
    }
    
    Logger.log(`Final filtered FMS list for ${username || 'anonymous'}: ${filteredFmsList.length} FMS found`);
    filteredFmsList.forEach(fms => {
      Logger.log(`- FMS: ${fms.fmsName} (${fms.fmsId})`);
    });
    
    // Add debug info to response
    const debugInfo = {
      totalFmsCount: Object.values(fmsMap).length,
      filteredCount: filteredFmsList.length,
      userInfo: { username, userRole, userDepartment },
      expectedFms: ['FMS1759827022663', 'FMS1759901828599', 'FMS1759906890858', 'FMS1759922726457']
    };
    
    return {
      success: true,
      fmsList: filteredFmsList,
      debug: debugInfo
    };
  } catch (error) {
    Logger.log('Error getting all FMS: ' + error.toString());
    return { success: false, message: 'Error getting all FMS: ' + error.toString() };
  }
}

function getFMSById(fmsId) {
  try {
    const masterSheet = FMS_SS.getSheetByName('FMS_MASTER');
    if (!masterSheet) {
      return { success: false, message: 'FMS_MASTER sheet not found' };
    }
    
    const data = masterSheet.getDataRange().getValues();
    const steps = [];
    let fmsName = '';
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === fmsId) {
        if (!fmsName) fmsName = row[1];
        
        // Parse checklist items (column 15 = index 15) and attachments (column 16 = index 16)
        let checklistItems = [];
        let attachments = [];
        
        try {
          if (row[15]) {
            checklistItems = JSON.parse(row[15]);
          }
        } catch (e) {
          Logger.log('Error parsing checklist items: ' + e.toString());
        }
        
        try {
          if (row[16]) {
            attachments = JSON.parse(row[16]);
          }
        } catch (e) {
          Logger.log('Error parsing attachments: ' + e.toString());
        }
        
        steps.push({
          stepNo: row[2],
          what: row[3],
          who: row[4],
          how: row[5],
          when: row[6],
          whenUnit: row[7] || 'days',
          whenDays: row[8] || 0,
          whenHours: row[9] || 0,
          requiresChecklist: row[14] || false,
          checklistItems: checklistItems,
          attachments: attachments
        });
      }
    }
    
    steps.sort((a, b) => a.stepNo - b.stepNo);
    
    return {
      success: true,
      steps: steps,
      fmsName: fmsName
    };
  } catch (error) {
    Logger.log('Error getting FMS by ID: ' + error.toString());
    return { success: false, message: 'Error getting FMS by ID: ' + error.toString() };
  }
}

// ===== FMS PROJECT MANAGEMENT =====

function createProject(params) {
  try {
    const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
    const masterSheet = FMS_SS.getSheetByName('FMS_MASTER');
    
    if (!progressSheet || !masterSheet) {
      return { success: false, message: 'Required sheets not found' };
    }
    
    const projectId = 'PRJ' + Date.now();
    const fmsId = params.fmsId;
    const projectName = params.projectName;
    const projectStartDate = new Date(params.projectStartDate);
    const username = params.username;
    const timestamp = new Date().toISOString();
    
    const masterData = masterSheet.getDataRange().getValues();
    const steps = [];
    
    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      if (row[0] === fmsId) {
        // Parse checklist and attachments from FMS_MASTER
        // FMS_MASTER columns: 14=Requires_Checklist, 15=Checklist_Items, 16=Attachments
        let checklistItems = [];
        let attachments = [];
        
        try {
          if (row[15]) {
            checklistItems = JSON.parse(row[15]);
            // Initialize 'completed' field for progress tracking
            checklistItems = checklistItems.map(item => ({
              id: item.id,
              text: item.text,
              completed: false // Initialize as not completed
            }));
          }
        } catch (e) {
          Logger.log('Error parsing checklist: ' + e.toString());
        }
        
        try {
          if (row[16]) attachments = JSON.parse(row[16]);
        } catch (e) {
          Logger.log('Error parsing attachments: ' + e.toString());
        }
        
        steps.push({
          stepNo: row[2],
          what: row[3],
          who: row[4],
          how: row[5],
          when: row[6],
          whenUnit: row[7] || 'days',
          whenDays: row[8] || 0,
          whenHours: row[9] || 0,
          requiresChecklist: row[14] || false,
          checklistItems: checklistItems,
          attachments: attachments,
          triggersFMSId: row[17] || ''  // Column 17: Triggers_FMS_ID
        });
      }
    }
    
    steps.sort((a, b) => a.stepNo - b.stepNo);
    
    if (steps.length === 0) {
      return { success: false, message: 'No steps found for this FMS' };
    }
    
    let currentDate = new Date(projectStartDate);
    const whenDays = steps[0].whenDays || Math.floor(steps[0].when);
    const whenHours = steps[0].whenHours || Math.round((steps[0].when % 1) * 24);
    
    currentDate.setDate(currentDate.getDate() + parseInt(whenDays));
    currentDate.setHours(currentDate.getHours() + parseInt(whenHours));
    
    // For Progress sheet, include checklist items with 'completed' field
    // Columns: Project_ID, FMS_ID, Project_Name, Step_No, WHAT, WHO, HOW, Planned_Due_Date,
    // Actual_Completed_On, Status, Completed_By, Is_First_Step, Created_By, Created_On,
    // Last_Updated_By, Last_Updated_On, Requires_Checklist, Checklist_Items, Attachments, Triggers_FMS_ID
    progressSheet.appendRow([
      projectId,                                    // 0: Project_ID
      fmsId,                                        // 1: FMS_ID
      projectName,                                  // 2: Project_Name
      steps[0].stepNo,                              // 3: Step_No
      steps[0].what,                                // 4: WHAT
      steps[0].who,                                 // 5: WHO
      steps[0].how,                                 // 6: HOW
      currentDate.toISOString(),                    // 7: Planned_Due_Date
      '',                                           // 8: Actual_Completed_On
      'Pending',                                    // 9: Status
      '',                                           // 10: Completed_By
      'true',                                       // 11: Is_First_Step
      username,                                     // 12: Created_By
      timestamp,                                    // 13: Created_On
      username,                                     // 14: Last_Updated_By
      timestamp,                                    // 15: Last_Updated_On
      steps[0].requiresChecklist || false,          // 16: Requires_Checklist
      JSON.stringify(steps[0].checklistItems || []),// 17: Checklist_Items
      JSON.stringify(steps[0].attachments || []),   // 18: Attachments
      steps[0].triggersFMSId || ''                  // 19: Triggers_FMS_ID
    ]);
    
    return {
      success: true,
      projectId: projectId,
      message: 'Project created successfully'
    };
  } catch (error) {
    Logger.log('Error creating project: ' + error.toString());
    return { success: false, message: 'Error creating project: ' + error.toString() };
  }
}

function getAllProjects() {
  try {
    const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
    const masterSheet = FMS_SS.getSheetByName('FMS_MASTER');
    
    if (!progressSheet) {
      return { success: false, message: 'FMS_PROGRESS sheet not found' };
    }
    
    const data = progressSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, projects: [] };
    }
    
    // Get total step counts from FMS_MASTER
    const fmsStepCounts = {};
    if (masterSheet) {
      const masterData = masterSheet.getDataRange().getValues();
      for (let i = 1; i < masterData.length; i++) {
        const fmsId = masterData[i][0];
        const stepNo = masterData[i][2];
        if (!fmsStepCounts[fmsId]) {
          fmsStepCounts[fmsId] = 0;
        }
        fmsStepCounts[fmsId] = Math.max(fmsStepCounts[fmsId], stepNo);
      }
    }
    
    const projectMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const projectId = row[0];
      const fmsId = row[1];
      
      if (!projectMap[projectId]) {
        projectMap[projectId] = {
          projectId: projectId,
          fmsId: fmsId,
          projectName: row[2],
          totalStepsInTemplate: fmsStepCounts[fmsId] || 0, // Total from template
          tasks: []
        };
      }
      
      // Parse checklist and attachments from Progress sheet
      // Column mapping: 0: Project_ID, 1: FMS_ID, 2: Project_Name, 3: Step_No, 4: WHAT, 5: WHO, 6: HOW,
      // 7: Planned_Due_Date, 8: Actual_Completed_On, 9: Status, 10: Completed_By,
      // 11: Is_First_Step, 12: Created_By, 13: Created_On, 14: Last_Updated_By,
      // 15: Last_Updated_On, 16: Requires_Checklist, 17: Checklist_Items, 18: Attachments
      
      let checklistItems = [];
      let attachments = [];
      
      try {
        if (row[17]) { // Checklist_Items is column 17
          checklistItems = JSON.parse(row[17]);
          // Ensure each checklist item has all required fields
          if (Array.isArray(checklistItems)) {
            checklistItems = checklistItems.map(item => ({
              id: item.id || `checklist-${Date.now()}-${Math.random()}`,
              text: item.text || '',
              completed: item.completed === true // Ensure boolean
            }));
          }
        }
      } catch (e) {
        Logger.log('Error parsing checklist from progress: ' + e.toString());
      }
      
      try {
        if (row[18]) attachments = JSON.parse(row[18]); // Attachments is column 18
      } catch (e) {
        // Ignore parse errors
      }
      
      projectMap[projectId].tasks.push({
        rowIndex: i + 1,
        stepNo: row[3],
        what: row[4],
        who: row[5],
        how: row[6],
        plannedDueDate: row[7],
        actualCompletedOn: row[8],
        status: row[9],
        completedBy: row[10] || '',
        isFirstStep: row[11] === 'true' || row[11] === true,
        projectId: projectId,
        projectName: row[2],
        requiresChecklist: row[16] === 'TRUE' || row[16] === true || row[16] === 'true', // Requires_Checklist is column 16
        checklistItems: checklistItems,
        attachments: attachments
      });
    }
    
    return {
      success: true,
      projects: Object.values(projectMap)
    };
  } catch (error) {
    Logger.log('Error getting all projects: ' + error.toString());
    return { success: false, message: 'Error getting all projects: ' + error.toString() };
  }
}

function getProjectsByUser(username) {
  try {
    const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
    if (!progressSheet) {
      return { success: false, message: 'FMS_PROGRESS sheet not found' };
    }
    
    const data = progressSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, tasks: [] };
    }
    
    const tasks = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[5] === username) {
        // Parse checklist and attachments from progress sheet
        // Column mapping: 0: Project_ID, 1: FMS_ID, 2: Project_Name, 3: Step_No, 4: WHAT, 5: WHO, 6: HOW,
        // 7: Planned_Due_Date, 8: Actual_Completed_On, 9: Status, 10: Completed_By,
        // 11: Is_First_Step, 12: Created_By, 13: Created_On, 14: Last_Updated_By,
        // 15: Last_Updated_On, 16: Requires_Checklist, 17: Checklist_Items, 18: Attachments
        
        let checklistItems = [];
        let attachments = [];
        
        try {
          if (row[17]) { // Checklist_Items is column 17
            checklistItems = JSON.parse(row[17]);
            // Ensure each checklist item has all required fields
            if (Array.isArray(checklistItems)) {
              checklistItems = checklistItems.map(item => ({
                id: item.id || `checklist-${Date.now()}-${Math.random()}`,
                text: item.text || '',
                completed: item.completed === true // Ensure boolean
              }));
            }
          }
        } catch (e) {
          Logger.log('Error parsing checklist from progress: ' + e.toString());
        }
        
        try {
          if (row[18]) attachments = JSON.parse(row[18]); // Attachments is column 18
        } catch (e) {
          Logger.log('Error parsing attachments from progress: ' + e.toString());
        }
        
        tasks.push({
          rowIndex: i + 1,
          projectId: row[0],
          projectName: row[2],
          stepNo: row[3],
          what: row[4],
          who: row[5],
          how: row[6],
          plannedDueDate: row[7],
          actualCompletedOn: row[8],
          status: row[9],
          completedBy: row[10] || '',
          isFirstStep: row[11] === 'true' || row[11] === true,
          requiresChecklist: row[16] === 'TRUE' || row[16] === true || row[16] === 'true', // Requires_Checklist is column 16
          checklistItems: checklistItems,
          attachments: attachments
        });
      }
    }
    
    return {
      success: true,
      tasks: tasks
    };
  } catch (error) {
    Logger.log('Error getting projects by user: ' + error.toString());
    return { success: false, message: 'Error getting projects by user: ' + error.toString() };
  }
}

/**
 * Submit progress with attachments - handles file uploads to Drive
 */
function submitProgressWithAttachments(params) {
  try {
    const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
    const masterSheet = FMS_SS.getSheetByName('FMS_MASTER');
    
    if (!progressSheet || !masterSheet) {
      return { success: false, message: 'Required sheets not found' };
    }
    
    const {
      projectId,
      fmsId,
      stepNo,
      status,
      username,
      attachments = [],
      checklistItems = []
    } = params;
    
    const timestamp = new Date().toISOString();
    
    // Process attachments - upload to Drive if they contain file data
    const processedAttachments = [];
    
    for (const attachment of attachments) {
      if (attachment.data && attachment.name && attachment.mimeType) {
        // This is a file that needs to be uploaded
        const uploadResult = uploadFileToDrive({
          fileData: attachment.data,
          fileName: attachment.name,
          mimeType: attachment.mimeType,
          uploadedBy: username,
          context: `FMS-Progress-${projectId}-Step${stepNo}`
        });
        
        if (uploadResult.success) {
          processedAttachments.push({
            id: uploadResult.file.id,
            name: uploadResult.file.name,
            url: uploadResult.file.url,
            uploadedOn: uploadResult.file.uploadedOn,
            uploadedBy: uploadResult.file.uploadedBy
          });
        }
      } else if (attachment.url) {
        // This is already a Drive file
        processedAttachments.push(attachment);
      }
    }
    
    // Find the row to update
    const data = progressSheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === projectId && row[3] === stepNo) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, message: 'Task not found' };
    }
    
    // Update the task
    progressSheet.getRange(rowIndex, 9).setValue(status === 'Done' ? timestamp : '');
    progressSheet.getRange(rowIndex, 10).setValue(status);
    progressSheet.getRange(rowIndex, 11).setValue(status === 'Done' ? username : '');
    progressSheet.getRange(rowIndex, 15).setValue(username);
    progressSheet.getRange(rowIndex, 16).setValue(timestamp);
    // Update checklist and attachments in correct columns
    progressSheet.getRange(rowIndex, 17).setValue(JSON.stringify(checklistItems));
    progressSheet.getRange(rowIndex, 18).setValue(JSON.stringify(processedAttachments));
    
    // If task is completed, create next step
    if (status === 'Done') {
      const currentRow = progressSheet.getRange(rowIndex, 1, 1, 18).getValues()[0];
      const currentStepNo = currentRow[3];
      
      const masterData = masterSheet.getDataRange().getValues();
      const allSteps = [];
      
      for (let i = 1; i < masterData.length; i++) {
        const row = masterData[i];
        if (row[0] === fmsId) {
          // Parse checklist and attachments for next step
          let nextChecklistItems = [];
          let nextAttachments = [];
          
          try {
            if (row[15]) {
              nextChecklistItems = JSON.parse(row[15]);
              // Initialize 'completed' field for next step
              nextChecklistItems = nextChecklistItems.map(item => ({
                id: item.id,
                text: item.text,
                completed: false // Initialize as not completed
              }));
            }
          } catch (e) {
            // Ignore
          }
          
          try {
            if (row[16]) nextAttachments = JSON.parse(row[16]);
          } catch (e) {
            // Ignore
          }
          
          allSteps.push({
            stepNo: row[2],
            what: row[3],
            who: row[4],
            how: row[5],
            when: row[6],
            whenDays: row[8] || Math.floor(row[6]),
            whenHours: row[9] || Math.round((row[6] % 1) * 24),
            requiresChecklist: row[14] || false,
            checklistItems: nextChecklistItems,
            attachments: nextAttachments
          });
        }
      }
      
      allSteps.sort((a, b) => a.stepNo - b.stepNo);
      
      const nextStep = allSteps.find(s => s.stepNo === currentStepNo + 1);
      
      if (nextStep) {
        const completionDate = new Date(timestamp);
        completionDate.setDate(completionDate.getDate() + parseInt(nextStep.whenDays));
        completionDate.setHours(completionDate.getHours() + parseInt(nextStep.whenHours));
        
        // For Progress sheet, include checklist items with 'completed' field
        progressSheet.appendRow([
          projectId,
          fmsId,
          currentRow[2], // projectName
          nextStep.stepNo,
          nextStep.what,
          nextStep.who,
          nextStep.how,
          completionDate.toISOString(),
          '',
          'Pending',
          '',
          'false',
          username,
          timestamp,
          username,
          timestamp,
          nextStep.requiresChecklist || false,
          JSON.stringify(nextStep.checklistItems || []),
          JSON.stringify(nextStep.attachments || [])
        ]);
      }
    }
    
    return {
      success: true,
      message: 'Progress submitted successfully',
      attachments: processedAttachments
    };
    
  } catch (error) {
    Logger.log('Error submitting progress: ' + error.toString());
    return { success: false, message: 'Error submitting progress: ' + error.toString() };
  }
}

function getAllLogs() {
  try {
    const masterSheet = FMS_SS.getSheetByName('FMS_MASTER');
    const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
    
    if (!masterSheet || !progressSheet) {
      return { success: false, message: 'Required sheets not found' };
    }
    
    const logs = [];
    
    const masterData = masterSheet.getDataRange().getValues();
    const fmsCreations = {};
    
    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const fmsId = row[0];
      if (!fmsCreations[fmsId]) {
        fmsCreations[fmsId] = {
          type: 'FMS_CREATED',
          fmsId: fmsId,
          fmsName: row[1],
          createdBy: row[10],
          createdOn: row[11]
        };
      }
    }
    
    logs.push(...Object.values(fmsCreations));
    
    const progressData = progressSheet.getDataRange().getValues();
    const projectCreations = {};
    
    for (let i = 1; i < progressData.length; i++) {
      const row = progressData[i];
      const projectId = row[0];
      if (!projectCreations[projectId]) {
        projectCreations[projectId] = {
          type: 'PROJECT_CREATED',
          projectId: projectId,
          projectName: row[2],
          createdBy: row[12],
          createdOn: row[13]
        };
      }
      
      if (row[14] !== row[12]) {
        logs.push({
          type: 'TASK_UPDATED',
          projectId: projectId,
          projectName: row[2],
          stepNo: row[3],
          what: row[4],
          status: row[9],
          updatedBy: row[14],
          updatedOn: row[15]
        });
      }
    }
    
    logs.push(...Object.values(projectCreations));
    
    logs.sort((a, b) => {
      const dateA = new Date(a.createdOn || a.updatedOn);
      const dateB = new Date(b.createdOn || b.updatedOn);
      return dateB - dateA;
    });
    
    return {
      success: true,
      logs: logs
    };
  } catch (error) {
    Logger.log('Error getting logs: ' + error.toString());
    return { success: false, message: 'Error getting logs: ' + error.toString() };
  }
}

/**
 * Update task status in FMS_PROGRESS sheet
 */
function updateTaskStatus(rowIndex, status, username) {
  try {
    const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
    if (!progressSheet) {
      return { success: false, message: 'FMS_PROGRESS sheet not found' };
    }
    
    // Ensure rowIndex is a valid integer
    const validRowIndex = parseInt(rowIndex);
    if (isNaN(validRowIndex) || validRowIndex < 2) {
      return { success: false, message: 'Invalid row index: ' + rowIndex };
    }
    
    const timestamp = new Date().toISOString();
    
    // Update the task status and completion info
    progressSheet.getRange(validRowIndex, 9).setValue(status === 'Done' ? timestamp : ''); // Actual_Completed_On
    progressSheet.getRange(validRowIndex, 10).setValue(status); // Status
    progressSheet.getRange(validRowIndex, 11).setValue(status === 'Done' ? username : ''); // Completed_By
    progressSheet.getRange(validRowIndex, 15).setValue(username); // Last_Updated_By
    progressSheet.getRange(validRowIndex, 16).setValue(timestamp); // Last_Updated_On
    
    // If task is completed, create next step and check for FMS triggers
    if (status === 'Done') {
      const currentRow = progressSheet.getRange(validRowIndex, 1, 1, 20).getValues()[0];  // Extended to column 20
      const currentStepNo = currentRow[3];
      const projectId = currentRow[0];
      const fmsId = currentRow[1];
      const projectName = currentRow[2];
      const triggersFMSId = currentRow[19];  // Column 19: Triggers_FMS_ID
      
      // Check if this step triggers another FMS
      if (triggersFMSId && triggersFMSId.toString().trim() !== '') {
        Logger.log('Step triggers FMS: ' + triggersFMSId);
        
        // Auto-create a new project from the triggered FMS
        const triggeredProjectName = projectName + ' - Auto (from ' + currentRow[4] + ')';
        const triggeredProjectResult = createProject({
          fmsId: triggersFMSId,
          projectName: triggeredProjectName,
          projectStartDate: timestamp,  // Start immediately
          username: username
        });
        
        if (triggeredProjectResult.success) {
          Logger.log('✓ Auto-triggered FMS project: ' + triggeredProjectName);
        } else {
          Logger.log('✗ Failed to auto-trigger FMS: ' + triggeredProjectResult.message);
        }
      }
      
      // Get next step from FMS_MASTER
      const masterSheet = FMS_SS.getSheetByName('FMS_MASTER');
      if (masterSheet) {
        const masterData = masterSheet.getDataRange().getValues();
        const allSteps = [];
        
        for (let i = 1; i < masterData.length; i++) {
          const row = masterData[i];
          if (row[0] === fmsId) {
            // Parse checklist and attachments for next step
            let nextChecklistItems = [];
            let nextAttachments = [];
            
            try {
              if (row[15]) {
                nextChecklistItems = JSON.parse(row[15]);
                // Initialize 'completed' field for next step
                nextChecklistItems = nextChecklistItems.map(item => ({
                  id: item.id,
                  text: item.text,
                  completed: false // Initialize as not completed
                }));
              }
            } catch (e) {
              // Ignore
            }
            
            try {
              if (row[16]) nextAttachments = JSON.parse(row[16]);
            } catch (e) {
              // Ignore
            }
            
            allSteps.push({
              stepNo: row[2],
              what: row[3],
              who: row[4],
              how: row[5],
              when: row[6],
              whenDays: row[8] || Math.floor(row[6]),
              whenHours: row[9] || Math.round((row[6] % 1) * 24),
              requiresChecklist: row[14] || false,
              checklistItems: nextChecklistItems,
              attachments: nextAttachments,
              triggersFMSId: row[17] || ''  // Column 17: Triggers_FMS_ID
            });
          }
        }
        
        allSteps.sort((a, b) => a.stepNo - b.stepNo);
        
        const nextStep = allSteps.find(s => s.stepNo === currentStepNo + 1);
        
        if (nextStep) {
          const completionDate = new Date(timestamp);
          completionDate.setDate(completionDate.getDate() + parseInt(nextStep.whenDays));
          completionDate.setHours(completionDate.getHours() + parseInt(nextStep.whenHours));
          
          // For Progress sheet, include checklist items with 'completed' field
          progressSheet.appendRow([
            projectId,
            fmsId,
            currentRow[2], // projectName
            nextStep.stepNo,
            nextStep.what,
            nextStep.who,
            nextStep.how,
            completionDate.toISOString(),
            '',
            'Pending',
            '',
            'false',
            username,
            timestamp,
            username,
            timestamp,
            nextStep.requiresChecklist || false,
            JSON.stringify(nextStep.checklistItems || []),
            JSON.stringify(nextStep.attachments || []),
            nextStep.triggersFMSId || ''  // Triggers_FMS_ID
          ]);
        }
      }
    }
    
    return {
      success: true,
      message: 'Task status updated successfully'
    };
    
  } catch (error) {
    Logger.log('Error updating task status: ' + error.toString());
    return { success: false, message: 'Error updating task status: ' + error.toString() };
  }
}

// ===== TASK MANAGEMENT SYSTEM =====

/**
 * Get users from Task Management Credentials sheet
 */
function getTaskUsers() {
  try {
    const sheet = SpreadsheetApp.openById(CREDENTIALS_SHEET_ID).getSheetByName('Credentials');
    if (!sheet) throw new Error('Credentials sheet not found');
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, users: [] };
    
    const users = data.slice(1)
      .filter(row => row[0] && row[0].toString().trim())
      .map(row => ({
        userId: row[0].toString().trim(),
        name: row[0].toString().trim(),
        department: row[2] ? row[2].toString().trim() : 'No Department',
        email: row[3] ? row[3].toString().trim() : ''
      }))
      .sort((a, b) => (a.department + a.name).localeCompare(b.department + b.name));
    
    return { success: true, users: users };
  } catch (error) {
    Logger.log('Error getting task users: ' + error.toString());
    return { success: false, message: 'Error getting task users: ' + error.toString() };
  }
}

/**
 * Assign a new task with auto-generated ID
 */
function assignTask(taskData) {
  try {
    // Validate required fields
    if (!taskData.assignedTo) {
      return { success: false, message: 'Assigned To user is required' };
    }
    if (!taskData.description) {
      return { success: false, message: 'Task description is required' };
    }
    if (!taskData.plannedDate) {
      return { success: false, message: 'Planned date is required' };
    }
    
    const sheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('MASTER');
    if (!sheet) {
      Logger.log('ERROR: MASTER sheet not found. Please run initializeAllSheets() function.');
      return { success: false, message: 'MASTER sheet not found. Please contact administrator.' };
    }
    
    const lastRow = sheet.getLastRow();
    
    let nextTaskId = 'AT-1';
    if (lastRow > 1) {
      const lastTaskId = sheet.getRange(lastRow, 1).getValue();
      if (lastTaskId && lastTaskId.toString().startsWith("AT-")) {
        const lastNumber = parseInt(lastTaskId.toString().split("-")[1], 10) || 0;
        nextTaskId = "AT-" + (lastNumber + 1);
      }
    }
    
    const plannedDate = new Date(taskData.plannedDate);
    const formattedDate = formatDateForSheet(plannedDate);
    
    const newRow = [
      nextTaskId,                                    // 1. Task Id
      taskData.givenBy || '',                        // 2. GIVEN BY
      taskData.assignedTo || '',                     // 3. GIVEN TO
      taskData.assignedTo || '',                     // 4. GIVEN TO USER ID
      taskData.description || '',                    // 5. TASK DESCRIPTION
      taskData.tutorialLinks || '',                  // 6. HOW TO DO- TUTORIAL LINKS
      taskData.department || '',                     // 7. DEPARTMENT
      'One Time Only',                               // 8. TASK FREQUENCY
      formattedDate,                                 // 9. PLANNED DATE
      'Pending',                                     // 10. Task Status
      '',                                            // 11. completed on
      '',                                            // 12. Task Completed On
      '',                                            // 13. Revision 1 Date
      '',                                            // 14. Reason for Revision
      '',                                            // 15. On time or not?
      0,                                             // 16. Revision Count
      '',                                            // 17. Revision Penalty
      '',                                            // 18. Calculated Score
      JSON.stringify(taskData.attachments || [])     // 19. Attachments
    ];
    
    sheet.appendRow(newRow);
    
    // Send email notification
    try {
      const credSheet = SpreadsheetApp.openById(CREDENTIALS_SHEET_ID).getSheetByName('Credentials');
      const credData = credSheet.getDataRange().getValues();
      let recipientEmail = "";
      
      for (let i = 1; i < credData.length; i++) {
        if (credData[i][0] == taskData.assignedTo) {
          recipientEmail = credData[i][3];
          break;
        }
      }
      
      if (recipientEmail) {
        const subject = `New Task Assigned – ${taskData.description} (Due: ${formattedDate})`;
        const tutorialLink = taskData.tutorialLinks ? 
          `<a href="${taskData.tutorialLinks}" target="_blank">${taskData.tutorialLinks}</a>` : "N/A";
        
        // Build attachments HTML if there are any
        let attachmentsHtml = '';
        if (taskData.attachments && taskData.attachments.length > 0) {
          attachmentsHtml = '<tr><td style="border:1px solid #444; padding:8px;"><b>Attachments</b></td><td style="border:1px solid #444; padding:8px;">';
          taskData.attachments.forEach((att, idx) => {
            if (att.url && att.name) {
              attachmentsHtml += `<div>${idx + 1}. <a href="${att.url}" target="_blank">${att.name}</a></div>`;
            }
          });
          attachmentsHtml += '</td></tr>';
        }
        
        const body = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://amgrealty.in/wp-content/uploads/2025/05/AMG-logo-600x1024.png" alt="AMG Logo" width="120"/>
          </div>
          
          <p>Hello <b>${taskData.assignedTo}</b>,</p>
          <p>A new task has been assigned to you. Please find the details below:</p>
          
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr>
              <td style="border:1px solid #444; padding:8px;"><b>Task ID</b></td>
              <td style="border:1px solid #444; padding:8px;">${nextTaskId}</td>
            </tr>
            <tr>
              <td style="border:1px solid #444; padding:8px;"><b>Assigned By</b></td>
              <td style="border:1px solid #444; padding:8px;">${taskData.givenBy}</td>
            </tr>
            <tr>
              <td style="border:1px solid #444; padding:8px;"><b>Department</b></td>
              <td style="border:1px solid #444; padding:8px;">${taskData.department || "N/A"}</td>
            </tr>
            <tr>
              <td style="border:1px solid #444; padding:8px;"><b>Task Description</b></td>
              <td style="border:1px solid #444; padding:8px;">${taskData.description}</td>
            </tr>
            <tr>
              <td style="border:1px solid #444; padding:8px;"><b>Planned Date</b></td>
              <td style="border:1px solid #444; padding:8px;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="border:1px solid #444; padding:8px;"><b>Tutorial Link</b></td>
              <td style="border:1px solid #444; padding:8px;">${tutorialLink}</td>
            </tr>
            ${attachmentsHtml}
          </table>
          
          <p>Please ensure that the task is completed within the planned schedule.</p>
          
          <p>Best regards,<br><b>AMG Systems</b></p>
        </div>
        `;
        
        GmailApp.sendEmail(recipientEmail, subject, '', { htmlBody: body });
      }
    } catch (emailError) {
      Logger.log('Email notification failed: ' + emailError.toString());
    }
    
    return { success: true, taskId: nextTaskId, message: 'Task assigned & email sent successfully' };
    
  } catch (error) {
    Logger.log('Error assigning task: ' + error.toString());
    return { success: false, message: 'Error assigning task: ' + error.toString() };
  }
}

/**
 * Get all tasks for a user with optional filtering
 */
function getTasks(userId, filter) {
  try {
    const sheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('MASTER');
    if (!sheet) {
      Logger.log('ERROR: MASTER sheet not found. Please run initializeAllSheets() function.');
      return { success: false, message: 'MASTER sheet not found. Please contact administrator.', tasks: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, tasks: [] };
    
    const headers = data[0].map(h => (h || '').toString().trim());
    const tasks = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const givenToUserId = (row[headers.indexOf('GIVEN TO USER ID')] || '').toString().trim();
      if (givenToUserId !== userId) continue;
      
      const task = {};
      headers.forEach((header, idx) => {
        let value = row[idx];
        if (header === 'PLANNED DATE' || header === 'completed on') {
          const parsed = parseDMYDate(value);
          task[header] = parsed ? formatDateToISO(parsed) : '';
        } else if (header.toLowerCase() === 'attachments') {
          // Parse attachments JSON string
          try {
            task[header] = value ? JSON.parse(value) : [];
          } catch (e) {
            task[header] = [];
          }
        } else {
          task[header] = (value || '').toString();
        }
      });
      
      task['Task Status'] = task['Task Status'] || '';
      task['PLANNED DATE'] = task['PLANNED DATE'] || '';
      task['Task Completed On'] = task['completed on'] || '';
      
      const status = task['Task Status'].toLowerCase();
      const matchesFilter =
        filter === 'all' ||
        (filter === 'pending' && (status === 'pending' || status === '')) ||
        (filter === 'completed' && status === 'completed') ||
        (filter === 'revisions' && (status === 'revise' || status === 'revision'));
      
      if (matchesFilter) tasks.push(task);
    }
    
    return { success: true, tasks: tasks };
  } catch (error) {
    Logger.log('getTasks error: ' + error.toString());
    return { success: false, message: error.toString(), tasks: [] };
  }
}

/**
 * Get task summary counts for dashboard
 */
function getTaskSummary(userId) {
  try {
    const result = getTasks(userId, 'all');
    if (!result.success) return result;
    
    const tasks = result.tasks;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let upcoming = 0, pending = 0, completed = 0, revisions = 0, overdue = 0;
    
    tasks.forEach(task => {
      const status = (task['Task Status'] || '').toLowerCase();
      if (status === 'completed') {
        completed++;
      } else if (status === 'revise' || status === 'revision') {
        revisions++;
      } else {
        const plannedDateStr = task['PLANNED DATE'];
        if (plannedDateStr) {
          const plannedDate = new Date(plannedDateStr);
          if (!isNaN(plannedDate.getTime())) {
            plannedDate.setHours(0, 0, 0, 0);
            if (plannedDate > today) {
              upcoming++;
            } else {
              pending++;
            }
            if (plannedDate < today) {
              overdue++;
            }
          } else {
            pending++;
          }
        } else {
          pending++;
        }
      }
    });
    
    return {
      success: true,
      summary: { upcoming, pending, completed, revisions, overdue, total: tasks.length }
    };
  } catch (error) {
    Logger.log('getTaskSummary error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * Update a task (mark as complete or request revision)
 */
function updateTask(taskId, action, extraData) {
  try {
    const sheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('MASTER');
    if (!sheet) {
      Logger.log('ERROR: MASTER sheet not found. Please run initializeAllSheets() function.');
      return { success: false, message: 'MASTER sheet not found. Please contact administrator.' };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => (h || '').toString().trim());
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === taskId.toString()) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex === -1) return { success: false, message: 'Task not found' };
    
    const statusCol = headers.indexOf('Task Status') + 1;
    const completedOnCol = headers.indexOf('completed on') + 1;
    const newDateCol = headers.indexOf('Revision 1 Date') + 1;
    const reasonCol = headers.indexOf('Reason for Revision') + 1;
    const plannedDateCol = headers.indexOf('PLANNED DATE') + 1;
    const onTimeCol = headers.indexOf('On time or not?') + 1;
    
    if (action === 'complete') {
      if (statusCol > 0) sheet.getRange(rowIndex, statusCol).setValue('Completed');
      if (completedOnCol > 0) sheet.getRange(rowIndex, completedOnCol).setValue(new Date());
      
      if (plannedDateCol > 0 && onTimeCol > 0) {
        const plannedVal = sheet.getRange(rowIndex, plannedDateCol).getValue();
        const plannedDate = parseDMYDate(plannedVal);
        const completedDate = new Date();
        let onTimeStatus = 'Not On Time';
        
        if (plannedDate && !isNaN(plannedDate.getTime())) {
          plannedDate.setHours(0, 0, 0, 0);
          const compDateNorm = new Date(completedDate);
          compDateNorm.setHours(0, 0, 0, 0);
          if (compDateNorm <= plannedDate) onTimeStatus = 'On Time';
        }
        sheet.getRange(rowIndex, onTimeCol).setValue(onTimeStatus);
      }
      
      return { success: true, message: 'Task marked as completed' };
    }
    
    if (action === 'revise') {
      if (statusCol > 0) sheet.getRange(rowIndex, statusCol).setValue('Revise');
      
      if (extraData.newDate && newDateCol > 0) {
        sheet.getRange(rowIndex, newDateCol).setValue(new Date(extraData.newDate));
      }
      
      if (extraData.reason && reasonCol > 0) {
        sheet.getRange(rowIndex, reasonCol).setValue(extraData.reason);
      }
      
      return { success: true, message: 'Task marked for revision' };
    }
    
    return { success: false, message: 'Invalid action' };
  } catch (error) {
    Logger.log('updateTask error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * Batch update multiple tasks
 */
function batchUpdateTasks(updates) {
  try {
    const results = [];
    updates.forEach(update => {
      const result = updateTask(update.taskId, update.action, update.extraData || {});
      results.push(result);
    });
    
    return {
      success: true,
      results: results
    };
  } catch (error) {
    Logger.log('Batch update error: ' + error.toString());
    return {
      success: false,
      message: 'Batch update error: ' + error.toString()
    };
  }
}

/**
 * Get unified scoring/performance data for a user within a date range
 * Includes BOTH Task Management tasks AND FMS project tasks
 */
function getScoringData(request) {
  const { personId, startDate, endDate } = request;
  try {
    const parseDate = (value) => {
      if (!value) return null;
      let date;
      if (value instanceof Date) {
        date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
      } else if (typeof value === 'string') {
        if (value.includes('/')) {
          const [d, m, y] = value.split('/').map(Number);
          date = new Date(y, m - 1, d);
        } else {
          date = new Date(value);
        }
      }
      return date && !isNaN(date.getTime()) ? date : null;
    };
    
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end) throw new Error('Invalid date range');
    
    let totalTasks = 0;
    let completedTasks = 0;
    let dueNotCompleted = 0;
    let completedOnTime = 0;
    let completedNotOnTime = 0;
    let revisionsTaken = 0;
    let scoresImpacted = 0;
    let totalScoreSum = 0;
    
    // ===== PART 1: Task Management Scoring =====
    try {
      const tmSheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('SCORING');
      if (tmSheet) {
        const tmData = tmSheet.getDataRange().getValues();
        
        const cols = {
          userId: 3,
          status: 9,
          plannedDate: 8,
          revisionCount: 17,
          revisionPenalty: 18,
          onTimeStatus: 19,
          calculatedScore: 20
        };
        
        for (let i = 1; i < tmData.length; i++) {
          const row = tmData[i];
          if (row[cols.userId] !== personId) continue;
          
          const plannedDate = parseDate(row[cols.plannedDate]);
          if (!plannedDate) continue;
          
          if (plannedDate < start || plannedDate > end) continue;
          
          totalTasks++;
          const status = (row[cols.status] || '').toString().trim();
          const onTime = (row[cols.onTimeStatus] || '').toString().trim();
          const revisionCount = parseInt(row[cols.revisionCount]) || 0;
          const hasPenalty = (row[cols.revisionPenalty] || '').toString().trim() === 'Yes';
          const score = parseFloat(row[cols.calculatedScore]) || 0;
          
          if (status === 'Completed') {
            completedTasks++;
            if (onTime === 'On Time') {
              completedOnTime++;
            } else if (onTime === 'Not On Time') {
              completedNotOnTime++;
            }
          } else {
            dueNotCompleted++;
          }
          
          revisionsTaken += revisionCount;
          if (hasPenalty) scoresImpacted += revisionCount;
          totalScoreSum += score;
        }
      }
    } catch (e) {
      Logger.log('Task Management scoring skipped: ' + e.toString());
    }
    
    // ===== PART 2: FMS Project Tasks Scoring =====
    try {
      const fmsProgressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
      if (fmsProgressSheet) {
        const fmsData = fmsProgressSheet.getDataRange().getValues();
        
        // Column indices for FMS_PROGRESS
        // 0: Project_ID, 1: FMS_ID, 2: Project_Name, 3: Step_No, 4: WHAT, 
        // 5: WHO, 6: HOW, 7: Planned_Due_Date, 8: Actual_Completed_On, 9: Status
        
        for (let i = 1; i < fmsData.length; i++) {
          const row = fmsData[i];
          const assignedTo = (row[5] || '').toString().trim(); // WHO column
          if (assignedTo !== personId) continue;
          
          const plannedDate = parseDate(row[7]); // Planned_Due_Date
          if (!plannedDate) continue;
          
          if (plannedDate < start || plannedDate > end) continue;
          
          totalTasks++;
          const status = (row[9] || '').toString().trim(); // Status
          const actualCompletedOn = row[8]; // Actual_Completed_On
          
          if (status === 'Done') {
            completedTasks++;
            
            // Determine if completed on time
            const completedDate = parseDate(actualCompletedOn);
            if (completedDate) {
              if (completedDate <= plannedDate) {
                completedOnTime++;
                totalScoreSum += 1; // Full score for on-time
              } else {
                completedNotOnTime++;
                totalScoreSum += 0.5; // Partial score for late
              }
            } else {
              // Completed but no date recorded, assume on time
              completedOnTime++;
              totalScoreSum += 1;
            }
          } else {
            // Check if overdue
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (plannedDate < now) {
              dueNotCompleted++;
              // No score added for incomplete tasks
            }
          }
        }
      }
    } catch (e) {
      Logger.log('FMS scoring skipped: ' + e.toString());
    }
    
    // ===== Calculate Final Score =====
    const finalScore = totalTasks > 0 
      ? ((totalScoreSum / totalTasks) * 100).toFixed(2) 
      : "100.00";
    
    return {
      success: true,
      data: {
        totalTasks,
        completedTasks,
        dueNotCompleted,
        completedOnTime,
        completedNotOnTime,
        revisionsTaken,
        scoresImpacted,
        totalScoreSum: parseFloat(totalScoreSum.toFixed(2)),
        finalScore: parseFloat(finalScore)
      }
    };
    
  } catch (error) {
    Logger.log('Scoring error: ' + error.toString());
    return { success: false, message: 'Error calculating score: ' + error.toString() };
  }
}

// ===== FMS REVISION SYSTEM =====

/**
 * Get or create FMS_REVISIONS sheet
 */
function getFMSRevisionsSheet() {
  let sheet = FMS_SS.getSheetByName('FMS_REVISIONS');
  if (!sheet) {
    sheet = FMS_SS.insertSheet('FMS_REVISIONS');
    // Add headers
    sheet.appendRow([
      'Revision_ID',
      'Project_ID',
      'Project_Name',
      'Step_No',
      'Task_Description',
      'Row_Index',
      'Current_Due_Date',
      'Requested_New_Date',
      'Requested_By',
      'Requested_On',
      'Reason',
      'Status',
      'Approved_By',
      'Approved_On',
      'Rejected_By',
      'Rejected_On'
    ]);
  }
  return sheet;
}

/**
 * Request FMS task revision
 */
function requestFMSRevision(params) {
  try {
    const revisionsSheet = getFMSRevisionsSheet();
    
    // ✅ CHECK: Prevent duplicate pending revisions for same task
    const data = revisionsSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const existingProjectId = row[1];
      const existingStepNo = row[3];
      const existingRowIndex = row[5];
      const existingStatus = row[11];
      
      // Check if same task (project + step or row index) has pending revision
      if (existingStatus === 'Pending') {
        const isSameTask = (existingProjectId === params.projectId && existingStepNo === params.stepNo) ||
                          (existingRowIndex === params.rowIndex);
        
        if (isSameTask) {
          return {
            success: false,
            message: 'A revision request is already pending for this task. Please wait for approval or rejection before submitting another request.',
            alreadyPending: true
          };
        }
      }
    }
    
    const timestamp = new Date().toISOString();
    const revisionId = 'REV-' + Date.now();
    
    // Add revision request
    revisionsSheet.appendRow([
      revisionId,
      params.projectId,
      params.projectName,
      params.stepNo,
      params.taskDescription,
      params.rowIndex,
      params.currentDueDate,
      params.requestedNewDate || '',
      params.requestedBy,
      timestamp,
      params.reason,
      'Pending',
      '', '', '', ''
    ]);
    
    // Log the revision request
    logFMSActivity({
      type: 'REVISION_REQUESTED',
      projectId: params.projectId,
      projectName: params.projectName,
      stepNo: params.stepNo,
      taskDescription: params.taskDescription,
      requestedBy: params.requestedBy,
      reason: params.reason,
      timestamp: timestamp
    });
    
    return {
      success: true,
      revisionId: revisionId,
      message: 'Revision request submitted successfully'
    };
  } catch (error) {
    Logger.log('requestFMSRevision error: ' + error.toString());
    return { success: false, message: 'Error requesting revision: ' + error.toString() };
  }
}

/**
 * Get FMS revision requests for a creator (where they are the GIVEN BY person)
 */
function getFMSRevisions(userId) {
  try {
    const revisionsSheet = getFMSRevisionsSheet();
    const data = revisionsSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, revisions: [] };
    }
    
    const revisions = [];
    const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
    const progressData = progressSheet ? progressSheet.getDataRange().getValues() : [];
    
    // Find projects created by this user
    const userProjects = new Set();
    for (let i = 1; i < progressData.length; i++) {
      const row = progressData[i];
      // Check if user is the creator (Created_By column)
      if (row[12] === userId) {
        userProjects.add(row[0]); // Project_ID
      }
    }
    
    // Get pending revisions for user's projects
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const projectId = row[1];
      const status = row[11];
      
      if (status === 'Pending' && userProjects.has(projectId)) {
        revisions.push({
          revisionId: row[0],
          projectId: projectId,
          projectName: row[2],
          stepNo: row[3],
          taskDescription: row[4],
          rowIndex: row[5],
          currentDueDate: row[6],
          requestedNewDate: row[7],
          requestedBy: row[8],
          requestedOn: row[9],
          reason: row[10],
          status: status
        });
      }
    }
    
    return { success: true, revisions: revisions };
  } catch (error) {
    Logger.log('getFMSRevisions error: ' + error.toString());
    return { success: false, message: 'Error getting revisions: ' + error.toString() };
  }
}

/**
 * Approve FMS revision - updates task date and logs change
 */
function approveFMSRevision(params) {
  try {
    const revisionsSheet = getFMSRevisionsSheet();
    const data = revisionsSheet.getDataRange().getValues();
    
    // Find the revision
    let revisionRowIndex = -1;
    let revision = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === params.revisionId) {
        revisionRowIndex = i + 1;
        revision = data[i];
        break;
      }
    }
    
    if (revisionRowIndex === -1) {
      return { success: false, message: 'Revision not found' };
    }
    
    const timestamp = new Date().toISOString();
    
    // Update revision status
    revisionsSheet.getRange(revisionRowIndex, 12).setValue('Approved');
    revisionsSheet.getRange(revisionRowIndex, 13).setValue(params.approvedBy);
    revisionsSheet.getRange(revisionRowIndex, 14).setValue(timestamp);
    
    // Update the FMS_PROGRESS task if new date was requested
    if (revision[7]) { // requestedNewDate
      const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
      const rowIndex = revision[5]; // Row_Index from revision
      
      if (progressSheet && rowIndex) {
        // Update Planned_Due_Date (column 8)
        progressSheet.getRange(rowIndex, 8).setValue(revision[7]);
        
        // Update Last_Updated_By and Last_Updated_On
        progressSheet.getRange(rowIndex, 15).setValue(params.approvedBy);
        progressSheet.getRange(rowIndex, 16).setValue(timestamp);
      }
    }
    
    // Log the approval
    logFMSActivity({
      type: 'REVISION_APPROVED',
      projectId: revision[1],
      projectName: revision[2],
      stepNo: revision[3],
      taskDescription: revision[4],
      requestedBy: revision[8],
      approvedBy: params.approvedBy,
      oldDate: revision[6],
      newDate: revision[7],
      reason: revision[10],
      timestamp: timestamp
    });
    
    return {
      success: true,
      message: 'Revision approved and task updated successfully'
    };
  } catch (error) {
    Logger.log('approveFMSRevision error: ' + error.toString());
    return { success: false, message: 'Error approving revision: ' + error.toString() };
  }
}

/**
 * Reject FMS revision
 */
function rejectFMSRevision(params) {
  try {
    const revisionsSheet = getFMSRevisionsSheet();
    const data = revisionsSheet.getDataRange().getValues();
    
    // Find the revision
    let revisionRowIndex = -1;
    let revision = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === params.revisionId) {
        revisionRowIndex = i + 1;
        revision = data[i];
        break;
      }
    }
    
    if (revisionRowIndex === -1) {
      return { success: false, message: 'Revision not found' };
    }
    
    const timestamp = new Date().toISOString();
    
    // Update revision status
    revisionsSheet.getRange(revisionRowIndex, 12).setValue('Rejected');
    revisionsSheet.getRange(revisionRowIndex, 15).setValue(params.rejectedBy);
    revisionsSheet.getRange(revisionRowIndex, 16).setValue(timestamp);
    
    // Log the rejection
    logFMSActivity({
      type: 'REVISION_REJECTED',
      projectId: revision[1],
      projectName: revision[2],
      stepNo: revision[3],
      taskDescription: revision[4],
      requestedBy: revision[8],
      rejectedBy: params.rejectedBy,
      reason: revision[10],
      timestamp: timestamp
    });
    
    return {
      success: true,
      message: 'Revision rejected'
    };
  } catch (error) {
    Logger.log('rejectFMSRevision error: ' + error.toString());
    return { success: false, message: 'Error rejecting revision: ' + error.toString() };
  }
}

/**
 * Log FMS activity (revisions, approvals, task updates)
 */
function logFMSActivity(activity) {
  try {
    // This can be integrated into getAllLogs or stored in a separate sheet
    Logger.log('FMS Activity: ' + JSON.stringify(activity));
    
    // Optionally create FMS_LOGS sheet
    let logsSheet = FMS_SS.getSheetByName('FMS_LOGS');
    if (!logsSheet) {
      logsSheet = FMS_SS.insertSheet('FMS_LOGS');
      logsSheet.appendRow([
        'Timestamp',
        'Type',
        'Project_ID',
        'Project_Name',
        'Step_No',
        'Task_Description',
        'User',
        'Details'
      ]);
    }
    
    logsSheet.appendRow([
      activity.timestamp || new Date().toISOString(),
      activity.type || 'UNKNOWN',
      activity.projectId || '',
      activity.projectName || '',
      activity.stepNo || '',
      activity.taskDescription || '',
      activity.requestedBy || activity.approvedBy || activity.rejectedBy || '',
      JSON.stringify(activity)
    ]);
  } catch (error) {
    Logger.log('logFMSActivity error: ' + error.toString());
  }
}

// ======================================
// OBJECTION SYSTEM
// ======================================

/**
 * Get or create the Objections sheet
 */
function getObjectionsSheet() {
  let sheet = FMS_SS.getSheetByName('OBJECTIONS');
  if (!sheet) {
    sheet = FMS_SS.insertSheet('OBJECTIONS');
    sheet.appendRow([
      'Objection_ID',
      'Task_ID',
      'Project_ID',
      'Task_Description',
      'Reason',
      'Raised_By',
      'Raised_On',
      'Route_To',
      'Task_Type',
      'Status',
      'Reviewed_By',
      'Reviewed_On',
      'Action_Taken',
      'New_Task_ID'
    ]);
  }
  return sheet;
}

/**
 * Raise an objection for a task
 */
function raiseObjection(params) {
  try {
    const objectionId = 'OBJ' + Date.now();
    const timestamp = new Date().toISOString();
    
    // Determine who to route the objection to
    let routeTo = params.taskGiver || ''; // Default to task giver
    
    if (params.taskType === 'FMS') {
      // For FMS tasks, route to Step 1 person
      const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
      if (progressSheet) {
        const data = progressSheet.getDataRange().getValues();
        // Find Step 1 task for this project
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] === params.projectId && data[i][3] === 1) {
            routeTo = data[i][5]; // WHO column
            break;
          }
        }
      }
    }
    
    const objectionsSheet = getObjectionsSheet();
    objectionsSheet.appendRow([
      objectionId,
      params.taskId,
      params.projectId || '',
      params.taskDescription,
      params.reason,
      params.raisedBy,
      timestamp,
      routeTo,
      params.taskType,
      'Pending',
      '',
      '',
      '',
      ''
    ]);
    
    // Log activity
    logFMSActivity({
      type: 'OBJECTION_RAISED',
      projectId: params.projectId,
      taskDescription: params.taskDescription,
      requestedBy: params.raisedBy,
      timestamp: timestamp
    });
    
    return {
      success: true,
      objectionId: objectionId,
      message: 'Objection raised successfully. Will be reviewed by: ' + routeTo
    };
  } catch (error) {
    Logger.log('raiseObjection error: ' + error.toString());
    return { success: false, message: 'Error raising objection: ' + error.toString() };
  }
}

/**
 * Get objections for review by a user
 */
function getObjections(userId) {
  try {
    const objectionsSheet = getObjectionsSheet();
    const data = objectionsSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, objections: [] };
    }
    
    const objections = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Show objections routed to this user and still pending
      if (row[7] === userId && row[9] === 'Pending') {
        objections.push({
          objectionId: row[0],
          taskId: row[1],
          projectId: row[2],
          taskDescription: row[3],
          reason: row[4],
          raisedBy: row[5],
          raisedOn: row[6],
          routeTo: row[7],
          taskType: row[8],
          status: row[9]
        });
      }
    }
    
    return {
      success: true,
      objections: objections
    };
  } catch (error) {
    Logger.log('getObjections error: ' + error.toString());
    return { success: false, message: 'Error getting objections: ' + error.toString() };
  }
}

/**
 * Review an objection (approve terminate, approve replace, or reject)
 */
function reviewObjection(params) {
  try {
    // Debug logging
    Logger.log('reviewObjection called with params: ' + JSON.stringify(params));
    Logger.log('reviewAction type: ' + typeof params.reviewAction);
    Logger.log('reviewAction value: ' + params.reviewAction);
    
    const objectionsSheet = getObjectionsSheet();
    const data = objectionsSheet.getDataRange().getValues();
    
    // Find the objection
    let objectionRowIndex = -1;
    let objection = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === params.objectionId) {
        objectionRowIndex = i + 1;
        objection = data[i];
        break;
      }
    }
    
    if (objectionRowIndex === -1) {
      return { success: false, message: 'Objection not found' };
    }
    
    const timestamp = new Date().toISOString();
    let newStatus = '';
    let actionTaken = '';
    let newTaskId = '';
    
    // Normalize action to lowercase string and trim whitespace
    const action = String(params.reviewAction || '').toLowerCase().trim();
    Logger.log('Normalized reviewAction: "' + action + '"');
    
    // Handle different actions
    if (action === 'terminate') {
      newStatus = 'Approved-Terminate';
      actionTaken = 'Task terminated';
      
      // Mark task as terminated in appropriate sheet
      if (objection[8] === 'FMS') {
        // Update FMS_PROGRESS
        const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
        if (progressSheet) {
          const progressData = progressSheet.getDataRange().getValues();
          for (let i = 1; i < progressData.length; i++) {
            // Match by project ID and step
            if (progressData[i][0] === objection[2] && progressData[i][3] == objection[1].split('-')[1]) {
              progressSheet.getRange(i + 1, 10).setValue('Terminated');
              break;
            }
          }
        }
      } else {
        // Update Task Management MASTER sheet
        const taskSheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('MASTER');
        if (taskSheet) {
          const taskData = taskSheet.getDataRange().getValues();
          for (let i = 1; i < taskData.length; i++) {
            if (taskData[i][0] === objection[1]) {
              taskSheet.getRange(i + 1, 10).setValue('Terminated');
              break;
            }
          }
        }
      }
      
    } else if (action === 'replace') {
      newStatus = 'Approved-Replace';
      newTaskId = 'TASK' + Date.now();
      actionTaken = 'Task terminated and new task created: ' + newTaskId;
      
      // Terminate old task and create new one
      if (objection[8] === 'FMS') {
        // Handle FMS task replacement
        const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
        if (progressSheet) {
          const progressData = progressSheet.getDataRange().getValues();
          for (let i = 1; i < progressData.length; i++) {
            if (progressData[i][0] === objection[2] && progressData[i][3] == objection[1].split('-')[1]) {
              // Terminate old
              progressSheet.getRange(i + 1, 10).setValue('Terminated');
              
              // Create new task with same details
              progressSheet.appendRow([
                objection[2], // Project ID
                progressData[i][1], // FMS ID
                progressData[i][2], // Project Name
                progressData[i][3], // Step No
                progressData[i][4], // WHAT
                params.newAssignee || progressData[i][5], // WHO (new assignee if provided)
                progressData[i][6], // HOW
                params.newDueDate || progressData[i][7], // New due date if provided
                '',
                'Pending',
                '',
                'false',
                params.reviewedBy,
                timestamp,
                params.reviewedBy,
                timestamp
              ]);
              break;
            }
          }
        }
      } else {
        // Handle Task Management replacement
        const taskSheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('MASTER');
        if (taskSheet) {
          const taskData = taskSheet.getDataRange().getValues();
          for (let i = 1; i < taskData.length; i++) {
            if (taskData[i][0] === objection[1]) {
              // Terminate old
              taskSheet.getRange(i + 1, 10).setValue('Terminated');
              
              // Create new task
              taskSheet.appendRow([
                newTaskId,
                taskData[i][1], // GIVEN BY
                taskData[i][2], // GIVEN TO
                params.newAssignee || taskData[i][3], // GIVEN TO USER ID
                taskData[i][4], // TASK DESCRIPTION
                taskData[i][5], // HOW TO DO
                taskData[i][6], // DEPARTMENT
                taskData[i][7], // TASK FREQUENCY
                params.newDueDate || taskData[i][8], // PLANNED DATE
                'Pending', // Task Status
                '', // completed on
                '', // Task Completed On
                '', // Revision 1 Date
                '', // Reason for Revision
                '', // On time or not
                0, // Revision Count
                '', // Revision Penalty
                '', // Calculated Score
                '' // Attachments
              ]);
              break;
            }
          }
        }
      }
      
      
    } else if (action === 'reject') {
      newStatus = 'Rejected';
      actionTaken = 'Objection rejected';
      
    } else if (action === 'hold') {
      newStatus = 'On-Hold';
      actionTaken = 'Task placed on hold: ' + (params.reason || 'No reason provided');
      
      // Mark task as on hold in appropriate sheet
      if (objection[8] === 'FMS') {
        // Update FMS_PROGRESS
        const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
        if (progressSheet) {
          const progressData = progressSheet.getDataRange().getValues();
          for (let i = 1; i < progressData.length; i++) {
            // Match by project ID and step
            if (progressData[i][0] === objection[2] && progressData[i][3] == objection[1].split('-')[1]) {
              progressSheet.getRange(i + 1, 10).setValue('On-Hold');
              break;
            }
          }
        }
      } else {
        // Update Task Management MASTER sheet
        const taskSheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('MASTER');
        if (taskSheet) {
          const taskData = taskSheet.getDataRange().getValues();
          for (let i = 1; i < taskData.length; i++) {
            if (taskData[i][0] === objection[1]) {
              taskSheet.getRange(i + 1, 10).setValue('On-Hold');
              break;
            }
          }
        }
      }
      
    } else {
      // Invalid reviewAction
      Logger.log('ERROR: Invalid reviewAction received: "' + action + '"');
      return { 
        success: false, 
        message: 'Invalid reviewAction: "' + action + '". Valid actions are: terminate, replace, reject, hold' 
      };
    }
    
    // Update objection record
    objectionsSheet.getRange(objectionRowIndex, 10).setValue(newStatus); // Status
    objectionsSheet.getRange(objectionRowIndex, 11).setValue(params.reviewedBy); // Reviewed By
    objectionsSheet.getRange(objectionRowIndex, 12).setValue(timestamp); // Reviewed On
    objectionsSheet.getRange(objectionRowIndex, 13).setValue(actionTaken); // Action Taken
    objectionsSheet.getRange(objectionRowIndex, 14).setValue(newTaskId); // New Task ID
    
    // Log activity
    logFMSActivity({
      type: 'OBJECTION_' + action.toUpperCase(),
      projectId: objection[2],
      taskDescription: objection[3],
      approvedBy: params.reviewedBy,
      timestamp: timestamp
    });
    
    return {
      success: true,
      message: 'Objection reviewed successfully',
      newTaskId: newTaskId || null
    };
  } catch (error) {
    Logger.log('reviewObjection error: ' + error.toString());
    return { success: false, message: 'Error reviewing objection: ' + error.toString() };
  }
}

// ======================================
// GOOGLE DRIVE FILE UPLOAD SYSTEM
// ======================================

/**
 * Get or create FMS Attachments folder in Drive
 * You can replace 'FMS_Attachments' with your specific folder ID
 */
function getFMSAttachmentsFolder() {
  // Replace this with your specific folder ID if you have one
  const SPECIFIC_FOLDER_ID = '1B0f2XuDBo46mTktl9oP9zNtwnpWxbH1N'; // Replace with actual folder ID
  
  if (SPECIFIC_FOLDER_ID !== 'YOUR_FOLDER_ID_HERE') {
    try {
      const folder = DriveApp.getFolderById(SPECIFIC_FOLDER_ID);
      Logger.log('Using specific folder: ' + folder.getName() + ' - ' + folder.getId());
      return folder;
    } catch (e) {
      Logger.log('Specific folder not found, creating new one: ' + e.toString());
    }
  }
  
  // Fallback: create or find FMS_Attachments folder
  const folderName = 'FMS_Attachments';
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  }
  
  const folder = DriveApp.createFolder(folderName);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  Logger.log('Created folder: ' + folder.getName() + ' - ' + folder.getId());
  return folder;
}

/**
 * Upload single file to Google Drive
 */
function uploadFileToDrive(params) {
  try {
    const { fileData, fileName, mimeType, uploadedBy, context } = params;
    
    // Validation
    if (!fileData || !fileName) {
      return { success: false, message: 'Missing file data or filename' };
    }
    
    // File size check (50MB limit for Apps Script)
    const maxSize = 50 * 1024 * 1024;
    const estimatedSize = (fileData.length * 3) / 4; // Base64 to bytes
    
    if (estimatedSize > maxSize) {
      return { 
        success: false, 
        message: 'File too large. Max 50MB. Current: ' + Math.round(estimatedSize / 1024 / 1024) + 'MB' 
      };
    }
    
    // Sanitize filename
    const safeName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);
    
    // Get main folder
    const mainFolder = getFMSAttachmentsFolder();
    
    // Create context subfolder
    let contextFolder;
    const subfolderName = context || 'General';
    const contextFolders = mainFolder.getFoldersByName(subfolderName);
    
    if (contextFolders.hasNext()) {
      contextFolder = contextFolders.next();
    } else {
      contextFolder = mainFolder.createFolder(subfolderName);
      contextFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    // Decode base64 and create blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      safeName
    );
    
    // Upload to Drive
    const file = contextFolder.createFile(blob);
    
    // Set permissions
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get file info
    const fileId = file.getId();
    const fileUrl = file.getUrl();
    const viewUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
    const downloadUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
    const fileSize = file.getSize();
    const timestamp = new Date().toISOString();
    
    // Log upload
    logFileUpload({
      fileId: fileId,
      fileName: safeName,
      fileUrl: fileUrl,
      fileSize: fileSize,
      mimeType: mimeType,
      uploadedBy: uploadedBy,
      uploadedOn: timestamp,
      context: context
    });
    
    Logger.log('File uploaded: ' + safeName + ' - ID: ' + fileId);
    
    return {
      success: true,
      file: {
        id: fileId,
        name: safeName,
        url: viewUrl,
        downloadUrl: downloadUrl,
        size: fileSize,
        mimeType: mimeType,
        uploadedBy: uploadedBy,
        uploadedOn: timestamp
      },
      message: 'File uploaded successfully to Drive'
    };
    
  } catch (error) {
    Logger.log('uploadFileToDrive error: ' + error.toString());
    return { 
      success: false, 
      message: 'Upload failed: ' + error.toString() 
    };
  }
}

/**
 * Upload multiple files at once
 */
function uploadMultipleFiles(params) {
  try {
    const { files, uploadedBy, context } = params;
    
    if (!files || files.length === 0) {
      return { success: false, message: 'No files provided' };
    }
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      
      const result = uploadFileToDrive({
        fileData: fileData.data,
        fileName: fileData.name,
        mimeType: fileData.mimeType,
        uploadedBy: uploadedBy,
        context: context
      });
      
      if (result.success) {
        results.push(result.file);
      } else {
        errors.push(fileData.name + ': ' + result.message);
      }
      
      // Small delay to avoid quota issues
      if (i < files.length - 1) {
        Utilities.sleep(100);
      }
    }
    
    return {
      success: results.length > 0,
      files: results,
      errors: errors,
      message: 'Uploaded ' + results.length + ' of ' + files.length + ' files' +
               (errors.length > 0 ? '. Errors: ' + errors.join('; ') : '')
    };
    
  } catch (error) {
    Logger.log('uploadMultipleFiles error: ' + error.toString());
    return { 
      success: false, 
      message: 'Batch upload failed: ' + error.toString() 
    };
  }
}

/**
 * Delete/trash file from Drive
 */
function deleteFileFromDrive(params) {
  try {
    const { fileId } = params;
    
    if (!fileId) {
      return { success: false, message: 'File ID required' };
    }
    
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true); // Move to trash (recoverable)
    
    Logger.log('File trashed: ' + fileId);
    
    return {
      success: true,
      message: 'File moved to trash'
    };
    
  } catch (error) {
    Logger.log('deleteFileFromDrive error: ' + error.toString());
    return { 
      success: false, 
      message: 'Delete failed: ' + error.toString() 
    };
  }
}

/**
 * Get file metadata by ID
 */
function getFileMetadata(params) {
  try {
    const { fileId } = params;
    const file = DriveApp.getFileById(fileId);
    
    return {
      success: true,
      file: {
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl(),
        size: file.getSize(),
        mimeType: file.getMimeType(),
        createdDate: file.getDateCreated().toISOString(),
        modifiedDate: file.getLastUpdated().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'File not found or inaccessible'
    };
  }
}

/**
 * Log file uploads to tracking sheet
 */
function logFileUpload(uploadData) {
  try {
    let logsSheet = FMS_SS.getSheetByName('FILE_UPLOADS_LOG');
    
    if (!logsSheet) {
      logsSheet = FMS_SS.insertSheet('FILE_UPLOADS_LOG');
      logsSheet.appendRow([
        'File_ID', 'File_Name', 'File_URL', 'File_Size', 'MIME_Type',
        'Uploaded_By', 'Uploaded_On', 'Context', 'Folder_Path'
      ]);
    }
    
    logsSheet.appendRow([
      uploadData.fileId,
      uploadData.fileName,
      uploadData.fileUrl,
      uploadData.fileSize,
      uploadData.mimeType,
      uploadData.uploadedBy,
      uploadData.uploadedOn,
      uploadData.context || 'General',
      'FMS_Attachments/' + (uploadData.context || 'General')
    ]);
    
  } catch (error) {
    Logger.log('logFileUpload error: ' + error.toString());
  }
}