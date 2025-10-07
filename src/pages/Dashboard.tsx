import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Loader, Calendar, ListChecks, AlertCircle, TrendingUp, Target, X, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { api } from '../services/api';
import { ProjectTask, TaskData } from '../types';

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
  const navigate = useNavigate();
  const [updating, setUpdating] = useState<string | null>(null);

  // Task Management state
  const [tmTasks, setTmTasks] = useState<TaskData[]>([]);
  const [tmLoading, setTmLoading] = useState(false);

  // FMS Revisions state
  const [fmsRevisions, setFmsRevisions] = useState<any[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);

  // Unified state
  const [activeTab, setActiveTab] = useState<'all' | 'fms' | 'tm' | 'due' | 'revisions'>('all');

  // Modal state
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null);
  const [revisionData, setRevisionData] = useState({
    newDate: '',
    reason: ''
  });
  
  // Confirmation modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    revision: any;
  } | null>(null);
  
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.username) {
      loadMyTasks(user.username);
      loadTaskManagementData();
      loadFMSRevisions();
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

  const totalTasks = allUnifiedTasks.length;
  const fmsTaskCount = allUnifiedTasks.filter(t => t.type === 'FMS').length;
  const tmTaskCount = allUnifiedTasks.filter(t => t.type === 'TASK_MANAGEMENT').length;
  const completedTasks = allUnifiedTasks.filter(t => 
    t.status === 'Done' || t.status.toLowerCase() === 'completed'
  ).length;
  const dueTasks = allUnifiedTasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= now && t.status !== 'Done' && t.status.toLowerCase() !== 'completed';
  }).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleCompleteTask = async (task: UnifiedTask) => {
    setUpdating(task.id);
    try {
      if (task.type === 'FMS') {
        const fmsTask = task.source as ProjectTask;
        if (!fmsTask.rowIndex) return;
        
        const result = await api.updateTaskStatus(fmsTask.rowIndex, 'Done', user!.username);
        if (result.success) {
          await loadMyTasks(user!.username);
          await loadTaskManagementData();
        } else {
          setError(result.message || 'Failed to update task');
        }
      } else {
        const tmTask = task.source as TaskData;
        const result = await api.updateTask(tmTask['Task Id'], 'complete', {});
        
        if (result.success) {
          await loadTaskManagementData();
        } else {
          setError(result.message || 'Failed to update task');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setUpdating(null);
    }
  };

  const handleReviseTask = (task: UnifiedTask) => {
    setSelectedTask(task);
    setRevisionData({ newDate: '', reason: '' });
    setShowRevisionModal(true);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-slate-600 mb-4" />
          <p className="text-slate-600">Loading unified dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <CheckSquare className="w-7 h-7 sm:w-8 sm:h-8" />
            Unified Dashboard
        </h1>
          <p className="text-sm sm:text-base text-slate-600">All your FMS projects and tasks in one place</p>
        </div>

        {/* Statistics Cards */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
              <div className="text-slate-600 text-xs sm:text-sm mb-1">Total Tasks</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{totalTasks}</div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-purple-200">
              <div className="text-purple-600 text-xs sm:text-sm mb-1">FMS Tasks</div>
              <div className="text-xl sm:text-2xl font-bold text-purple-900">{fmsTaskCount}</div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-cyan-200">
              <div className="text-cyan-600 text-xs sm:text-sm mb-1">Assigned Tasks</div>
              <div className="text-xl sm:text-2xl font-bold text-cyan-900">{tmTaskCount}</div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-green-200">
              <div className="text-green-600 text-xs sm:text-sm mb-1">Completed</div>
              <div className="text-xl sm:text-2xl font-bold text-green-900">{completedTasks}</div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-yellow-200">
              <div className="text-yellow-600 text-xs sm:text-sm mb-1">Due Tasks</div>
              <div className="text-xl sm:text-2xl font-bold text-yellow-900">{dueTasks}</div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-blue-200">
              <div className="text-blue-600 text-xs sm:text-sm mb-1">Completion</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-900">{completionRate}%</div>
            </div>
          </div>
        </div>

        {/* Tabs with Counts */}
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="px-4 sm:px-6 py-2">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                All ({totalTasks})
              </button>
              
              <button
                onClick={() => setActiveTab('due')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'due'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Due Today ({dueTasks})
              </button>
              
              <button
                onClick={() => setActiveTab('fms')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'fms'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Target className="w-4 h-4" />
                FMS Projects ({fmsTaskCount})
              </button>
              
            <button
                onClick={() => setActiveTab('tm')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'tm'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                Assigned Tasks ({tmTaskCount})
            </button>

            <button
                onClick={() => setActiveTab('revisions')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'revisions'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Edit className="w-4 h-4" />
                FMS Revisions ({fmsRevisions.length})
            </button>
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Type</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Task</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase hidden sm:table-cell">Project/Dept</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Due Date</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className={`hover:bg-slate-50 ${task.isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="px-3 sm:px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(task.type)}`}>
                          {task.type === 'FMS' ? 'FMS' : 'Task'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">{task.description}</div>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                        {task.projectName || task.department || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.dueDate)}
                      </div>
                        {task.isOverdue && (
                          <span className="text-xs text-red-600 font-medium">Overdue!</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        {(task.status !== 'Done' && task.status.toLowerCase() !== 'completed') && (
                          <div className="flex gap-1 sm:gap-2">
                            <button
                              onClick={() => handleCompleteTask(task)}
                              disabled={updating === task.id}
                              className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {updating === task.id ? <Loader className="w-3 h-3 animate-spin" /> : 'Complete'}
                            </button>
                        <button
                              onClick={() => handleReviseTask(task)}
                              disabled={updating === task.id}
                              className="px-2 sm:px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors disabled:opacity-50"
                            >
                              Revise
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
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => navigate('/start-project')}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm sm:text-base"
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              Start FMS Project
            </button>
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors text-sm sm:text-base"
            >
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              Assign Task
            </button>
            <button
              onClick={() => {
                loadMyTasks(user!.username);
                loadTaskManagementData();
                loadFMSRevisions();
              }}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors text-sm sm:text-base"
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Refresh
                </button>
              </div>
                        </div>
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
    </div>
  );
}
