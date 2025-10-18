import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Loader, Calendar, ListChecks, AlertCircle, TrendingUp, Target, X, Paperclip, ExternalLink, CheckCircle, Plus, Send, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useAlert } from '../context/AlertContext';
import { api } from '../services/api';
import { ProjectTask, TaskData, TaskUser, ScoringData } from '../types';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import DriveFileUpload from '../components/DriveFileUpload';

interface UnifiedTask {
  id: string;
  type: 'FMS' | 'TASK_MANAGEMENT';
  title: string;
  description: string;
  dueDate: string;
  status: string;
  assignee: string;
  projectName?: string;
  department?: string;
  isOverdue: boolean;
  source: ProjectTask | TaskData;
  createdBy?: string;
}

// Helper function to safely get attachments from a task
const getTaskAttachments = (task: UnifiedTask): any[] => {
  if (task.type === 'FMS') {
    return (task.source as ProjectTask).attachments || [];
  } else {
    const attachments = (task.source as TaskData).Attachments;
    if (Array.isArray(attachments)) {
      return attachments;
    }
    return [];
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    myTasks: fmsTasks,
    allProjects, 
    loadMyTasks, 
    loading: fmsLoading,
    error: fmsError,
    setError
  } = useData();
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState<string | null>(null);

  // Task Management state
  const [tmTasks, setTmTasks] = useState<TaskData[]>([]);
  const [tmLoading, setTmLoading] = useState(false);


  // Objections state
  const [objections, setObjections] = useState<any[]>([]);
  const [objectionsLoading, setObjectionsLoading] = useState(false);

  // Unified state
  const [activeTab, setActiveTab] = useState<'assignedToMe' | 'iAssigned' | 'allTasks' | 'fms' | 'tm' | 'due' | 'objections' | 'assign' | 'performance'>('assignedToMe');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{start: string, end: string}>({start: '', end: ''});

  // Modal state - kept for checklist functionality

  // Checklist modal
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [taskToComplete, setTaskToComplete] = useState<UnifiedTask | null>(null);
  
  // Attachment modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedTaskAttachments, setSelectedTaskAttachments] = useState<any[]>([]);
  const [selectedTaskForAttachments, setSelectedTaskForAttachments] = useState<UnifiedTask | null>(null);
  
  // Confirmation modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    revision: any;
  } | null>(null);
  
  // Hold options modal
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [selectedObjectionForHold, setSelectedObjectionForHold] = useState<any>(null);
  const [holdAction, setHoldAction] = useState<'terminate' | 'replace' | 'hold' | 'reject'>('terminate');
  const [holdData, setHoldData] = useState({
    newAssignee: '',
    newDueDate: '',
    reason: ''
  });

  // Objection modal
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [selectedTaskForObjection, setSelectedTaskForObjection] = useState<UnifiedTask | null>(null);
  const [objectionReason, setObjectionReason] = useState('');
  
  const [success, setSuccess] = useState('');

  // Task Management Integration State
  const [taskUsers, setTaskUsers] = useState<TaskUser[]>([]);
  const [assignForm, setAssignForm] = useState({
    assignedTo: '',
    description: '',
    plannedDate: '',
    tutorialLinks: '',
    department: '',
    attachments: [] as any[]
  });
  const [hasPendingUploads, setHasPendingUploads] = useState(false);
  
  // Performance/Scoring state
  const [selectedScoringUser, setSelectedScoringUser] = useState(user?.username || '');
  const [availableUsers, setAvailableUsers] = useState<TaskUser[]>([]);
  const [scoringData, setScoringData] = useState<ScoringData | null>(null);
  const [scoringDates, setScoringDates] = useState({
    startDate: '',
    endDate: ''
  });
  const [loadingScoring, setLoadingScoring] = useState(false);

  useEffect(() => {
    if (user?.username) {
      loadMyTasks(user.username);
      loadTaskManagementData();
      loadObjections();
      loadTaskUsers();
      loadAvailableUsersForScoring();
      setDefaultScoringDates();
      setSelectedScoringUser(user.username);
    }
  }, [user?.username]);

  const loadTaskManagementData = useCallback(async () => {
    if (!user?.username) return;
    
    setTmLoading(true);
    try {
      const tasksResult = await api.getTasks(user.username, 'all');
      if (tasksResult.success) {
        setTmTasks(tasksResult.tasks || []);
      }
      
      // Load task users for objection modal
      const usersResult = await api.getTaskUsers();
      if (usersResult.success) {
        setTaskUsers(usersResult.users || []);
      }
    } catch (err: any) {
      console.error('Error loading Task Management data:', err);
    } finally {
      setTmLoading(false);
    }
  }, [user?.username]);


  const loadObjections = useCallback(async () => {
    if (!user?.username) return;
    
    setObjectionsLoading(true);
    try {
      const result = await api.getObjections(user.username);
      if (result.success) {
        setObjections(result.objections || []);
      }
    } catch (err: any) {
      console.error('Error loading objections:', err);
    } finally {
      setObjectionsLoading(false);
    }
  }, [user?.username]);

  const loadTaskUsers = useCallback(async () => {
    try {
      const result = await api.getTaskUsers();
      if (result.success) {
        setTaskUsers(result.users || []);
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  }, []);

  const loadAvailableUsersForScoring = useCallback(async () => {
    try {
      const result = await api.getTaskUsers();
      if (result.success) {
        setAvailableUsers(result.users || []);
      }
    } catch (err) {
      console.error('Error loading users for scoring:', err);
    }
  }, []);

  const setDefaultScoringDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const mondayISO = monday.toISOString().split('T')[0];
    const sundayISO = sunday.toISOString().split('T')[0];
    
    setScoringDates({
      startDate: mondayISO,
      endDate: sundayISO
    });
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasPendingUploads) {
      setError('⚠️ Files are selected but not uploaded! Click "Upload to Drive Now!" button first.');
      return;
    }
    
    setTmLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await api.assignTask({
        givenBy: user!.username,
        assignedTo: assignForm.assignedTo,
        description: assignForm.description,
        plannedDate: assignForm.plannedDate,
        tutorialLinks: assignForm.tutorialLinks,
        department: assignForm.department,
        attachments: assignForm.attachments
      });
      
      if (result.success) {
        setSuccess(`Task ${result.taskId} assigned successfully!`);
        setAssignForm({
          assignedTo: '',
          description: '',
          plannedDate: '',
          tutorialLinks: '',
          department: '',
          attachments: []
        });
        // Refresh task data
        await loadTaskManagementData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to assign task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
    } finally {
      setTmLoading(false);
    }
  };

  const loadScoringData = async () => {
    if (!scoringDates.startDate || !scoringDates.endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    setLoadingScoring(true);
    setError('');
    
    try {
      const result = await api.getScoringData(
        selectedScoringUser,
        scoringDates.startDate,
        scoringDates.endDate
      );
      
      if (result.success) {
        setScoringData(result.data);
      } else {
        setError(result.message || 'Failed to load scoring data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load scoring data');
    } finally {
      setLoadingScoring(false);
    }
  };

  const getScoringUsers = () => {
    if (!user) return [];
    
    const userRole = user.role?.toLowerCase();
    
    if (userRole === 'superadmin' || userRole === 'super admin') {
      return availableUsers;
    }
    
    if (userRole === 'admin') {
      return availableUsers.filter(u => u.department === user.department);
    }
    
    return availableUsers.filter(u => u.userId === user.username);
  };

  const allUnifiedTasks = useMemo(() => {
    const unified: UnifiedTask[] = [];

    // Only process if fmsTasks is not empty
    if (fmsTasks && fmsTasks.length > 0) {
      fmsTasks.forEach(task => {
        try {
          const dueDate = new Date(task.plannedDueDate);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);

          // Get the "createdBy" from project data
          const project = allProjects.find(p => p.projectId === task.projectId);
          const createdBy = project?.tasks?.[0]?.who || 'Unknown'; // First task's creator

          unified.push({
            id: `fms-${task.rowIndex || Math.random()}`,
            type: 'FMS',
            title: task.what,
            description: task.how || '',
            dueDate: task.plannedDueDate,
            status: task.status,
            assignee: task.who,
            projectName: task.projectName,
            isOverdue: task.status !== 'Done' && dueDate < now,
            source: task,
            createdBy: createdBy
          });
        } catch (error) {
          console.error('Error processing FMS task:', error, task);
        }
      });
    }

    // Only process if tmTasks is not empty
    if (tmTasks && tmTasks.length > 0) {
      tmTasks.forEach(task => {
        try {
          const dueDate = new Date(task['PLANNED DATE']);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          const status = task['Task Status']?.toLowerCase() || '';

          unified.push({
            id: `tm-${task['Task Id']}`,
            type: 'TASK_MANAGEMENT',
            title: task['TASK DESCRIPTION'],
            description: task['HOW TO DO- TUTORIAL LINKS (OPTIONAL)'] || '',
            dueDate: task['PLANNED DATE'],
            status: task['Task Status'],
            assignee: task['GIVEN TO USER ID'],
            department: task['DEPARTMENT'],
            isOverdue: status !== 'completed' && dueDate < now,
            source: task,
            createdBy: task['GIVEN BY']
          });
        } catch (error) {
          console.error('Error processing TM task:', error, task);
        }
      });
    }

    return unified.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [fmsTasks, tmTasks, allProjects]);

  // Tasks I assigned (where I'm the creator)
  const tasksIAssigned = useMemo(() => {
    const unified: UnifiedTask[] = [];
    
    // Get all tasks from FMS projects where current user is creator
    if (allProjects && allProjects.length > 0) {
      allProjects.forEach(project => {
        if (project.tasks && project.tasks.length > 0) {
          project.tasks.forEach(task => {
            try {
              const dueDate = new Date(task.plannedDueDate);
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              dueDate.setHours(0, 0, 0, 0);
              
              // Only include if current user is the creator
              if (task.who && project.tasks[0]?.who === user?.username) {
                unified.push({
                  id: `fms-assigned-${task.stepNo || Math.random()}`,
                  type: 'FMS',
                  title: task.what,
                  description: task.how || '',
                  dueDate: task.plannedDueDate,
                  status: task.status,
                  assignee: task.who,
                  projectName: project.projectName,
                  isOverdue: task.status !== 'Done' && dueDate < now,
                  source: task,
                  createdBy: project.tasks[0]?.who || user?.username
                });
              }
            } catch (error) {
              console.error('Error processing FMS project task:', error, task);
            }
          });
        }
      });
    }
    
    // Get all TM tasks where current user is the giver
    if (tmTasks && tmTasks.length > 0) {
      tmTasks.forEach(task => {
        try {
          if (task['GIVEN BY'] === user?.username) {
            const dueDate = new Date(task['PLANNED DATE']);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            const status = task['Task Status']?.toLowerCase() || '';
            
            unified.push({
              id: `tm-assigned-${task['Task Id']}`,
              type: 'TASK_MANAGEMENT',
              title: task['TASK DESCRIPTION'],
              description: task['HOW TO DO- TUTORIAL LINKS (OPTIONAL)'] || '',
              dueDate: task['PLANNED DATE'],
              status: task['Task Status'],
              assignee: task['GIVEN TO USER ID'],
              department: task['DEPARTMENT'],
              isOverdue: status !== 'completed' && dueDate < now,
              source: task,
              createdBy: task['GIVEN BY']
            });
          }
        } catch (error) {
          console.error('Error processing TM task:', error, task);
        }
      });
    }
    
    return unified.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [allProjects, tmTasks, user?.username]);
  
  // All tasks (for super admin)
  const allTasksForAdmin = useMemo(() => {
    if (user?.role?.toLowerCase() !== 'superadmin' && user?.role?.toLowerCase() !== 'super admin') {
      return [];
    }
    
    const unified: UnifiedTask[] = [];
    
    // Get all FMS tasks from all projects
    if (allProjects && allProjects.length > 0) {
      allProjects.forEach(project => {
        if (project.tasks && project.tasks.length > 0) {
          project.tasks.forEach(task => {
            try {
              const dueDate = new Date(task.plannedDueDate);
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              dueDate.setHours(0, 0, 0, 0);
              
              unified.push({
                id: `fms-all-${task.stepNo || Math.random()}`,
                type: 'FMS',
                title: task.what,
                description: task.how || '',
                dueDate: task.plannedDueDate,
                status: task.status,
                assignee: task.who,
                projectName: project.projectName,
                isOverdue: task.status !== 'Done' && dueDate < now,
                source: task,
                createdBy: project.tasks[0]?.who || 'Unknown'
              });
            } catch (error) {
              console.error('Error processing all FMS task:', error, task);
            }
          });
        }
      });
    }
    
    // Get all TM tasks
    if (tmTasks && tmTasks.length > 0) {
      tmTasks.forEach(task => {
        try {
          const dueDate = new Date(task['PLANNED DATE']);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          const status = task['Task Status']?.toLowerCase() || '';
          
          unified.push({
            id: `tm-all-${task['Task Id']}`,
            type: 'TASK_MANAGEMENT',
            title: task['TASK DESCRIPTION'],
            description: task['HOW TO DO- TUTORIAL LINKS (OPTIONAL)'] || '',
            dueDate: task['PLANNED DATE'],
            status: task['Task Status'],
            assignee: task['GIVEN TO USER ID'],
            department: task['DEPARTMENT'],
            isOverdue: status !== 'completed' && dueDate < now,
            source: task,
            createdBy: task['GIVEN BY']
          });
        } catch (error) {
          console.error('Error processing all TM task:', error, task);
        }
      });
    }
    
    return unified.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [allProjects, tmTasks, user?.role]);

  const filteredTasks = useMemo(() => {
    let tasks: UnifiedTask[] = [];
    
    // Select base tasks based on active tab
    switch (activeTab) {
      case 'assignedToMe':
        tasks = allUnifiedTasks;
        break;
      case 'iAssigned':
        tasks = tasksIAssigned;
        break;
      case 'allTasks':
        tasks = allTasksForAdmin;
        break;
      case 'fms':
        tasks = allUnifiedTasks.filter(t => t.type === 'FMS');
        break;
      case 'tm':
        tasks = allUnifiedTasks.filter(t => t.type === 'TASK_MANAGEMENT');
        break;
      case 'due':
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        tasks = allUnifiedTasks.filter(t => {
          const dueDate = new Date(t.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          const isDue = dueDate <= now;
          const isNotCompleted = t.status !== 'Done' && t.status.toLowerCase() !== 'completed';
          return isDue && isNotCompleted;
        });
        break;
      default:
        tasks = allUnifiedTasks;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.projectName?.toLowerCase().includes(query) ||
        t.department?.toLowerCase().includes(query) ||
        t.assignee?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      tasks = tasks.filter(t => t.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      tasks = tasks.filter(t => t.type === typeFilter);
    }
    
    // Apply date range filter
    if (dateRangeFilter.start && dateRangeFilter.end) {
      const startDate = new Date(dateRangeFilter.start);
      const endDate = new Date(dateRangeFilter.end);
      tasks = tasks.filter(t => {
        const taskDate = new Date(t.dueDate);
        return taskDate >= startDate && taskDate <= endDate;
      });
    }
    
    return tasks;
  }, [allUnifiedTasks, tasksIAssigned, allTasksForAdmin, activeTab, searchQuery, statusFilter, typeFilter, dateRangeFilter]);

  // Filter tasks assigned till current date (exclude future tasks)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const tasksAssignedTillToday = allUnifiedTasks.filter(t => {
    try {
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= now; // Only tasks with due date today or in the past
    } catch (error) {
      console.error('Error filtering task by date:', error, t);
      return false;
    }
  });

  // Memoized statistics calculations for better performance
  const statistics = useMemo(() => {
  // Fix: Use all tasks for total count and completion calculations (include future completed tasks)
  const totalTasks = Math.max(0, allUnifiedTasks.length); // All tasks assigned to user
  const fmsTaskCount = allUnifiedTasks.filter(t => t.type === 'FMS').length;
  const tmTaskCount = allUnifiedTasks.filter(t => t.type === 'TASK_MANAGEMENT').length;
  const completedTasks = allUnifiedTasks.filter(t => {
    try {
      return t.status === 'Done' || t.status?.toLowerCase() === 'completed';
    } catch (error) {
      console.error('Error checking task status:', error, t);
      return false;
    }
  }).length;
  const dueTasks = tasksAssignedTillToday.filter(t => {
    try {
      const dueDate = new Date(t.dueDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      const isNotCompleted = t.status !== 'Done' && t.status?.toLowerCase() !== 'completed';
      return dueDate <= now && isNotCompleted;
    } catch (error) {
      console.error('Error checking due task:', error, t);
      return false;
    }
  }).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { totalTasks, fmsTaskCount, tmTaskCount, completedTasks, dueTasks, completionRate };
  }, [allUnifiedTasks, tasksAssignedTillToday]);

  const { totalTasks, fmsTaskCount, tmTaskCount, completedTasks, dueTasks, completionRate } = statistics;

  // Debug logging
  console.log('🔍 Task Count Debug:', {
    allUnifiedTasks: allUnifiedTasks.length, // All tasks (including future)
    tasksAssignedTillToday: tasksAssignedTillToday.length, // Tasks due today or before (for due tasks calc)
    totalTasks,
    completedTasks,
    completionRate,
    fmsTasks: fmsTasks.length,
    tmTasks: tmTasks.length
  });

  const handleCompleteTask = async (task: UnifiedTask) => {
    // Check if task requires checklist
    const fmsTask = task.type === 'FMS' ? (task.source as ProjectTask) : null;
    
    // Debug logging
    console.log('🔍 Completing task:', task);
    console.log('🔍 Is FMS task?', task.type === 'FMS');
    console.log('🔍 Task source:', fmsTask);
    console.log('🔍 Requires checklist?', fmsTask?.requiresChecklist);
    console.log('🔍 Checklist items:', fmsTask?.checklistItems);
    
    const hasChecklist = fmsTask?.requiresChecklist && fmsTask?.checklistItems && fmsTask.checklistItems.length > 0;
    
    console.log('🔍 Has checklist?', hasChecklist);
    
    if (hasChecklist) {
      console.log('✅ Showing checklist modal!');
      // Show checklist modal
      setTaskToComplete(task);
      setChecklistItems(fmsTask!.checklistItems!.map(item => ({ ...item, completed: false })));
      setShowChecklistModal(true);
      return;
    }

    console.log('⚠️ No checklist, completing directly');
    // If no checklist, complete directly
    await completeTaskDirectly(task);
  };

  const completeTaskDirectly = async (task: UnifiedTask) => {
    setUpdating(task.id);
    try {
      if (task.type === 'FMS') {
        const fmsTask = task.source as ProjectTask;
        if (!fmsTask.rowIndex) return;
        
        const result = await api.updateTaskStatus(fmsTask.rowIndex, 'Done', user!.username);
        if (result.success) {
          showSuccess('Task completed successfully!');
          // Reload FMS tasks to get updated data
          await loadMyTasks(user!.username);
          setShowChecklistModal(false);
          setTaskToComplete(null);
        } else {
          showError(result.message || 'Failed to update task');
        }
      } else {
        const tmTask = task.source as TaskData;
        const result = await api.updateTask(tmTask['Task Id'], 'complete', {});
        
        if (result.success) {
          showSuccess('Task completed successfully!');
          // Update local state instead of reloading
          setTmTasks(prev => prev.map(t => 
            t['Task Id'] === tmTask['Task Id'] ? { ...t, 'Task Status': 'Completed' } : t
          ));
        } else {
          showError(result.message || 'Failed to update task');
        }
      }
    } catch (err: any) {
      showError(err.message || 'Failed to update task');
    } finally {
      setUpdating(null);
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const allChecklistItemsCompleted = () => {
    return checklistItems.every(item => item.completed);
  };


  const handleRaiseObjection = async () => {
    if (!selectedTaskForObjection || !objectionReason.trim()) {
      setError('Please provide a reason for objection');
      return;
    }

    setUpdating(selectedTaskForObjection.id);
    try {
      const task = selectedTaskForObjection;
      
      const result = await api.raiseObjection({
        taskId: task.type === 'FMS' ? `${task.projectName}-${(task.source as ProjectTask).stepNo}` : (task.source as TaskData)['Task Id'],
        projectId: task.projectName,
        taskDescription: task.title,
        reason: objectionReason,
        raisedBy: user!.username,
        taskType: task.type,
        taskGiver: task.createdBy
      });

      if (result.success) {
        setShowObjectionModal(false);
        showSuccess('Objection raised successfully! ' + result.message);
        setObjectionReason('');
        setSelectedTaskForObjection(null);
      } else {
        showError(result.message || 'Failed to raise objection');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to raise objection');
    } finally {
      setUpdating(null);
    }
  };


  const handleHoldAction = (objection: any, action: 'terminate' | 'replace' | 'hold' | 'reject') => {
    setSelectedObjectionForHold(objection);
    setHoldAction(action);
    setHoldData({ newAssignee: '', newDueDate: '', reason: '' });
    setShowHoldModal(true);
  };

  const executeHoldAction = async () => {
    if (!selectedObjectionForHold) return;

    // Validate required fields
    if (!holdData.reason.trim()) {
      showError('Please provide a reason for this action');
      return;
    }

    setUpdating(selectedObjectionForHold.objectionId);

    try {
      let result;
      
      if (holdAction === 'reject') {
        result = await api.reviewObjection({
          objectionId: selectedObjectionForHold.objectionId,
          reviewAction: 'reject',
          reviewedBy: user!.username,
          reason: holdData.reason
        });
      } else if (holdAction === 'terminate') {
        result = await api.reviewObjection({
          objectionId: selectedObjectionForHold.objectionId,
          reviewAction: 'terminate',
          reviewedBy: user!.username,
          reason: holdData.reason
        });
      } else if (holdAction === 'replace') {
        result = await api.reviewObjection({
          objectionId: selectedObjectionForHold.objectionId,
          reviewAction: 'replace',
          reviewedBy: user!.username,
          newAssignee: holdData.newAssignee || undefined,
          newDueDate: holdData.newDueDate || undefined,
          reason: holdData.reason
        });
      } else if (holdAction === 'hold') {
        result = await api.reviewObjection({
          objectionId: selectedObjectionForHold.objectionId,
          reviewAction: 'hold',
          reviewedBy: user!.username,
          reason: holdData.reason
        });
      }

      if (result?.success) {
        let message = '';
        switch (holdAction) {
          case 'reject':
            message = 'Objection rejected';
            break;
          case 'terminate':
            message = 'Task terminated successfully';
            break;
          case 'replace':
            message = `Task terminated and new task created: ${result.newTaskId || 'new task'}`;
            break;
          case 'hold':
            message = 'Task put on hold';
            break;
        }
        
        setShowHoldModal(false);
        showSuccess(message);
        await loadObjections();
        await loadMyTasks(user!.username);
      } else {
        showError(result?.message || `Failed to ${holdAction} task`);
      }
    } catch (err: any) {
      console.error('Objection action error:', err);
      showError(err.message || `Failed to ${holdAction} task`);
    } finally {
      setUpdating(null);
      setSelectedObjectionForHold(null);
      setHoldData({ newAssignee: '', newDueDate: '', reason: '' });
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    
    setShowConfirmModal(false);
    setUpdating(confirmAction.revision.revisionId);
    
    try {
      if (confirmAction.type === 'approve') {
        const result = await api.approveFMSRevision({
          revisionId: confirmAction.revision.revisionId,
          approvedBy: user!.username
        });

        if (result.success) {
          setSuccess('Revision approved successfully!');
          // Refresh objections and tasks post-approval
          await loadObjections();
          await loadMyTasks(user!.username);
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(result.message || 'Failed to approve revision');
        }
      } else {
        const result = await api.rejectFMSRevision({
          revisionId: confirmAction.revision.revisionId,
          rejectedBy: user!.username
        });

        if (result.success) {
          setSuccess('Revision rejected.');
          // Refresh objections post-rejection
          await loadObjections();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(result.message || 'Failed to reject revision');
        }
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${confirmAction.type} revision`);
    } finally {
      setUpdating(null);
      setConfirmAction(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'done' || statusLower === 'completed') {
        return 'bg-green-100 text-green-800 border-green-200';
    } else if (statusLower === 'in progress') {
        return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (statusLower === 'pending') {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (statusLower === 'revise' || statusLower === 'revision') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getTypeColor = (type: 'FMS' | 'TASK_MANAGEMENT') => {
    return type === 'FMS' 
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-cyan-100 text-cyan-800 border-cyan-200';
  };

  const loading = fmsLoading.myTasks || tmLoading;

  // Quick actions (extracted to avoid complex inline literals in JSX)
  const quickActions = useMemo(() => ([
    {
      onClick: () => navigate('/start-project'),
      Icon: Target,
      label: 'Start FMS Project',
      gradient: 'from-indigo-600 via-purple-600 to-blue-600',
    },
    {
      onClick: () => setActiveTab('assign'),
      Icon: Plus,
      label: 'Assign Task',
      gradient: 'from-cyan-600 via-blue-600 to-teal-600',
    },
    {
      onClick: () => setActiveTab('performance'),
      Icon: BarChart3,
      label: 'Performance',
      gradient: 'from-emerald-600 via-green-600 to-teal-600',
    },
    {
      onClick: () => {
        // Only refresh essential data, not everything
        loadObjections();
        loadTaskManagementData();
      },
      Icon: TrendingUp,
      label: 'Refresh',
      gradient: 'from-slate-600 via-gray-600 to-slate-700',
    },
  ]), [navigate, loadObjections, loadTaskManagementData]);

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Welcome back, <span className="font-semibold text-slate-700">{user?.username}</span>
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md"
            >
              <CheckSquare className="w-5 h-5" />
              <span className="font-semibold">Task Manager</span>
            </motion.div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4"
          >
            {[
              { label: 'Total Tasks', value: Math.max(0, totalTasks), subtitle: 'All assigned', color: 'slate', delay: 0.1 },
              { label: 'FMS Tasks', value: fmsTaskCount, subtitle: 'All assigned', color: 'purple', delay: 0.15 },
              { label: 'Delegated Tasks', value: tmTaskCount, subtitle: 'All assigned', color: 'cyan', delay: 0.2 },
              { label: 'Completed', value: completedTasks, subtitle: '', color: 'green', delay: 0.25 },
              { label: 'Due Tasks', value: dueTasks, subtitle: '', color: 'yellow', delay: 0.3 },
              { label: 'Completion', value: `${completionRate}%`, subtitle: '', color: 'blue', delay: 0.35 },
             ].map((stat, index) => {
              // Define complete color schemes for each stat
              const colorSchemes: Record<string, {bg: string, border: string, text: string, value: string, hover: string}> = {
                slate: {
                  bg: 'from-slate-50 to-slate-100',
                  border: 'border-slate-200',
                  text: 'text-slate-600',
                  value: 'text-slate-900',
                  hover: 'hover:border-slate-400 hover:shadow-slate-200/50'
                },
                purple: {
                  bg: 'from-purple-50 to-purple-100',
                  border: 'border-purple-200',
                  text: 'text-purple-600',
                  value: 'text-purple-900',
                  hover: 'hover:border-purple-400 hover:shadow-purple-200/50'
                },
                cyan: {
                  bg: 'from-cyan-50 to-cyan-100',
                  border: 'border-cyan-200',
                  text: 'text-cyan-600',
                  value: 'text-cyan-900',
                  hover: 'hover:border-cyan-400 hover:shadow-cyan-200/50'
                },
                green: {
                  bg: 'from-emerald-50 to-emerald-100',
                  border: 'border-emerald-200',
                  text: 'text-emerald-600',
                  value: 'text-emerald-900',
                  hover: 'hover:border-emerald-400 hover:shadow-emerald-200/50'
                },
                yellow: {
                  bg: 'from-amber-50 to-amber-100',
                  border: 'border-amber-200',
                  text: 'text-amber-600',
                  value: 'text-amber-900',
                  hover: 'hover:border-amber-400 hover:shadow-amber-200/50'
                },
                blue: {
                  bg: 'from-blue-50 to-blue-100',
                  border: 'border-blue-200',
                  text: 'text-blue-600',
                  value: 'text-blue-900',
                  hover: 'hover:border-blue-400 hover:shadow-blue-200/50'
                }
              };
              
              const colors = colorSchemes[stat.color as keyof typeof colorSchemes];
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stat.delay, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`relative bg-gradient-to-br ${colors.bg} rounded-xl p-4 sm:p-5 shadow-sm border-2 ${colors.border} ${colors.hover} transition-all duration-300 cursor-pointer group`}
                >
                  <div className="flex flex-col gap-2">
                    <div className={`${colors.text} text-xs font-bold uppercase tracking-wider`}>
                      {stat.label}
                    </div>
                    <div className={`${colors.value} text-3xl sm:text-4xl font-black tabular-nums`}>
                      {stat.value}
                    </div>
                    {stat.subtitle && (
                      <div className={`${colors.text} text-xs font-medium opacity-70`}>
                        {stat.subtitle}
                      </div>
                    )}
                  </div>
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Tabs with Counts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="p-4 sm:p-6">
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pb-2">
              {[
                { id: 'assignedToMe', icon: ListChecks, label: 'Assigned To Me', count: allUnifiedTasks.length },
                { id: 'iAssigned', icon: Send, label: 'Tasks I Assigned', count: tasksIAssigned.length },
                ...(user?.role?.toLowerCase() === 'superadmin' || user?.role?.toLowerCase() === 'super admin' 
                  ? [{ id: 'allTasks', icon: Target, label: 'All Tasks', count: allTasksForAdmin.length }]
                  : []
                ),
                { id: 'due', icon: AlertCircle, label: 'Due till Today', count: dueTasks },
                { id: 'fms', icon: Target, label: 'FMS Projects', count: fmsTaskCount },
                { id: 'tm', icon: CheckSquare, label: 'Delegated Tasks', count: tmTaskCount },
                { id: 'objections', icon: AlertCircle, label: 'Objections', count: objections.length },
                { id: 'assign', icon: Plus, label: 'Assign Task', count: null },
                { id: 'performance', icon: BarChart3, label: 'Performance', count: null },
              ].map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setCurrentPage(1); // Reset to first page when switching tabs
                      setSearchQuery(''); // Clear search
                      setStatusFilter('all'); // Reset filters
                      setTypeFilter('all');
                      setDateRangeFilter({start: '', end: ''});
                    }}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:shadow-md border border-slate-200/50'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="font-semibold tracking-wide">{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {tab.count}
                    </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task List or Revisions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          {fmsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{fmsError}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
              <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
          </div>
        )}
        
          {/* Search and Filter Bar - Show only for task tabs */}
          {(activeTab === 'assignedToMe' || activeTab === 'iAssigned' || activeTab === 'allTasks' || activeTab === 'fms' || activeTab === 'tm' || activeTab === 'due') && (
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  placeholder="Search by title, description, project, or assignee..."
                  className="w-full px-5 py-3 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="done">Done</option>
                  <option value="revision">Revision</option>
                </select>
                
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="FMS">FMS Projects</option>
                  <option value="TASK_MANAGEMENT">Delegated Tasks</option>
                </select>
                
                <input
                  type="date"
                  value={dateRangeFilter.start}
                  onChange={(e) => {
                    setDateRangeFilter({...dateRangeFilter, start: e.target.value});
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Start Date"
                />
                
                <input
                  type="date"
                  value={dateRangeFilter.end}
                  onChange={(e) => {
                    setDateRangeFilter({...dateRangeFilter, end: e.target.value});
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="End Date"
                />
                
                {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateRangeFilter.start || dateRangeFilter.end) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setTypeFilter('all');
                      setDateRangeFilter({start: '', end: ''});
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              
              <div className="text-sm text-slate-600">
                Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </div>
            </div>
          )}

          {activeTab === 'objections' ? (
            // Objections Section
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Objection Reviews</h2>
              {objectionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-slate-600" />
                </div>
              ) : objections.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No pending objections</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {objections.map((objection) => (
                    <div key={objection.objectionId} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900 mb-1">
                                {objection.taskDescription}
                              </h3>
                              <p className="text-sm text-red-700">
                                <strong>Type:</strong> {objection.taskType === 'FMS' ? 'FMS Project Task' : 'Delegated Task'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg mb-3">
                            <p className="text-sm text-slate-700 mb-2">
                              <strong>Reason for Objection:</strong>
                            </p>
                            <p className="text-sm text-slate-900">{objection.reason}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <p><strong>Raised by:</strong> {objection.raisedBy}</p>
                            <p><strong>Raised on:</strong> {formatDate(objection.raisedOn)}</p>
                            {objection.projectId && (
                              <p><strong>Project:</strong> {objection.projectId}</p>
                            )}
                            <p><strong>Task ID:</strong> {objection.taskId}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleHoldAction(objection, 'reject')}
                            disabled={updating === objection.objectionId}
                            className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm disabled:opacity-50"
                          >
                            Reject Objection
                          </button>
                          <button
                            onClick={() => handleHoldAction(objection, 'terminate')}
                            disabled={updating === objection.objectionId}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                          >
                            Terminate Task
                          </button>
                          <button
                            onClick={() => handleHoldAction(objection, 'replace')}
                            disabled={updating === objection.objectionId}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                          >
                            Terminate & Create New
                          </button>
                          <button
                            onClick={() => handleHoldAction(objection, 'hold')}
                            disabled={updating === objection.objectionId}
                            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm disabled:opacity-50"
                          >
                            Hold Task
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'assign' ? (
            // Assign Task Section
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleAssignTask} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assign To
                  </label>
                  <select
                    value={assignForm.assignedTo}
                    onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">Select User</option>
                    {taskUsers.map(user => (
                      <option key={user.userId} value={user.userId}>
                        {user.name} ({user.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Task Description
                  </label>
                  <textarea
                    value={assignForm.description}
                    onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="Describe the task..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={assignForm.department}
                    onChange={(e) => setAssignForm({ ...assignForm, department: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="Department (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Planned Date
                  </label>
                  <input
                    type="date"
                    value={assignForm.plannedDate}
                    onChange={(e) => setAssignForm({ ...assignForm, plannedDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tutorial Links (Optional)
                  </label>
                  <input
                    type="url"
                    value={assignForm.tutorialLinks}
                    onChange={(e) => setAssignForm({ ...assignForm, tutorialLinks: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                {/* File Upload for Task */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    📎 Attachments (Optional)
                  </label>
                  <DriveFileUpload
                    fmsName={`Task-${assignForm.description.substring(0, 20)}`}
                    username={user!.username}
                    onFilesUploaded={(files) => {
                      setAssignForm({ ...assignForm, attachments: files });
                    }}
                    currentFiles={assignForm.attachments}
                    maxFiles={3}
                    maxSizeMB={2}
                    onPendingFilesChange={setHasPendingUploads}
                  />
                </div>

                <button
                  type="submit"
                  disabled={tmLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {tmLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Assign Task
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : activeTab === 'performance' ? (
            // Performance Section
            <div className="space-y-6">
              <div className="max-w-2xl mx-auto">
                {/* User Selection for Scoring */}
                {getScoringUsers().length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select User for Scoring
                    </label>
                    <select
                      value={selectedScoringUser}
                      onChange={(e) => setSelectedScoringUser(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                      {getScoringUsers().map((user) => (
                        <option key={user.userId} value={user.userId}>
                          {user.name} ({user.userId}) - {user.department}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={scoringDates.startDate}
                      onChange={(e) => setScoringDates({ ...scoringDates, startDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={scoringDates.endDate}
                      onChange={(e) => setScoringDates({ ...scoringDates, endDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={loadScoringData}
                      disabled={loadingScoring}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingScoring ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        'Load'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {scoringData && (
                <div className="max-w-4xl mx-auto bg-slate-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Performance Report - {getScoringUsers().find(u => u.userId === selectedScoringUser)?.name || selectedScoringUser}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">Total Tasks</div>
                      <div className="text-2xl font-bold text-slate-900">{Math.max(0, scoringData.totalTasks || 0)}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">Completed</div>
                      <div className="text-2xl font-bold text-green-600">{scoringData.completedTasks}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">On Time</div>
                      <div className="text-2xl font-bold text-blue-600">{scoringData.completedOnTime}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">Not On Time</div>
                      <div className="text-2xl font-bold text-orange-600">{scoringData.completedNotOnTime}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">Due Not Completed</div>
                      <div className="text-2xl font-bold text-red-600">{scoringData.dueNotCompleted}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">Revisions</div>
                      <div className="text-2xl font-bold text-slate-900">{scoringData.revisionsTaken}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">Scores Impacted</div>
                      <div className="text-2xl font-bold text-slate-900">{scoringData.scoresImpacted}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">Total Score Sum</div>
                      <div className="text-2xl font-bold text-slate-900">{scoringData.totalScoreSum}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mt-6">
                    <div className="text-center">
                      <div className="text-sm uppercase tracking-wide mb-2">Final Performance Score</div>
                      <div className="text-5xl font-bold">{scoringData.finalScore}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
           ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm mt-2">
                {activeTab === 'due' 
                  ? 'You have no tasks due today. Great work!'
                  : activeTab === 'fms'
                  ? 'No FMS project tasks assigned to you'
                  : activeTab === 'tm'
                  ? 'No delegated tasks assigned to you'
                  : activeTab === 'assignedToMe'
                  ? 'No tasks assigned to you'
                  : activeTab === 'iAssigned'
                  ? 'You haven\'t assigned any tasks yet'
                  : activeTab === 'allTasks'
                  ? 'No tasks found in the system'
                  : 'Start by creating an FMS project or delegating tasks'}
              </p>
            </div>
           ) : (() => {
              // Pagination calculation
              const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
              
              return (
            <div className="space-y-6">
              {/* Mobile Card Layout for small screens */}
              <div className="block md:hidden space-y-3">
                {paginatedTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className={`group bg-gradient-to-br from-white via-white to-slate-50/50 backdrop-blur-sm rounded-2xl p-5 shadow-md border hover:shadow-2xl transition-all duration-300 ${
                      task.isOverdue ? 'border-red-300/60 bg-gradient-to-br from-red-50/30 to-red-100/20' : 'border-slate-200/60 hover:border-slate-300/80'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getTypeColor(task.type)}`}>
                        {task.type === 'FMS' ? 'FMS' : 'Task'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span className="whitespace-nowrap">{formatDate(task.dueDate)}</span>
                      </div>
                      {(task.projectName || task.department) && (
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">Project:</span> {task.projectName || task.department}
                        </p>
                      )}
                      {(activeTab === 'iAssigned' || activeTab === 'allTasks') && (
                        <p className="text-xs text-slate-700 font-semibold">
                          <span className="font-medium text-slate-500">Assignee:</span> {task.assignee}
                        </p>
                      )}
                    </div>

                    {/* Show checklist items if any */}
                    {task.type === 'FMS' && (task.source as ProjectTask).requiresChecklist && (task.source as ProjectTask).checklistItems && (task.source as ProjectTask).checklistItems!.length > 0 && (
                      <div className="mt-3 p-2 bg-blue-50/80 border border-blue-200/60 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                          <CheckSquare className="w-3 h-3 text-blue-600" />
                          <span className="text-blue-800 font-medium text-xs">Checklist:</span>
                        </div>
                        <div className="space-y-1">
                          {(task.source as ProjectTask).checklistItems!.slice(0, 2).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1">
                              <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                                item.completed ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'
                              }`}>
                                {item.completed && <CheckCircle className="w-2 h-2 text-white" />}
                              </div>
                              <span className={`text-xs ${item.completed ? 'line-through text-green-700' : 'text-slate-700'}`}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                          {(task.source as ProjectTask).checklistItems!.length > 2 && (
                            <div className="text-xs text-blue-600 font-medium">
                              +{(task.source as ProjectTask).checklistItems!.length - 2} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Show attachments if any */}
                    {(() => {
                      const attachments = getTaskAttachments(task);
                      return attachments.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Paperclip className="w-3 h-3 text-blue-600" />
                          <button
                            onClick={() => {
                              setSelectedTaskForAttachments(task);
                              setSelectedTaskAttachments(attachments);
                              setShowAttachmentModal(true);
                            }}
                            className="text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline"
                          >
                            {attachments.length} attachment(s)
                          </button>
                        </div>
                      );
                    })()}

                    {(task.status !== 'Done' && task.status.toLowerCase() !== 'completed') && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {(activeTab !== 'iAssigned' && activeTab !== 'allTasks') ? (
                          <>
                            <button
                              onClick={() => handleCompleteTask(task)}
                              disabled={updating === task.id}
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                            >
                              {updating === task.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Complete
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTaskForObjection(task);
                                setObjectionReason('');
                                setShowObjectionModal(true);
                              }}
                              disabled={updating === task.id}
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl text-sm font-semibold hover:from-red-600 hover:to-rose-700 hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                            >
                              <AlertCircle className="w-4 h-4" />
                              Objection
                            </button>
                          </>
                        ) : (
                          <div className="w-full text-center py-2 text-sm text-slate-500 italic">
                            View only - You assigned this task
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase">Type</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase min-w-[200px]">Task</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase min-w-[150px]">Project</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase">Due Date</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase">Status</th>
                      {(activeTab === 'iAssigned' || activeTab === 'allTasks') && (
                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase">Assignee</th>
                      )}
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-slate-200/60">
                  {paginatedTasks.map((task) => (
                      <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${task.isOverdue ? 'bg-red-50' : 'bg-white'}`}>
                        <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(task.type)}`}>
                          {task.type === 'FMS' ? 'FMS' : 'Task'}
                        </span>
                      </td>
                        <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900 break-words min-w-[180px]">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-slate-500 mt-1 break-words line-clamp-2 max-w-[250px]">{task.description}</div>
                        )}
                        
                        {/* Show checklist items if any */}
                        {task.type === 'FMS' && (task.source as ProjectTask).requiresChecklist && (task.source as ProjectTask).checklistItems && (task.source as ProjectTask).checklistItems!.length > 0 && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <CheckSquare className="w-3 h-3 text-blue-600" />
                              <span className="text-blue-800 font-medium">Checklist:</span>
                            </div>
                            <div className="space-y-1">
                              {(task.source as ProjectTask).checklistItems!.slice(0, 2).map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                                    item.completed ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'
                                  }`}>
                                    {item.completed && <CheckCircle className="w-2 h-2 text-white" />}
                                  </div>
                                  <span className={`text-xs ${item.completed ? 'line-through text-green-700' : 'text-slate-700'}`}>
                                    {item.text}
                                  </span>
                                </div>
                              ))}
                              {(task.source as ProjectTask).checklistItems!.length > 2 && (
                                <div className="text-xs text-blue-600 font-medium">
                                  +{(task.source as ProjectTask).checklistItems!.length - 2} more items
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Show attachments if any */}
                        {(() => {
                          const attachments = getTaskAttachments(task);
                          return attachments.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Paperclip className="w-3 h-3 text-blue-600" />
                              <button
                                onClick={() => {
                                  setSelectedTaskForAttachments(task);
                                  setSelectedTaskAttachments(attachments);
                                  setShowAttachmentModal(true);
                                }}
                                className="text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {attachments.length} attachment(s) - Click to view
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                        <span className="break-words min-w-[120px]">{task.projectName || task.department || 'N/A'}</span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className="whitespace-nowrap">{formatDate(task.dueDate)}</span>
                      </div>
                        {task.isOverdue && (
                          <span className="text-xs text-red-600 font-medium">Overdue!</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      {(activeTab === 'iAssigned' || activeTab === 'allTasks') && (
                        <td className="px-2 sm:px-3 md:px-4 py-3 text-sm text-slate-700 font-medium">
                          {task.assignee}
                        </td>
                      )}
                      <td className="px-2 sm:px-3 md:px-4 py-3">
                        {(task.status !== 'Done' && task.status.toLowerCase() !== 'completed') && (
                          <div className="flex flex-wrap gap-2">
                            {(activeTab !== 'iAssigned' && activeTab !== 'allTasks') && (
                              <>
                                <button
                                  onClick={() => handleCompleteTask(task)}
                                  disabled={updating === task.id}
                                  className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-700 hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                                >
                                  {updating === task.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                  Complete
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTaskForObjection(task);
                                    setObjectionReason('');
                                    setShowObjectionModal(true);
                                  }}
                                  disabled={updating === task.id}
                                  className="px-3 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-sm font-semibold hover:from-red-600 hover:to-rose-700 hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                                  title="Raise Objection"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                  Objection
                                </button>
                              </>
                            )}
                            {(activeTab === 'iAssigned' || activeTab === 'allTasks') && (
                              <span className="text-sm text-slate-500 italic">View only</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length} tasks
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      First
                    </button>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
                          const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                          
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && (
                                <span className="px-2 text-slate-400">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${
                                  currentPage === page
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                    
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
          </div>
          );
          })()
        }

        </div>

         {/* Quick Actions Footer */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.6 }}
           >
             <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.Icon;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className={`flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br ${action.gradient} text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all`}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-sm font-bold text-center">{action.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Objection Modal */}
      {showObjectionModal && selectedTaskForObjection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-white/20 relative overflow-hidden"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-white/50 to-orange-50/50 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-400/10 to-orange-400/10 rounded-full blur-2xl -translate-y-16 translate-x-16 pointer-events-none"></div>

            <div className="relative flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl shadow-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Raise Objection
                </h3>
                                      </div>
              <button
                onClick={() => setShowObjectionModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-6 p-4 bg-gradient-to-br from-red-50/80 to-orange-50/80 border border-red-200/60 rounded-2xl backdrop-blur-sm">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-900">
                  Warning: Raising an objection will route this task for review
                </p>
              </div>
              <p className="text-xs text-red-700/90 pl-6">
                {selectedTaskForObjection.type === 'FMS' 
                  ? 'This will be sent to the Step 1 person for review.'
                  : 'This will be sent to the task giver for review.'}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Task:</strong> {selectedTaskForObjection.title}
              </p>
              <p className="text-sm text-slate-600 mb-2">
                <strong>Type:</strong> {selectedTaskForObjection.type === 'FMS' ? 'FMS Project Task' : 'Delegated Task'}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Due Date:</strong> {formatDate(selectedTaskForObjection.dueDate)}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Objection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={objectionReason}
                  onChange={(e) => setObjectionReason(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Explain why you're raising an objection (e.g., unclear requirements, missing resources, impossible deadline)..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Be specific and provide details to help the reviewer understand your concerns.
                </p>
              </div>
            </div>

            <div className="relative flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowObjectionModal(false)}
                className="px-6 py-3 text-sm font-semibold text-slate-700 bg-white/80 hover:bg-white/90 rounded-2xl transition-all shadow-lg hover:shadow-xl border border-slate-200/60"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRaiseObjection}
                disabled={!objectionReason.trim() || !!updating}
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Raising Objection...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Raise Objection
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Checklist Completion Modal */}
      {showChecklistModal && taskToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Complete Checklist</h3>
              <button
                onClick={() => {
                  setShowChecklistModal(false);
                  setTaskToComplete(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 mb-2">
                ℹ️ <strong>This task requires checklist completion</strong>
              </p>
              <p className="text-xs text-blue-700">
                Please check all items below before completing the task.
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Task:</strong> {taskToComplete.title}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Type:</strong> FMS Project Task
              </p>
              
              {/* Show attachments if any */}
              {(() => {
                const attachments = getTaskAttachments(taskToComplete);
                return attachments.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments:
                    </p>
                    <div className="space-y-1">
                      {attachments.map((att: any, idx: number) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {att.name}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-slate-900 mb-3">Checklist Items:</h4>
              {checklistItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    item.completed 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                  }`}
                  onClick={() => toggleChecklistItem(item.id)}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      item.completed
                        ? 'bg-green-600 border-green-600'
                        : 'bg-white border-slate-300'
                    }`}>
                      {item.completed && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      item.completed ? 'text-green-900 line-through' : 'text-slate-900'
                    }`}>
                      {index + 1}. {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Progress:</span>
                <span className="text-sm font-bold text-slate-900">
                  {checklistItems.filter(i => i.completed).length} / {checklistItems.length} items completed
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowChecklistModal(false);
                  setTaskToComplete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (taskToComplete) {
                    completeTaskDirectly(taskToComplete);
                  }
                }}
                disabled={!allChecklistItemsCompleted() || !!updating}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Task
                  </>
                )}
              </button>
            </div>

            {!allChecklistItemsCompleted() && (
              <p className="text-xs text-red-600 text-center mt-3">
                ⚠️ All checklist items must be checked to complete this task
              </p>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Approve/Reject */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Confirm {confirmAction.type === 'approve' ? 'Approval' : 'Rejection'}
              </h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
                                  </div>

            <div className="mb-6">
              <div className={`p-4 rounded-lg mb-4 ${
                confirmAction.type === 'approve' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className="text-sm font-medium mb-2">
                  {confirmAction.type === 'approve' 
                    ? '✓ You are about to APPROVE this revision request' 
                    : '✕ You are about to REJECT this revision request'}
                </p>
                                </div>

              <div className="space-y-2 text-sm text-slate-700">
                <p><strong>Project:</strong> {confirmAction.revision.projectName}</p>
                <p><strong>Task:</strong> {confirmAction.revision.taskDescription}</p>
                <p><strong>Requested by:</strong> {confirmAction.revision.requestedBy}</p>
                <p><strong>Current Date:</strong> {formatDate(confirmAction.revision.currentDueDate)}</p>
                {confirmAction.revision.requestedNewDate && (
                  <p><strong>New Date:</strong> {formatDate(confirmAction.revision.requestedNewDate)}</p>
                )}
                <p><strong>Reason:</strong> {confirmAction.revision.reason}</p>
                          </div>

              {confirmAction.type === 'approve' && confirmAction.revision.requestedNewDate && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The task due date will be updated to {formatDate(confirmAction.revision.requestedNewDate)}
                  </p>
                        </div>
                      )}
                    </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  confirmAction.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmAction.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
              </div>
          </div>
          </div>
        )}
      {/* Hold Options Modal */}
      {showHoldModal && selectedObjectionForHold && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {holdAction === 'reject' && 'Reject Objection'}
                {holdAction === 'terminate' && 'Terminate Task'}
                {holdAction === 'replace' && 'Terminate & Create New Task'}
                {holdAction === 'hold' && 'Hold Task'}
              </h3>
              <button
                onClick={() => setShowHoldModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Task:</strong> {selectedObjectionForHold.taskDescription}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Objection Reason:</strong> {selectedObjectionForHold.reason}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {holdAction === 'replace' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Assignee (Optional)
                    </label>
                    <select
                      value={holdData.newAssignee}
                      onChange={(e) => setHoldData({ ...holdData, newAssignee: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                      <option value="">Keep current assignee</option>
                      {taskUsers.map(user => (
                        <option key={user.userId} value={user.userId}>
                          {user.name} ({user.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={holdData.newDueDate}
                      onChange={(e) => setHoldData({ ...holdData, newDueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Action
                </label>
                <textarea
                  value={holdData.reason}
                  onChange={(e) => setHoldData({ ...holdData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder={`Explain why you're ${holdAction === 'reject' ? 'rejecting' : holdAction === 'terminate' ? 'terminating' : holdAction === 'replace' ? 'replacing' : 'holding'} this task...`}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowHoldModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeHoldAction}
                disabled={updating === selectedObjectionForHold.objectionId || !holdData.reason.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  holdAction === 'reject' ? 'bg-slate-600 hover:bg-slate-700' :
                  holdAction === 'terminate' ? 'bg-red-600 hover:bg-red-700' :
                  holdAction === 'replace' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {updating === selectedObjectionForHold.objectionId ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {holdAction === 'reject' && 'Reject Objection'}
                    {holdAction === 'terminate' && 'Terminate Task'}
                    {holdAction === 'replace' && 'Terminate & Create New'}
                    {holdAction === 'hold' && 'Hold Task'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Modal */}
      {showAttachmentModal && selectedTaskForAttachments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Task Attachments</h3>
              <button
                onClick={() => {
                  setShowAttachmentModal(false);
                  setSelectedTaskForAttachments(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Task:</strong> {selectedTaskForAttachments.title}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Type:</strong> FMS Project Task
              </p>
            </div>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments ({selectedTaskAttachments.length}):
              </h4>
              {selectedTaskAttachments.map((att: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{att.name}</p>
                      {att.size && (
                        <p className="text-xs text-slate-500">
                          Size: {Math.round(att.size / 1024)} KB
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View
                  </a>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAttachmentModal(false);
                  setSelectedTaskForAttachments(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
