// ============================================
// COMPREHENSIVE FMS + TASK MANAGEMENT SYSTEM
// Google Apps Script Web App Backend
// ============================================

// ===== CONFIGURATION =====
// Replace these IDs with your actual Google Sheets IDs
const MASTER_SHEET_ID = '1SGVw2xbVoLPmggNJKgpjWIaEgzukU8byE2nQLqfeGTo';
const CREDENTIALS_SHEET_ID = '1ipCXOWo1A8w3sbmhaQcrhFHaCPgaHaHWR6Wr-MPDZ14';

// Get the active spreadsheet for FMS data
const FMS_SS = SpreadsheetApp.getActiveSpreadsheet();

// ===== MAIN HANDLERS =====

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'FMS + Task Management API is running'
  })).setMimeType(ContentService.MimeType.JSON);
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
        result = getAllFMS();
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
        result = updateTaskStatus(params);
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
        result = updateTask(params.taskId, params.action, params.extraData || {});
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
        
      default:
        result = { success: false, message: 'Invalid action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Server error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
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
        timestamp
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

function getAllFMS() {
  try {
    const masterSheet = FMS_SS.getSheetByName('FMS_MASTER');
    if (!masterSheet) {
      return { success: false, message: 'FMS_MASTER sheet not found' };
    }
    
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
      
      if (!fmsMap[fmsId]) {
        fmsMap[fmsId] = {
          fmsId: fmsId,
          fmsName: fmsName,
          stepCount: 0,
          createdBy: row[10],
          createdOn: row[11]
        };
      }
      
      fmsMap[fmsId].stepCount = Math.max(fmsMap[fmsId].stepCount, stepNo);
    }
    
    return {
      success: true,
      fmsList: Object.values(fmsMap)
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
        steps.push({
          stepNo: row[2],
          what: row[3],
          who: row[4],
          how: row[5],
          when: row[6],
          whenUnit: row[7] || 'days',
          whenDays: row[8] || 0,
          whenHours: row[9] || 0
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
        steps.push({
          stepNo: row[2],
          what: row[3],
          who: row[4],
          how: row[5],
          when: row[6],
          whenUnit: row[7] || 'days',
          whenDays: row[8] || 0,
          whenHours: row[9] || 0
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
    
    progressSheet.appendRow([
      projectId,
      fmsId,
      projectName,
      steps[0].stepNo,
      steps[0].what,
      steps[0].who,
      steps[0].how,
      currentDate.toISOString(),
      '',
      'Pending',
      '',
      'true',
      username,
      timestamp,
      username,
      timestamp
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
    if (!progressSheet) {
      return { success: false, message: 'FMS_PROGRESS sheet not found' };
    }
    
    const data = progressSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, projects: [] };
    }
    
    const projectMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const projectId = row[0];
      
      if (!projectMap[projectId]) {
        projectMap[projectId] = {
          projectId: projectId,
          fmsId: row[1],
          projectName: row[2],
          tasks: []
        };
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
        projectName: row[2]
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
          isFirstStep: row[11] === 'true' || row[11] === true
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

function updateTaskStatus(params) {
  try {
    const progressSheet = FMS_SS.getSheetByName('FMS_PROGRESS');
    const masterSheet = FMS_SS.getSheetByName('FMS_MASTER');
    
    if (!progressSheet || !masterSheet) {
      return { success: false, message: 'Required sheets not found' };
    }
    
    const rowIndex = params.rowIndex;
    const status = params.status;
    const username = params.username;
    const timestamp = new Date().toISOString();
    
    progressSheet.getRange(rowIndex, 9).setValue(status === 'Done' ? timestamp : '');
    progressSheet.getRange(rowIndex, 10).setValue(status);
    progressSheet.getRange(rowIndex, 11).setValue(status === 'Done' ? username : '');
    progressSheet.getRange(rowIndex, 15).setValue(username);
    progressSheet.getRange(rowIndex, 16).setValue(timestamp);
    
    if (status === 'Done') {
      const currentRow = progressSheet.getRange(rowIndex, 1, 1, 16).getValues()[0];
      const projectId = currentRow[0];
      const fmsId = currentRow[1];
      const projectName = currentRow[2];
      const currentStepNo = currentRow[3];
      
      const masterData = masterSheet.getDataRange().getValues();
      const allSteps = [];
      
      for (let i = 1; i < masterData.length; i++) {
        const row = masterData[i];
        if (row[0] === fmsId) {
          allSteps.push({
            stepNo: row[2],
            what: row[3],
            who: row[4],
            how: row[5],
            when: row[6],
            whenDays: row[8] || Math.floor(row[6]),
            whenHours: row[9] || Math.round((row[6] % 1) * 24)
          });
        }
      }
      
      allSteps.sort((a, b) => a.stepNo - b.stepNo);
      
      const nextStep = allSteps.find(s => s.stepNo === currentStepNo + 1);
      
      if (nextStep) {
        const completionDate = new Date(timestamp);
        completionDate.setDate(completionDate.getDate() + parseInt(nextStep.whenDays));
        completionDate.setHours(completionDate.getHours() + parseInt(nextStep.whenHours));
        
        progressSheet.appendRow([
          projectId,
          fmsId,
          projectName,
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
          timestamp
        ]);
      }
    }
    
    return {
      success: true,
      message: 'Task updated successfully'
    };
  } catch (error) {
    Logger.log('Error updating task status: ' + error.toString());
    return { success: false, message: 'Error updating task status: ' + error.toString() };
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
    const sheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('MASTER');
    if (!sheet) throw new Error('MASTER sheet not found');
    
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
      nextTaskId,
      taskData.givenBy || '',
      taskData.assignedTo || '',
      taskData.assignedTo || '',
      taskData.description || '',
      taskData.tutorialLinks || '',
      taskData.department || '',
      'One Time Only',
      formattedDate,
      'Pending',
      '', '',
      '',
      '', '', '',
      '',
      0,
      '',
      '',
      ''
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
    if (!sheet) throw new Error('MASTER sheet not found');
    
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
    if (!sheet) throw new Error('MASTER sheet not found');
    
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

