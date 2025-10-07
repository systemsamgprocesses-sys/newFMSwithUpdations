// Google Apps Script Task Management Dashboard
// Replace these IDs with your actual Google Sheets IDs
const MASTER_SHEET_ID = '1SGVw2xbVoLPmggNJKgpjWIaEgzukU8byE2nQLqfeGTo';
const CREDENTIALS_SHEET_ID = '1ipCXOWo1A8w3sbmhaQcrhFHaCPgaHaHWR6Wr-MPDZ14';

// Get users for assignment dropdown
function getUsers() {
  try {
    const sheet = SpreadsheetApp.openById(CREDENTIALS_SHEET_ID).getSheetByName('Credentials');
    if (!sheet) {
      throw new Error('Credentials sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        users: []
      };
    }

    // Map data from Credentials sheet (ID from Column A, Department from Column C)
    const users = data.slice(1) // Skip header row
      .filter(row => row[0] && row[0].toString().trim()) // Only take rows with non-empty ID
      .map(row => ({
        userId: row[0].toString().trim(),
        name: row[0].toString().trim(), // ID as name
        department: row[2] ? row[2].toString().trim() : 'No Department' // Department from Column C
      }))
      .sort((a, b) => (a.department + a.name).localeCompare(b.department + b.name)); // Sort by department, then name

    Logger.log('Found ' + users.length + ' users'); // Debug log
    
    return {
      success: true,
      users: users
    };
  } catch (error) {
    Logger.log('Error getting users: ' + error.toString());
    return {
      success: false,
      message: 'Error getting users: ' + error.toString()
    };
  }
}


function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function login(userId, password) {
  try {
    const credentialsSheet = SpreadsheetApp.openById(CREDENTIALS_SHEET_ID).getSheetByName('Credentials');
    const data = credentialsSheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === userId && row[1] === password) {
        return {
          success: true,
          message: 'Login successful',
          userId: userId
        };
      }
    }
    
    return {
      success: false,
      message: 'Invalid credentials'
    };
  } catch (error) {
    Logger.log('Login error: ' + error.toString());
    return {
      success: false,
      message: 'Login error: ' + error.toString()
    };
  }
}

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

// Helper function to get task by ID
function getTaskById(taskId, userId) {
  try {
    const tasksResult = getTasks(userId, 'all');
    if (!tasksResult.success) {
      return tasksResult;
    }
    
    const task = tasksResult.tasks.find(t => t['Task Id'].toString() === taskId.toString());
    if (!task) {
      return {
        success: false,
        message: 'Task not found'
      };
    }
    
    return {
      success: true,
      task: task
    };
  } catch (error) {
    Logger.log('Error getting task by ID: ' + error.toString());
    return {
      success: false,
      message: 'Error getting task by ID: ' + error.toString()
    };
  }
}

// Scoring Functions
async function loadScoringData() {
    const startDateInput = document.getElementById('scoringStartDate');
    const endDateInput = document.getElementById('scoringEndDate');

    const todayISO = formatDateISO(new Date());
    if (endDateInput.value > todayISO) {
        endDateInput.value = todayISO;
    }

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
        showError('Please select both start and end dates');
        return;
    }

    showScoringLoader();

    try {
        let result;
        if (isGoogleAppsScript) {
            result = await new Promise((resolve, reject) => {
                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                    .getScoringData({
                        personId: currentUser,
                        startDate: startDate,
                        endDate: endDate
                    });
            });
        } else {
            // Mock data for local testing
            result = {
                success: true,
                data: {
                    totalTasks: 10,
                    completedTasks: 8,
                    dueNotCompleted: 2,
                    completedOnTime: 7,
                    completedNotOnTime: 1,
                    revisionsTaken: 1,
                    scoresImpacted: 2,
                    totalScoreSum: 85,
                    finalScore: 85
                }
            };
        }

        if (result.success) {
            renderScoringData(result.data);
        } else {
            showError(result.message || 'Failed to load scoring data');
        }
    } catch (error) {
        console.error('Scoring error:', error);
        showError('Error loading scoring data');
    } finally {
        hideScoringLoader();
    }
}

function showScoringLoader() {
    document.getElementById('scoringLoader').classList.remove('hidden');
    document.getElementById('scoringResults').classList.add('hidden');
}

function hideScoringLoader() {
    document.getElementById('scoringLoader').classList.add('hidden');
}

function renderScoringData(data) {
    document.getElementById('totalTasksScore').textContent = data.totalTasks;
    document.getElementById('completedTasksScore').textContent = data.completedTasks;
    document.getElementById('dueNotCompletedScore').textContent = data.dueNotCompleted;
    document.getElementById('onTimeTasksScore').textContent = data.completedOnTime;
    document.getElementById('notOnTimeScore').textContent = data.completedNotOnTime;
    document.getElementById('revisionsTakenScore').textContent = data.revisionsTaken;
    document.getElementById('scoresImpactedScore').textContent = data.scoresImpacted;
    document.getElementById('totalScoreSum').textContent = data.totalScoreSum;
    document.getElementById('finalScore').textContent = `${data.finalScore}%`;
    document.getElementById('scoringResults').classList.remove('hidden');
}

function printScoringReport() {
    const results = document.getElementById('scoringResults');
    if (!results || results.classList.contains('hidden')) {
        showError('No scoring data to print');
        return;
    }

    const personName = currentUserName || currentUser;
    const startDate = document.getElementById('scoringStartDate').value;
    const endDate = document.getElementById('scoringEndDate').value;

    const printContent = `
        <div class="print-header" style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 24px; margin-bottom: 10px;">Performance Score Report</h1>
            <h2 style="font-size: 18px; color: #666;">${personName}</h2>
        </div>
        <div class="print-info" style="margin-bottom: 20px;">
            <p>Period: ${formatDateForPrint(startDate)} to ${formatDateForPrint(endDate)}</p>
        </div>
        ${results.innerHTML}
    `;

    const printWin = window.open('', '_blank');
    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Performance Score Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .card-bg { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
                .space-y-3 > * { margin-bottom: 12px; }
                .flex { display: flex; justify-content: space-between; }
                .muted { color: #666; }
                .border-t { border-top: 1px solid #ddd; padding-top: 12px; }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    printWin.document.close();
    setTimeout(() => {
        printWin.print();
        printWin.close();
    }, 300);
}

function formatDateForPrint(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN'); // DD/MM/YYYY
}

// Add this to your showSection function
function showSection(section) {
    // ...existing code...
    
    if (section === 'scoring') {
        setDefaultScoringDates();
        loadScoringData(); // Auto-load on section display
    }
    
    // ...existing code...
}

// Set default date range to current week (Monday to Sunday)
function setDefaultScoringDates() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate Monday (start) of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    
    // Calculate Sunday (end) of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // Format dates to YYYY-MM-DD
    const mondayISO = monday.toISOString().split('T')[0];
    const sundayISO = sunday.toISOString().split('T')[0];

    // Set the input values
    document.getElementById('scoringStartDate').value = mondayISO;
    document.getElementById('scoringEndDate').value = sundayISO;

    // Set max date to today to prevent future dates
    const todayISO = today.toISOString().split('T')[0];
    document.getElementById('scoringEndDate').max = todayISO;
    document.getElementById('scoringStartDate').max = todayISO;
}

// ── Helper: Parse dd/MM/yyyy safely ───────────────────────────────
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

// ── Helper: Format Date to ISO (yyyy-MM-dd) ───────────────────────
function formatDateToISO(date) {
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

// ── Authentication: Login ─────────────────────────────────────────
function login(userId, password) {
  try {
    const sheet = SpreadsheetApp.openById(CREDENTIALS_SHEET_ID).getSheetByName('Credentials');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId && data[i][1] === password) {
        return { success: true, userId: userId, message: 'Login successful' };
      }
    }
    return { success: false, message: 'Invalid credentials' };
  } catch (error) {
    Logger.log('Login error: ' + error.toString());
    return { success: false, message: 'Login error: ' + error.toString() };
  }
}

// ── Users: Get all users for assignment dropdown ──────────────────
function getUsers() {
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
        department: row[2] ? row[2].toString().trim() : 'No Department'
      }))
      .sort((a, b) => (a.department + a.name).localeCompare(b.department + b.name));

    return { success: true, users: users };
  } catch (error) {
    Logger.log('Error getting users: ' + error.toString());
    return { success: false, message: 'Error getting users: ' + error.toString() };
  }
}

// ── Users: Get display name (for UI) ──────────────────────────────
function getUserName(userId) {
  try {
    const sheet = SpreadsheetApp.openById(CREDENTIALS_SHEET_ID).getSheetByName('Credentials');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        return data[i][0].toString().trim(); // Use ID as name (or add name column later)
      }
    }
    return userId;
  } catch (e) {
    return userId;
  }
}

// ── Tasks: Assign new task ────────────────────────────────────────
function assignTask(taskData) {
  try {
    const sheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('MASTER');
    const lastRow = sheet.getLastRow();

    let nextTaskId = 'AT-1'; // default for first task
    if (lastRow > 1) {
      // Get the value from last row, first column (Task ID)
      const lastTaskId = sheet.getRange(lastRow, 1).getValue();
      
      if (lastTaskId && lastTaskId.startsWith("AT-")) {
        const lastNumber = parseInt(lastTaskId.split("-")[1], 10) || 0;
        nextTaskId = "AT-" + (lastNumber + 1);
      }
    }

    // Format Planned Date
    const plannedDate = new Date(taskData.plannedDate);
    const formattedDate = Utilities.formatDate(plannedDate, Session.getScriptTimeZone(), "dd/MM/yyyy");

    // Prepare new row
    const newRow = [
      nextTaskId,                                    // Task Id
      taskData.givenBy,                              // GIVEN BY
      taskData.assignedTo,                           // GIVEN TO
      taskData.assignedTo,                           // GIVEN TO USER ID
      taskData.description,                          // TASK DESCRIPTION
      taskData.tutorialLinks || '',                  // HOW TO DO- TUTORIAL LINKS (OPTIONAL)
      taskData.department || '',                     // DEPARTMENT
      'One Time Only',                               // TASK FREQUENCY
      formattedDate,                                 // PLANNED DATE
      'Pending',                                     // Task Status
      '', '',                                        // BLANK x2
      '',                                            // completed on
      '', '', '',                                    // BLANK x3
      '',                                            // Revision Status & Log
      0,                                             // Revision Count
      '',                                            // Scoring Impact
      '',                                            // On time or not?
      ''                                             // Scoring
    ];

    // Append new row
    sheet.appendRow(newRow);

    // ── Fetch recipient email from Credentials sheet ──
    const credSheet = SpreadsheetApp.openById(CREDENTIALS_SHEET_ID).getSheetByName('Credentials');
    const credData = credSheet.getDataRange().getValues();
    let recipientEmail = "";
    for (let i = 1; i < credData.length; i++) {
      if (credData[i][0] == taskData.assignedTo) { // Assuming Column A = User ID, Column D = Email
        recipientEmail = credData[i][3]; // Column D
        break;
      }
    }

    if (recipientEmail) {
      // ── Prepare Email ──
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
            <td style="border:1px solid #444; padding:8px;"><b>Assigned By</b></td>
            <td style="border:1px solid #444; padding:8px;">${taskData.givenBy}</td>
          </tr>
          <tr>
            <td style="border:1px solid #444; padding:8px;"><b>Assigned To</b></td>
            <td style="border:1px solid #444; padding:8px;">${taskData.assignedTo} (${taskData.assignedTo})</td>
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
            <td style="border:1px solid #444; padding:8px;"><b>Task Frequency</b></td>
            <td style="border:1px solid #444; padding:8px;">One Time Only</td>
          </tr>
          <tr>
            <td style="border:1px solid #444; padding:8px;"><b>Planned Date</b></td>
            <td style="border:1px solid #444; padding:8px;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="border:1px solid #444; padding:8px;"><b>How to do it</b></td>
            <td style="border:1px solid #444; padding:8px;">${tutorialLink}</td>
          </tr>
        </table>
        
        <p>Please ensure that the task is completed within the planned schedule. If you have any questions, feel free to reach out.</p>
        
        <p>Best regards,<br><b>AMG Systems</b></p>
      </div>
      `;

      // Send email
      GmailApp.sendEmail(recipientEmail, subject, '', { htmlBody: body });
    }

    return { success: true, taskId: nextTaskId, message: 'Task assigned & email sent successfully' };

  } catch (error) {
    Logger.log('Error assigning task: ' + error.toString());
    return { success: false, message: 'Error assigning task: ' + error.toString() };
  }
}



// ── Tasks: Get all tasks for a user ───────────────────────────────
function getTasks(userId, filter = 'all') {
  try {
    const sheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('MASTER');
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

      // Normalize for frontend
      task['Task Status'] = task['Task Status'] || '';
      task['PLANNED DATE'] = task['PLANNED DATE'] || '';
      task['Task Completed On'] = task['completed on'] || '';

      // Apply filter
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

// ── Summary: Get task summary (upcoming, pending, etc.) ───────────
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

// ── Tasks: Update task (complete or revise) ───────────────────────
function updateTask(taskId, action, extraData = {}) {
  try {
    const sheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('MASTER');
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => (h || '').toString().trim());

    // Find task row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === taskId.toString()) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex === -1) return { success: false, message: 'Task not found' };

    // Locate columns by **exact header name**
    const statusCol = headers.indexOf('Task Status') + 1;
    const completedOnCol = headers.indexOf('completed on') + 1;
    const newDateCol = headers.indexOf('Revision 1 Date') + 1; // ✅ Column O
    const reasonCol = headers.indexOf('Reason for Revision') + 1; // ✅ Column L
    const plannedDateCol = headers.indexOf('PLANNED DATE') + 1;
    const onTimeCol = headers.indexOf('On time or not?') + 1;

    if (action === 'complete') {
      if (statusCol > 0) sheet.getRange(rowIndex, statusCol).setValue('Completed');
      if (completedOnCol > 0) sheet.getRange(rowIndex, completedOnCol).setValue(new Date());

      // On-Time Logic
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

      // ✅ Write new date to "New Date if Any" (Column O)
      if (extraData.newDate && newDateCol > 0) {
        sheet.getRange(rowIndex, newDateCol).setValue(new Date(extraData.newDate));
      }

      // ✅ Write reason to "Reason for Revision" (Column L)
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

function getScoringData(request) {
  const { personId, startDate, endDate } = request;
  try {
    const sheet = SpreadsheetApp.openById(MASTER_SHEET_ID).getSheetByName('SCORING');
    if (!sheet) throw new Error('Master sheet not found');
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: false, message: 'No task data found' };
    }

    // Column mapping (0-indexed)
    const cols = {
      userId: 3,         // D - GIVEN TO USER ID
      status: 9,         // J - Task Status
      plannedDate: 8,    // I - PLANNED DATE
      revisionCount: 17, // R - Revision Count
      revisionPenalty: 18, // S - Scoring Impact ("Yes"/"No")
      onTimeStatus: 19,  // T - On time or not?
      calculatedScore: 20 // U - Scoring
    };

    // Parse dates properly
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

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[cols.userId] !== personId) continue;

      const plannedDate = parseDate(row[cols.plannedDate]);
      if (!plannedDate) continue;

      // Apply date filter
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

    // ✅ Final score logic
    const finalScore = totalTasks > 0 
      ? (totalScoreSum / totalTasks * 100).toFixed(2) 
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


