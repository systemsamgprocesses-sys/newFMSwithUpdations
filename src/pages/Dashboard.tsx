import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Loader, Calendar, ListChecks, AlertCircle, TrendingUp, Target, X, Edit, Paperclip, ExternalLink, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useAlert } from '../context/AlertContext';
import { api } from '../services/api';
import { ProjectTask, TaskData } from '../types';
import { SkeletonDashboard } from '../components/SkeletonLoader';

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
  const [taskUsers, setTaskUsers] = useState<any[]>([]);

  // FMS Revisions state
  const [fmsRevisions, setFmsRevisions] = useState<any[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);

  // Objections state
  const [objections, setObjections] = useState<any[]>([]);
  const [objectionsLoading, setObjectionsLoading] = useState(false);

  // Unified state
  const [activeTab, setActiveTab] = useState<'all' | 'fms' | 'tm' | 'due' | 'revisions' | 'objections'>('all');

  // Modal state
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null);
  const [revisionData, setRevisionData] = useState({
    newDate: '',
    reason: ''
  });

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

  useEffect(() => {
    if (user?.username) {
      loadMyTasks(user.username);
      loadTaskManagementData();
      loadFMSRevisions();
      loadObjections();
    }
  }, [user?.username]);

  const loadTaskManagementData = async () => {
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
  };

  const loadFMSRevisions = async () => {
    if (!user?.username) return;
    
    setRevisionsLoading(true);
    try {
      const result = await api.getFMSRevisions(user.username);
      if (result.success) {
        setFmsRevisions(result.revisions || []);
      }
    } catch (err: any) {
      console.error('Error loading FMS revisions:', err);
    } finally {
      setRevisionsLoading(false);
    }
  };

  const loadObjections = async () => {
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
  };

  const getUnifiedTasks = (): UnifiedTask[] => {
    const unified: UnifiedTask[] = [];

    fmsTasks.forEach(task => {
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
    });

    tmTasks.forEach(task => {
      const dueDate = new Date(task['PLANNED DATE']);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      const status = task['Task Status'].toLowerCase();

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
    });

    return unified.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const allUnifiedTasks = getUnifiedTasks();

  const getFilteredTasks = (): UnifiedTask[] => {
    const tasks = allUnifiedTasks;
    
    switch (activeTab) {
      case 'fms':
        return tasks.filter(t => t.type === 'FMS');
      case 'tm':
        return tasks.filter(t => t.type === 'TASK_MANAGEMENT');
      case 'due':
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return tasks.filter(t => {
          const dueDate = new Date(t.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          const isDue = dueDate <= now;
          const isNotCompleted = t.status !== 'Done' && t.status.toLowerCase() !== 'completed';
          return isDue && isNotCompleted;
        });
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  // Filter tasks assigned till current date (exclude future tasks)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const tasksAssignedTillToday = allUnifiedTasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= now; // Only tasks with due date today or in the past
  });

  const totalTasks = tasksAssignedTillToday.length;
  const fmsTaskCount = tasksAssignedTillToday.filter(t => t.type === 'FMS').length;
  const tmTaskCount = tasksAssignedTillToday.filter(t => t.type === 'TASK_MANAGEMENT').length;
  const completedTasks = tasksAssignedTillToday.filter(t => 
    t.status === 'Done' || t.status.toLowerCase() === 'completed'
  ).length;
  const dueTasks = tasksAssignedTillToday.filter(t => {
    const dueDate = new Date(t.dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= now && t.status !== 'Done' && t.status.toLowerCase() !== 'completed';
  }).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
          await loadMyTasks(user!.username);
          await loadTaskManagementData();
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
          await loadTaskManagementData();
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

  const handleReviseTask = (task: UnifiedTask) => {
    setSelectedTask(task);
    setRevisionData({ newDate: '', reason: '' });
    setShowRevisionModal(true);
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

  const submitRevision = async () => {
    if (!selectedTask || !revisionData.reason.trim()) {
      setError('Please provide a reason for revision');
      return;
    }

    setUpdating(selectedTask.id);
    try {
      if (selectedTask.type === 'FMS') {
        const fmsTask = selectedTask.source as ProjectTask;
        if (!fmsTask.rowIndex) return;
        
        const result = await api.requestFMSRevision({
          rowIndex: fmsTask.rowIndex,
          projectId: fmsTask.projectId,
          projectName: fmsTask.projectName,
          stepNo: fmsTask.stepNo,
          taskDescription: fmsTask.what,
          currentDueDate: fmsTask.plannedDueDate,
          requestedBy: user!.username,
          requestedNewDate: revisionData.newDate,
          reason: revisionData.reason
        });

      if (result.success) {
          setShowRevisionModal(false);
          setSuccess('Revision request submitted successfully!');
          await loadMyTasks(user!.username);
          await loadFMSRevisions();
          setError('');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          // Check if revision already pending
          if (result.alreadyPending) {
            setShowRevisionModal(false);
            // Show alert popup
            alert(result.message || 'A revision request is already pending for this task.');
          } else {
            setError(result.message || 'Failed to request revision');
          }
        }
      } else {
        const tmTask = selectedTask.source as TaskData;
        const result = await api.updateTask(
          tmTask['Task Id'],
          'revise',
          {
            newDate: revisionData.newDate,
            reason: revisionData.reason
          }
        );
        
        if (result.success) {
          setShowRevisionModal(false);
          setSuccess('Revision request submitted successfully!');
          await loadTaskManagementData();
          setError('');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(result.message || 'Failed to request revision');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request revision');
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

  const showApproveConfirmation = (revision: any) => {
    setConfirmAction({ type: 'approve', revision });
    setShowConfirmModal(true);
  };

  const showRejectConfirmation = (revision: any) => {
    setConfirmAction({ type: 'reject', revision });
    setShowConfirmModal(true);
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
          await loadFMSRevisions();
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
          await loadFMSRevisions();
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

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6"
    >
      <div className="card-premium">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3"
          >
            <div className="p-2 bg-gradient-to-br from-accent-500 to-brand-500 rounded-xl">
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            Unified Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-slate-600"
          >
            All your FMS projects and tasks in one place
          </motion.p>
        </div>

        {/* Statistics Cards */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-premium-gradient-subtle">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
          >
            {[
              { label: 'Total Tasks', value: totalTasks, subtitle: 'Till today', color: 'slate', delay: 0.1 },
              { label: 'FMS Tasks', value: fmsTaskCount, subtitle: 'Till today', color: 'purple', delay: 0.15 },
              { label: 'Assigned Tasks', value: tmTaskCount, subtitle: 'Till today', color: 'cyan', delay: 0.2 },
              { label: 'Completed', value: completedTasks, subtitle: '', color: 'green', delay: 0.25 },
              { label: 'Due Tasks', value: dueTasks, subtitle: '', color: 'yellow', delay: 0.3 },
              { label: 'Completion', value: `${completionRate}%`, subtitle: '', color: 'blue', delay: 0.35 },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: stat.delay }}
                whileHover={{ scale: 1.05, y: -4 }}
                className={`bg-white rounded-xl p-3 sm:p-4 shadow-lg border-2 hover-lift cursor-pointer border-${stat.color}-200 bg-gradient-to-br from-white to-${stat.color}-50`}
              >
                <div className={`text-${stat.color}-600 text-xs sm:text-sm mb-1 font-semibold`}>{stat.label}</div>
                <div className={`text-xl sm:text-2xl font-bold text-${stat.color}-900`}>{stat.value}</div>
                {stat.subtitle && <div className={`text-xs text-${stat.color}-500 mt-1`}>{stat.subtitle}</div>}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Tabs with Counts */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-premium pb-2 sm:pb-0">
              {[
                { id: 'all', icon: ListChecks, label: 'All', count: totalTasks },
                { id: 'due', icon: AlertCircle, label: 'Due Today', count: dueTasks },
                { id: 'fms', icon: Target, label: 'FMS Projects', count: fmsTaskCount },
                { id: 'tm', icon: CheckSquare, label: 'Assigned Tasks', count: tmTaskCount },
                { id: 'revisions', icon: Edit, label: 'Revisions', count: fmsRevisions.length },
                { id: 'objections', icon: AlertCircle, label: 'Objections', count: objections.length },
              ].map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`btn-premium flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium whitespace-nowrap text-sm sm:text-base transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-accent-600 to-brand-600 text-white shadow-glow'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-2 border-slate-200 hover:border-accent-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/20' : 'bg-slate-100'
                    }`}>
                      {tab.count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task List or Revisions */}
        <div className="p-4 sm:p-6">
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

          {activeTab === 'revisions' ? (
            // FMS Revisions Section
          <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">FMS Revision Requests</h2>
              {revisionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-slate-600" />
                </div>
              ) : fmsRevisions.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Edit className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No pending revision requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                  {fmsRevisions.map((revision) => (
                    <div key={revision.revisionId} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                          <h3 className="font-bold text-slate-900 mb-2">{revision.projectName} - Step {revision.stepNo}</h3>
                          <p className="text-sm text-slate-700 mb-2"><strong>Task:</strong> {revision.taskDescription}</p>
                          <p className="text-sm text-slate-600 mb-1"><strong>Requested by:</strong> {revision.requestedBy}</p>
                          <p className="text-sm text-slate-600 mb-1"><strong>Current Due Date:</strong> {formatDate(revision.currentDueDate)}</p>
                          {revision.requestedNewDate && (
                            <p className="text-sm text-slate-600 mb-1"><strong>Requested New Date:</strong> {formatDate(revision.requestedNewDate)}</p>
                          )}
                          <p className="text-sm text-slate-700 mt-2"><strong>Reason:</strong> {revision.reason}</p>
                          <p className="text-xs text-slate-500 mt-2">Requested on: {formatDate(revision.requestedOn)}</p>
                      </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => showApproveConfirmation(revision)}
                            disabled={updating === revision.revisionId}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {updating === revision.revisionId ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              'Approve'
                            )}
                          </button>
                          <button
                            onClick={() => showRejectConfirmation(revision)}
                            disabled={updating === revision.revisionId}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'objections' ? (
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
                                <strong>Type:</strong> {objection.taskType === 'FMS' ? 'FMS Project Task' : 'Assigned Task'}
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
                  ? 'No individual tasks assigned to you'
                  : 'Start by creating an FMS project or assigning tasks'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-premium -mx-2 sm:-mx-4 md:-mx-6 px-2 sm:px-4 md:px-6">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 sm:px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Type</th>
                    <th className="px-2 sm:px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase min-w-[200px]">Task</th>
                    <th className="px-2 sm:px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase hidden sm:table-cell min-w-[150px]">Particulars</th>
                    <th className="px-2 sm:px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase hidden md:table-cell">Due Date</th>
                    <th className="px-2 sm:px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                    <th className="px-2 sm:px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className={`hover:bg-slate-50 ${task.isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="px-2 sm:px-3 md:px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(task.type)}`}>
                          {task.type === 'FMS' ? 'FMS' : 'Task'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-3">
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
                      <td className="px-2 sm:px-3 md:px-4 py-3">
                        {(task.status !== 'Done' && task.status.toLowerCase() !== 'completed') && (
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <button
                              onClick={() => handleCompleteTask(task)}
                              disabled={updating === task.id}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {updating === task.id ? <Loader className="w-3 h-3 animate-spin" /> : 'Complete'}
                            </button>
                            <button
                              onClick={() => handleReviseTask(task)}
                              disabled={updating === task.id}
                              className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              Revise
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTaskForObjection(task);
                                setObjectionReason('');
                                setShowObjectionModal(true);
                              }}
                              disabled={updating === task.id}
                              className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors disabled:opacity-50"
                              title="Raise Objection"
                            >
                              Objection
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

        {/* Quick Actions Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="p-4 sm:p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            {[
              { onClick: () => navigate('/start-project'), icon: Target, label: 'Start FMS Project', color: 'from-purple-600 to-purple-700' },
              { onClick: () => navigate('/tasks?tab=assign'), icon: CheckSquare, label: 'Assign Task', color: 'from-cyan-600 to-cyan-700' },
              {
                onClick: () => {
                  loadMyTasks(user!.username);
                  loadTaskManagementData();
                  loadFMSRevisions();
                  loadObjections();
                },
                icon: TrendingUp,
                label: 'Refresh',
                color: 'from-slate-600 to-slate-700',
              },
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.onClick}
                  className={`btn-premium flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r ${action.color} text-white rounded-xl font-medium shadow-lg hover:shadow-glow transition-all text-sm sm:text-base`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {action.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Request Revision</h3>
              <button
                onClick={() => setShowRevisionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
                          </button>
                        </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Task:</strong> {selectedTask.title}
              </p>
              <p className="text-sm text-slate-600 mb-2">
                <strong>Type:</strong> {selectedTask.type === 'FMS' ? 'FMS Project Task' : 'Assigned Task'}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Current Due Date:</strong> {formatDate(selectedTask.dueDate)}
              </p>
                      </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Requested New Date (Optional)
                </label>
                <input
                  type="date"
                  value={revisionData.newDate}
                  onChange={(e) => setRevisionData({ ...revisionData, newDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
                                      </div>

                                      <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Revision <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={revisionData.reason}
                  onChange={(e) => setRevisionData({ ...revisionData, reason: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Explain why you need a revision..."
                />
                                      </div>
                                    </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRevision}
                disabled={!revisionData.reason.trim() || !!updating}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Request Revision
                  </>
                )}
              </button>
                                    </div>
                                  </div>
                                      </div>
                                    )}

      {/* Objection Modal */}
      {showObjectionModal && selectedTaskForObjection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Raise Objection</h3>
              <button
                onClick={() => setShowObjectionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900 mb-2">
                ⚠️ <strong>Warning:</strong> Raising an objection will route this task for review.
              </p>
              <p className="text-xs text-red-700">
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
                <strong>Type:</strong> {selectedTaskForObjection.type === 'FMS' ? 'FMS Project Task' : 'Assigned Task'}
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

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowObjectionModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRaiseObjection}
                disabled={!objectionReason.trim() || !!updating}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Completion Modal */}
      {showChecklistModal && taskToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
