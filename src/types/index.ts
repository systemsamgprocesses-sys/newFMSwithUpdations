export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedOn: string;
}

export interface FMSStep {
  stepNo: number;
  what: string;
  who: string;
  how: string;
  when: number;
  whenUnit: 'days' | 'hours' | 'days+hours';
  whenDays?: number;
  whenHours?: number;
  requiresChecklist?: boolean;
  checklistItems?: ChecklistItem[];
  attachments?: Attachment[];
  triggersFMSId?: string;  // FMS to automatically trigger when this step completes
}

export interface FMSTemplate {
  fmsId: string;
  fmsName: string;
  stepCount: number;
  createdBy: string;
  createdOn: string;
  totalDays?: number;
  totalHours?: number;
  totalTimeFormatted?: string;
}

export interface FMSDetail {
  fmsName: string;
  steps: FMSStep[];
}

export interface ProjectTask {
  rowIndex?: number;
  projectId: string;
  projectName: string;
  stepNo: number;
  what: string;
  who: string;
  how: string;
  plannedDueDate: string;
  actualCompletedOn: string;
  status: 'Pending' | 'In Progress' | 'Done';
  completedBy?: string;
  isFirstStep?: boolean;
  isOverdue?: boolean;
  completionStatus?: 'on-time' | 'late';
  requiresChecklist?: boolean;
  checklistItems?: ChecklistItem[];
  attachments?: Attachment[];
}

export interface Project {
  projectId: string;
  fmsId: string;
  projectName: string;
  totalStepsInTemplate?: number;
  tasks: ProjectTask[];
}

export interface Log {
  type: 'FMS_CREATED' | 'PROJECT_CREATED' | 'TASK_UPDATED';
  fmsId?: string;
  fmsName?: string;
  projectId?: string;
  projectName?: string;
  stepNo?: number;
  what?: string;
  status?: string;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
}

export interface User {
  username: string;
  name: string;
  role: string;
  department: string;
  loginTime?: string;
  email?: string;
}

// ===== TASK MANAGEMENT TYPES =====

export interface TaskUser {
  userId: string;
  name: string;
  department: string;
  email?: string;
}

export interface TaskData {
  'Task Id': string;
  'GIVEN BY': string;
  'GIVEN TO': string;
  'GIVEN TO USER ID': string;
  'TASK DESCRIPTION': string;
  'HOW TO DO- TUTORIAL LINKS (OPTIONAL)': string;
  'DEPARTMENT': string;
  'TASK FREQUENCY': string;
  'PLANNED DATE': string;
  'Task Status': string;
  'completed on': string;
  'Task Completed On'?: string;
  'Revision 1 Date'?: string;
  'Reason for Revision'?: string;
  'On time or not?'?: string;
  'Attachments'?: Attachment[] | string; // Can be array or JSON string
  [key: string]: any;
}

export interface TaskSummary {
  upcoming: number;
  pending: number;
  completed: number;
  revisions: number;
  overdue: number;
  total: number;
}

export interface AssignTaskRequest {
  givenBy: string;
  assignedTo: string;
  description: string;
  plannedDate: string;
  tutorialLinks?: string;
  department?: string;
}

export interface ScoringData {
  totalTasks: number;
  completedTasks: number;
  dueNotCompleted: number;
  completedOnTime: number;
  completedNotOnTime: number;
  revisionsTaken: number;
  scoresImpacted: number;
  totalScoreSum: number;
  finalScore: number;
}

export interface Objection {
  objectionId: string;
  taskId: string;
  projectId?: string;
  taskDescription: string;
  reason: string;
  raisedBy: string;
  raisedOn: string;
  reviewedBy?: string;
  reviewedOn?: string;
  status: 'Pending' | 'Approved-Terminate' | 'Approved-Replace' | 'Rejected';
  actionTaken?: string;
  taskType: 'FMS' | 'TASK_MANAGEMENT';
  routeTo: string; // username of reviewer
}
