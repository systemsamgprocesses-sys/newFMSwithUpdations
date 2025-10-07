import { FMSStep } from '../types';
import { cache } from './cache';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

if (!APPS_SCRIPT_URL) {
  throw new Error('VITE_APPS_SCRIPT_URL is not defined. Restart dev server after updating .env');
}

// Use proxy in development, direct URL in production
const API_URL = import.meta.env.DEV 
  ? `/api/macros/s/${APPS_SCRIPT_URL.split('/macros/s/')[1]?.split('/')[0]}/exec`
  : APPS_SCRIPT_URL;

async function callAppsScript(action: string, payload: Record<string, any> = {}, retries = 3, useCache = false) {
  // Check cache for read operations
  const cacheKey = `${action}:${JSON.stringify(payload)}`;
  if (useCache) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Cache hit:', action);
      return cachedData;
    }
  }
  
  const body = JSON.stringify({ action, ...payload });
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        mode: 'cors'
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      let json;
      try {
        json = await res.json();
      } catch (e) {
        throw new Error(`Invalid JSON response from server (${res.status})`);
      }

      if (json?.success === false) {
        const msg = json?.message || json?.error || 'API error';
        throw new Error(msg);
      }

      // Cache successful read operations
      if (useCache && json?.success) {
        cache.set(cacheKey, json, 60000); // 1 minute TTL
      }

      return json;
    } catch (error) {
      console.error(`API call failed (attempt ${attempt}/${retries}):`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

export const api = {
  // expects Apps Script action 'login' -> returns user/session info
  async login(username: string, password: string) {
    // avoid logging sensitive data in production
    return callAppsScript('login', { username, password });
  },

  // Users (frontend expects getAllUsers / createUser(...) signatures)
  async getUsers() {
    return callAppsScript('getUsers', {}, 3, true); // Use cache
  },

  async getAllUsers() {
    // alias for getUsers for components that call getAllUsers()
    return this.getUsers();
  },

  async createUser(...args: any[]) {
    // Usage patterns in workspace:
    // 1) api.createUser(userRecord)
    // 2) api.createUser(username, password, name, role, department)
    cache.invalidatePattern('getUsers'); // Invalidate user cache
    if (args.length === 1 && typeof args[0] === 'object') {
      return callAppsScript('createUser', args[0]);
    } else {
      const [username, password, name, role, department] = args;
      return callAppsScript('createUser', { username, password, name, role, department });
    }
  },

  // expects Apps Script action 'updateUser'
  async updateUser(id: string | number, updates: Record<string, any>) {
    cache.invalidatePattern('getUsers'); // Invalidate user cache
    return callAppsScript('updateUser', { id, ...updates });
  },

  // expects Apps Script action 'deleteUser'
  async deleteUser(id: string | number) {
    cache.invalidatePattern('getUsers'); // Invalidate user cache
    return callAppsScript('deleteUser', { id });
  },

  // Departments: frontend calls getAllDepartments — derive from users if backend doesn't have dedicated endpoint
  async getAllDepartments() {
    try {
      const res = await this.getUsers();
      const users = res.users || [];
      const depts = Array.from(new Set(users.map((u: any) => u.department).filter(Boolean)));
      return { success: true, departments: depts };
    } catch (err) {
      // Fallback: return empty list instead of throwing so pages don't crash
      return { success: true, departments: [] };
    }
  },

  // FMS / Projects / Logs
  async createFMS(fmsName: string, steps: FMSStep[], username: string) {
    cache.invalidatePattern('getAllFMS');
    cache.invalidatePattern('getAllLogs');
    return callAppsScript('createFMS', { fmsName, steps, username });
  },

  async getAllFMS() {
    return callAppsScript('getAllFMS', {}, 3, true); // Use cache
  },

  async getFMSById(fmsId: string) {
    return callAppsScript('getFMSById', { fmsId }, 3, true); // Use cache
  },

  async createProject(fmsId: string, projectName: string, projectStartDate: string, username: string) {
    cache.invalidatePattern('getAllProjects');
    cache.invalidatePattern('getProjectsByUser');
    cache.invalidatePattern('getAllLogs');
    return callAppsScript('createProject', { fmsId, projectName, projectStartDate, username });
  },

  async getAllProjects() {
    return callAppsScript('getAllProjects', {}, 3, true); // Use cache
  },

  async getProjectsByUser(username: string) {
    return callAppsScript('getProjectsByUser', { username }, 3, true); // Use cache
  },

  async updateTaskStatus(rowIndex: number, status: string, username: string) {
    cache.invalidatePattern('getAllProjects');
    cache.invalidatePattern('getProjectsByUser');
    cache.invalidatePattern('getAllLogs');
    cache.invalidatePattern('getTasks');
    cache.invalidatePattern('getTaskSummary');
    return callAppsScript('updateTaskStatus', { rowIndex, status, username });
  },

  async getAllLogs() {
    return callAppsScript('getAllLogs', {}, 3, true); // Use cache
  },

  // Backward-compat aliases (some files call these names)
  async getLogs() {
    return this.getAllLogs();
  },

  // ===== TASK MANAGEMENT SYSTEM =====
  
  // Get users for task assignment
  async getTaskUsers() {
    return callAppsScript('getTaskUsers', {}, 3, true); // Use cache
  },

  // Assign a new task
  async assignTask(taskData: Record<string, any>) {
    cache.invalidatePattern('getTasks');
    cache.invalidatePattern('getTaskSummary');
    cache.invalidatePattern('getAllLogs');
    return callAppsScript('assignTask', taskData);
  },

  // Get tasks for a user with optional filtering
  async getTasks(userId: string, filter: string = 'all') {
    return callAppsScript('getTasks', { userId, filter }, 3, true); // Use cache
  },

  // Get task summary for dashboard
  async getTaskSummary(userId: string) {
    return callAppsScript('getTaskSummary', { userId }, 3, true); // Use cache
  },

  // Update a single task (complete or revise)
  async updateTask(taskId: string, action: string, extraData: Record<string, any> = {}) {
    cache.invalidatePattern('getTasks');
    cache.invalidatePattern('getTaskSummary');
    cache.invalidatePattern('getAllLogs');
    cache.invalidatePattern('getScoringData');
    return callAppsScript('updateTask', { taskId, action, extraData });
  },

  // Batch update multiple tasks
  async batchUpdateTasks(updates: Array<{ taskId: string; action: string; extraData?: Record<string, any> }>) {
    cache.invalidatePattern('getTasks');
    cache.invalidatePattern('getTaskSummary');
    cache.invalidatePattern('getAllLogs');
    cache.invalidatePattern('getScoringData');
    return callAppsScript('batchUpdateTasks', { updates });
  },

  // Get scoring/performance data (including both FMS and Task Management)
  async getScoringData(personId: string, startDate: string, endDate: string) {
    return callAppsScript('getScoringData', { personId, startDate, endDate }, 3, true); // Use cache
  },

  // ===== FMS REVISION SYSTEM =====
  
  // Request FMS task revision
  async requestFMSRevision(revisionData: Record<string, any>) {
    cache.invalidatePattern('getFMSRevisions');
    cache.invalidatePattern('getAllLogs');
    return callAppsScript('requestFMSRevision', revisionData);
  },

  // Get FMS revision requests for a user (creator)
  async getFMSRevisions(userId: string) {
    return callAppsScript('getFMSRevisions', { userId }, 3, true); // Use cache
  },

  // Approve FMS revision
  async approveFMSRevision(data: Record<string, any>) {
    cache.invalidatePattern('getFMSRevisions');
    cache.invalidatePattern('getAllProjects');
    cache.invalidatePattern('getProjectsByUser');
    cache.invalidatePattern('getAllLogs');
    return callAppsScript('approveFMSRevision', data);
  },

  // Reject FMS revision
  async rejectFMSRevision(data: Record<string, any>) {
    cache.invalidatePattern('getFMSRevisions');
    cache.invalidatePattern('getAllLogs');
    return callAppsScript('rejectFMSRevision', data);
  },
};

export default api;
