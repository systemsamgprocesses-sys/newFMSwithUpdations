import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { ProjectTask, Project, User } from '../types';

interface DataContextType {
  // FMS Data
  fmsList: any[];
  fmsDetails: Record<string, any>;
  loadFMSList: (username?: string, userRole?: string, userDepartment?: string) => Promise<void>;
  loadFMSDetails: (fmsId: string) => Promise<void>;
  
  // Project Data
  allProjects: Project[];
  projectProgress: Record<string, number>;
  projectTotalSteps: Record<string, number>;
  projectFMSDetails: Record<string, any>;
  loadProjects: () => Promise<void>;
  
  // User Data
  myTasks: ProjectTask[];
  users: User[];
  loadMyTasks: (username: string) => Promise<void>;
  loadUsers: () => Promise<void>;
  
  // Loading States
  loading: {
    fmsList: boolean;
    projects: boolean;
    myTasks: boolean;
    users: boolean;
  };
  
  // Error States
  error: string;
  setError: (error: string) => void;
  
  // Refresh functions
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [fmsList, setFmsList] = useState<any[]>([]);
  const [fmsDetails, setFmsDetails] = useState<Record<string, any>>({});
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [projectProgress, setProjectProgress] = useState<Record<string, number>>({});
  const [projectTotalSteps, setProjectTotalSteps] = useState<Record<string, number>>({});
  const [projectFMSDetails, setProjectFMSDetails] = useState<Record<string, any>>({});
  const [myTasks, setMyTasks] = useState<ProjectTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  
  const [loading, setLoading] = useState({
    fmsList: false,
    projects: false,
    myTasks: false,
    users: false,
  });

  // Use refs to track if data has been loaded to prevent infinite re-renders
  const projectsLoadedRef = useRef(false);
  const fmsListLoadedRef = useRef(false);

  const loadFMSList = useCallback(async (username?: string, userRole?: string, userDepartment?: string) => {
    if (fmsListLoadedRef.current || fmsList.length > 0) return; // Don't reload if already loaded
    
    // Debug logging
    console.log('loadFMSList called with:', { username, userRole, userDepartment });
    
    fmsListLoadedRef.current = true;
    setLoading(prev => ({ ...prev, fmsList: true }));
    try {
        const result = await api.getAllFMS(username, userRole, userDepartment);
        if (result.success) {
          console.log('FMS list loaded:', result.fmsList?.length, 'items');
          console.log('FMS IDs:', result.fmsList?.map(f => f.fmsId).join(', '));
          console.log('🔍 Backend Debug Info:', result.debug);
          setFmsList(result.fmsList || []);
        }
    } catch (err) {
      setError('Failed to load FMS list');
      fmsListLoadedRef.current = false; // Reset on error
    } finally {
      setLoading(prev => ({ ...prev, fmsList: false }));
    }
  }, [fmsList.length]);

  const loadFMSDetails = useCallback(async (fmsId: string) => {
    if (fmsDetails[fmsId]) return; // Don't reload if already loaded
    
    try {
      const result = await api.getFMSById(fmsId);
      if (result.success) {
        setFmsDetails(prev => ({
          ...prev,
          [fmsId]: result
        }));
      }
    } catch (err) {
      setError('Failed to load FMS details');
    }
  }, [fmsDetails]);

  const loadProjects = useCallback(async () => {
    if (projectsLoadedRef.current || allProjects.length > 0) return; // Don't reload if already loaded
    
    projectsLoadedRef.current = true;
    setLoading(prev => ({ ...prev, projects: true }));
    try {
      const result = await api.getAllProjects();
      if (result.success) {
        setAllProjects(result.projects || []);
        
        // Calculate progress for each project
        const progressPromises = result.projects.map(async (project: Project) => {
          try {
            const fmsResult = await api.getFMSById(project.fmsId);
            if (fmsResult.success && fmsResult.steps) {
              const totalSteps = fmsResult.steps.length;
              const completedTasks = project.tasks.filter((t) => t.status === 'Done').length;
              const progress = Math.round((completedTasks / totalSteps) * 100);
              return { projectId: project.projectId, progress, totalSteps, fmsDetails: fmsResult };
            }
          } catch (err) {
            console.error('Error fetching FMS details:', err);
          }
          
          // Fallback
          const completedTasks = project.tasks.filter((t) => t.status === 'Done').length;
          const progress = Math.round((completedTasks / project.tasks.length) * 100);
          return { projectId: project.projectId, progress, totalSteps: project.tasks.length, fmsDetails: null };
        });
        
        const progressResults = await Promise.all(progressPromises);
        const progressMap = progressResults.reduce((acc, { projectId, progress }) => {
          acc[projectId] = progress;
          return acc;
        }, {} as Record<string, number>);
        
        const totalStepsMap = progressResults.reduce((acc, { projectId, totalSteps }) => {
          acc[projectId] = totalSteps;
          return acc;
        }, {} as Record<string, number>);
        
        const fmsDetailsMap = progressResults.reduce((acc, { projectId, fmsDetails }) => {
          acc[projectId] = fmsDetails;
          return acc;
        }, {} as Record<string, any>);
        
        setProjectProgress(progressMap);
        setProjectTotalSteps(totalStepsMap);
        setProjectFMSDetails(fmsDetailsMap);
      }
    } catch (err) {
      setError('Failed to load projects');
      projectsLoadedRef.current = false; // Reset on error
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  }, [allProjects.length]);

  // Auto-load projects when DataContext is first used
  useEffect(() => {
    // Only load if we haven't loaded yet and we're not already loading
    if (!projectsLoadedRef.current && !loading.projects) {
      loadProjects();
    }
  }, [loadProjects, loading.projects]);

  const loadMyTasks = useCallback(async (username: string) => {
    if (!username) return; // Don't load if no username
    
    setLoading(prev => ({ ...prev, myTasks: true }));
    try {
      const result = await api.getProjectsByUser(username);
      if (result.success) {
        console.log('📋 Raw tasks from API:', result.tasks);
        
        const enhancedTasks = result.tasks.map((task: ProjectTask) => {
          console.log('📋 Task:', task.what, 'Requires checklist?', task.requiresChecklist, 'Items:', task.checklistItems);
          
          return {
            ...task,
            isOverdue: isTaskOverdue(task),
            completionStatus: getCompletionStatus(task),
            // Explicitly preserve checklist fields
            requiresChecklist: task.requiresChecklist,
            checklistItems: task.checklistItems,
            attachments: task.attachments
          };
        });
        
        console.log('📋 Enhanced tasks:', enhancedTasks);
        setMyTasks(enhancedTasks);
      } else {
        setError(result.message || 'Failed to load tasks');
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(prev => ({ ...prev, myTasks: false }));
    }
  }, []);

  const loadUsers = useCallback(async () => {
    if (users.length > 0) return; // Don't reload if already loaded
    
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const result = await api.getUsers();
      if (result.success) {
        setUsers(result.users || []);
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, [users.length]);

  const refreshAll = useCallback(async () => {
    // Reset refs
    projectsLoadedRef.current = false;
    fmsListLoadedRef.current = false;
    
    setFmsList([]);
    setFmsDetails({});
    setAllProjects([]);
    setProjectProgress({});
    setProjectTotalSteps({});
    setProjectFMSDetails({});
    setMyTasks([]);
    setUsers([]);
    
    await Promise.all([
      loadFMSList(),
      loadProjects(),
      loadUsers()
    ]);
  }, [loadFMSList, loadProjects, loadUsers]);

  // Helper functions
  const isTaskOverdue = (task: ProjectTask): boolean => {
    if (task.status === 'Done') return false;
    const dueDate = new Date(task.plannedDueDate);
    const now = new Date();
    return dueDate < now;
  };

  const getCompletionStatus = (task: ProjectTask): 'on-time' | 'late' | undefined => {
    if (task.status !== 'Done' || !task.actualCompletedOn) return undefined;
    const dueDate = new Date(task.plannedDueDate);
    const completedDate = new Date(task.actualCompletedOn);
    return completedDate <= dueDate ? 'on-time' : 'late';
  };

  return (
    <DataContext.Provider value={{
      fmsList,
      fmsDetails,
      loadFMSList,
      loadFMSDetails,
      allProjects,
      projectProgress,
      projectTotalSteps,
      projectFMSDetails,
      loadProjects,
      myTasks,
      users,
      loadMyTasks,
      loadUsers,
      loading,
      error,
      setError,
      refreshAll
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
