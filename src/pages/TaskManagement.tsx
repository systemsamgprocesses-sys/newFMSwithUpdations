import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ListTodo, 
  Plus, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Edit, 
  TrendingUp, 
  Loader,
  AlertCircle,
  Send,
  X,
  BarChart3,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TaskData, TaskSummary, TaskUser, ScoringData } from '../types';
import DriveFileUpload from '../components/DriveFileUpload';

type TabType = 'overview' | 'upcoming' | 'pending' | 'all' | 'revisions' | 'assign' | 'scoring';

export default function TaskManagement() {
  const { user } = useAuth();
  const location = useLocation();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Scoring permissions
  const [selectedScoringUser, setSelectedScoringUser] = useState(user?.username || '');
  const [availableUsers, setAvailableUsers] = useState<TaskUser[]>([]);
  
  // Task data
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [summary, setSummary] = useState<TaskSummary>({
    upcoming: 0,
    pending: 0,
    completed: 0,
    revisions: 0,
    overdue: 0,
    total: 0
  });
  
  // Users for assignment
  const [taskUsers, setTaskUsers] = useState<TaskUser[]>([]);
  
  // Assign task form
  const [assignForm, setAssignForm] = useState({
    assignedTo: '',
    description: '',
    plannedDate: '',
    tutorialLinks: '',
    department: '',
    attachments: [] as any[]
  });
  const [hasPendingUploads, setHasPendingUploads] = useState(false);
  
  // Scoring data
  const [scoringData, setScoringData] = useState<ScoringData | null>(null);
  const [scoringDates, setScoringDates] = useState({
    startDate: '',
    endDate: ''
  });
  const [loadingScoring, setLoadingScoring] = useState(false);
  
  // Task update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [updateAction, setUpdateAction] = useState<'complete' | 'revise'>('complete');
  const [revisionData, setRevisionData] = useState({
    newDate: '',
    reason: ''
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Handle URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'upcoming', 'pending', 'all', 'revisions', 'assign', 'scoring'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [location.search]);

  // Load data on mount
  useEffect(() => {
    if (user?.username) {
      loadSummary();
      loadTasks('all');
      loadTaskUsers();
      loadAvailableUsersForScoring();
      setDefaultScoringDates();
      setSelectedScoringUser(user.username);
    }
  }, [user?.username]);

  const loadAvailableUsersForScoring = async () => {
    try {
      const result = await api.getTaskUsers();
      if (result.success) {
        setAvailableUsers(result.users || []);
      }
    } catch (err) {
      console.error('Error loading users for scoring:', err);
    }
  };

  // Role-based user filtering for scoring
  const getScoringUsers = () => {
    if (!user) return [];
    
    const userRole = user.role?.toLowerCase();
    
    // Super Admin can see everyone
    if (userRole === 'superadmin' || userRole === 'super admin') {
      return availableUsers;
    }
    
    // Admin can see users in their department
    if (userRole === 'admin') {
      return availableUsers.filter(u => u.department === user.department);
    }
    
    // Regular users can only see themselves
    return availableUsers.filter(u => u.userId === user.username);
  };

  // Reload tasks when tab changes
  useEffect(() => {
    if (user?.username && ['upcoming', 'pending', 'all', 'revisions'].includes(activeTab)) {
      const filter = activeTab === 'upcoming' ? 'pending' : activeTab;
      loadTasks(filter);
    }
  }, [activeTab, user?.username]);

  const loadSummary = async () => {
    try {
      const result = await api.getTaskSummary(user!.username);
      if (result.success) {
        setSummary(result.summary);
      }
    } catch (err: any) {
      console.error('Error loading summary:', err);
    }
  };

  const loadTasks = async (filter: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getTasks(user!.username, filter);
      if (result.success) {
        setTasks(result.tasks || []);
      } else {
        setError(result.message || 'Failed to load tasks');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadTaskUsers = async () => {
    try {
      const result = await api.getTaskUsers();
      if (result.success) {
        setTaskUsers(result.users || []);
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for pending uploads
    if (hasPendingUploads) {
      setError('⚠️ Files are selected but not uploaded! Click "Upload to Drive Now!" button first.');
      return;
    }
    
    setLoading(true);
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
        loadSummary();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to assign task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await api.updateTask(
        selectedTask['Task Id'],
        updateAction,
        updateAction === 'revise' ? revisionData : {}
      );
      
      if (result.success) {
        setSuccess('Task updated successfully!');
        setShowUpdateModal(false);
        setSelectedTask(null);
        loadSummary();
        loadTasks(activeTab === 'overview' ? 'all' : activeTab);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to update task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (task: TaskData, action: 'complete' | 'revise') => {
    setSelectedTask(task);
    setUpdateAction(action);
    setRevisionData({ newDate: '', reason: '' });
    setShowUpdateModal(true);
  };

  const loadScoringData = async () => {
    if (!scoringDates.startDate || !scoringDates.endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    setLoadingScoring(true);
    setError('');
    
    try {
      // Use selectedScoringUser instead of user!.username for role-based access
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const isTaskOverdue = (task: TaskData) => {
    if (task['Task Status'].toLowerCase() === 'completed') return false;
    const dueDate = new Date(task['PLANNED DATE']);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < now;
  };

  const isTaskUpcoming = (task: TaskData) => {
    if (task['Task Status'].toLowerCase() === 'completed') return false;
    const dueDate = new Date(task['PLANNED DATE']);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate > now;
  };

  const getStatusBadge = (task: TaskData) => {
    const status = task['Task Status'].toLowerCase();
    
    if (isTaskOverdue(task) && status !== 'completed') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue</span>;
    }
    
    if (isTaskUpcoming(task)) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Upcoming</span>;
    }
    
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Due</span>;
      case 'revise':
      case 'revision':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Revision</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{task['Task Status']}</span>;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task['Task Id'].toLowerCase().includes(searchTerm.toLowerCase()) ||
      task['TASK DESCRIPTION'].toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === '' || 
      task['DEPARTMENT'] === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  const departments = Array.from(new Set(tasks.map(t => t['DEPARTMENT']).filter(Boolean)));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <ListTodo className="w-8 h-8" />
                Task Management
              </h1>
              <p className="text-slate-600 mt-1">Manage your tasks and track performance</p>
            </div>
          </div>
        </div>

        {/* Tabs with Counts */}
        <div className="border-b border-slate-200 overflow-x-auto bg-slate-50">
          <div className="flex gap-2 p-2 min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3, count: null },
              { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: summary.upcoming },
              { id: 'pending', label: 'Due Tasks', icon: Clock, count: summary.pending },
              { id: 'all', label: 'All Tasks', icon: ListTodo, count: summary.total },
              { id: 'revisions', label: 'Revisions', icon: Edit, count: summary.revisions },
              { id: 'assign', label: 'Assign Task', icon: Plus, count: null },
              { id: 'scoring', label: 'Performance', icon: TrendingUp, count: null }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {tab.count !== null && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.id
                        ? 'bg-white text-slate-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="m-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-blue-600 text-2xl mb-2">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{summary.upcoming}</div>
                  <div className="text-sm text-slate-600">Upcoming</div>
                </div>
                
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <div className="text-yellow-600 text-2xl mb-2">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{summary.pending}</div>
                  <div className="text-sm text-slate-600">Due Tasks</div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-green-600 text-2xl mb-2">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{summary.completed}</div>
                  <div className="text-sm text-slate-600">Completed</div>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="text-orange-600 text-2xl mb-2">
                    <Edit className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{summary.revisions}</div>
                  <div className="text-sm text-slate-600">Revisions</div>
                </div>
                
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="text-red-600 text-2xl mb-2">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{summary.overdue}</div>
                  <div className="text-sm text-slate-600">Overdue</div>
                </div>
              </div>
              
              <div className="text-center text-slate-600 py-8">
                <p>Select a tab above to view and manage your tasks</p>
              </div>
            </div>
          )}

          {/* Task List Tabs (Upcoming, Pending, All, Revisions) */}
          {['upcoming', 'pending', 'all', 'revisions'].includes(activeTab) && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {departments.length > 0 && (
                  <div className="sm:w-64">
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Task List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-slate-600" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <ListTodo className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Task ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Planned Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredTasks.map((task) => (
                        <tr key={task['Task Id']} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{task['Task Id']}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{task['TASK DESCRIPTION']}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{task['DEPARTMENT'] || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(task['PLANNED DATE'])}</td>
                          <td className="px-4 py-3 text-sm">{getStatusBadge(task)}</td>
                          <td className="px-4 py-3 text-sm">
                            {task['Task Status'].toLowerCase() !== 'completed' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openUpdateModal(task, 'complete')}
                                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => openUpdateModal(task, 'revise')}
                                  className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs"
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
          )}

          {/* Assign Task Tab */}
          {activeTab === 'assign' && (
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
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
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
          )}

          {/* Scoring Tab */}
          {activeTab === 'scoring' && (
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
                      className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div className="text-2xl font-bold text-slate-900">{scoringData.totalTasks}</div>
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
          )}
        </div>
      </div>

      {/* Update Task Modal */}
      {showUpdateModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {updateAction === 'complete' ? 'Complete Task' : 'Request Revision'}
              </h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Task ID:</strong> {selectedTask['Task Id']}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Description:</strong> {selectedTask['TASK DESCRIPTION']}
              </p>
            </div>

            {updateAction === 'revise' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Date (Optional)
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
                    Reason for Revision
                  </label>
                  <textarea
                    value={revisionData.reason}
                    onChange={(e) => setRevisionData({ ...revisionData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="Enter reason for revision..."
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTask}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                  updateAction === 'complete'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    {updateAction === 'complete' ? <CheckCircle className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {updateAction === 'complete' ? 'Complete' : 'Request Revision'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

