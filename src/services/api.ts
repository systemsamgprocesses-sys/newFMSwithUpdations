import { FMSStep } from '../types';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

if (!APPS_SCRIPT_URL) {
  throw new Error('VITE_APPS_SCRIPT_URL is not defined. Restart dev server after updating .env');
}

// Use proxy in development, direct URL in production
const API_URL = import.meta.env.DEV 
  ? `/api/macros/s/${APPS_SCRIPT_URL.split('/macros/s/')[1]?.split('/')[0]}/exec`
  : APPS_SCRIPT_URL;

async function callAppsScript(action: string, payload: Record<string, any> = {}, retries = 3) {
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
    return callAppsScript('getUsers');
  },

  async getAllUsers() {
    // alias for getUsers for components that call getAllUsers()
    return this.getUsers();
  },

  async createUser(...args: any[]) {
    // Usage patterns in workspace:
    // 1) api.createUser(userRecord)
    // 2) api.createUser(username, password, name, role, department)
    if (args.length === 1 && typeof args[0] === 'object') {
      return callAppsScript('createUser', args[0]);
    } else {
      const [username, password, name, role, department] = args;
      return callAppsScript('createUser', { username, password, name, role, department });
    }
  },

  // expects Apps Script action 'updateUser'
  async updateUser(id: string | number, updates: Record<string, any>) {
    return callAppsScript('updateUser', { id, ...updates });
  },

  // expects Apps Script action 'deleteUser'
  async deleteUser(id: string | number) {
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
    return callAppsScript('createFMS', { fmsName, steps, username });
  },

  async getAllFMS() {
    return callAppsScript('getAllFMS');
  },

  async getFMSById(fmsId: string) {
    return callAppsScript('getFMSById', { fmsId });
  },

  async createProject(fmsId: string, projectName: string, projectStartDate: string, username: string) {
    return callAppsScript('createProject', { fmsId, projectName, projectStartDate, username });
  },

  async getAllProjects() {
    return callAppsScript('getAllProjects');
  },

  async getProjectsByUser(username: string) {
    return callAppsScript('getProjectsByUser', { username });
  },

  async updateTaskStatus(rowIndex: number, status: string, username: string) {
    return callAppsScript('updateTaskStatus', { rowIndex, status, username });
  },

  async getAllLogs() {
    return callAppsScript('getAllLogs');
  },

  // Backward-compat aliases (some files call these names)
  async getLogs() {
    return this.getAllLogs();
  },
};

export default api;
