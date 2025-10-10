import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Loader, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, XCircle, Calendar, Paperclip, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Project, ProjectTask } from '../types';

export default function ViewFMSProgress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjects();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await api.getUsers();
      if (result.success) {
        setAllUsers(result.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const result = await api.getAllProjects();
      if (result.success) {
        setProjects(result.projects || []);
      } else {
        setError(result.message || 'Failed to load projects');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Role-based filtering based on FMS assignment (Column E = WHO)
  const getFilteredProjects = () => {
    if (!user || !projects.length) return projects;

    const userRole = user.role?.toLowerCase();
    
    // Super Admin sees everything
    if (userRole === 'superadmin' || userRole === 'super admin') {
      return projects;
    }
    
    // Admin sees projects where tasks are assigned to users in their department
    if (userRole === 'admin') {
      return projects.filter(project => {
        // Check if any task in this project is assigned to someone in admin's department
        return project.tasks.some(task => {
          const assignedUser = allUsers.find(u => u.username === task.who);
          return assignedUser?.department === user.department || task.who === user.username;
        });
      });
    }
    
    // Regular users see only projects with tasks assigned to them (based on FMS WHO column)
    return projects.filter(project => 
      project.tasks.some(task => task.who === user.username)
    );
  };

  const filteredProjects = getFilteredProjects();

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getTaskStatus = (task: ProjectTask): { label: string; color: string; icon: JSX.Element } => {
    const now = new Date();
    const dueDate = new Date(task.plannedDueDate);
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (task.status === 'Done') {
      const completedDate = new Date(task.actualCompletedOn);
      completedDate.setHours(0, 0, 0, 0);
      
      if (completedDate <= dueDate) {
        return { 
          label: 'Completed On Time', 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-4 h-4" />
        };
      } else {
        return { 
          label: 'Completed Late', 
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <CheckCircle className="w-4 h-4" />
        };
      }
    }

    if (task.status === 'In Progress') {
      if (dueDate < now) {
        return { 
          label: 'Overdue', 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="w-4 h-4" />
        };
      } else {
        return { 
          label: 'In Progress', 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Clock className="w-4 h-4" />
        };
      }
    }

    if (task.status === 'Pending') {
      if (dueDate < now) {
        return { 
          label: 'Late', 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="w-4 h-4" />
        };
      } else if (dueDate.getTime() === now.getTime()) {
        return { 
          label: 'Due Today', 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4" />
        };
      } else {
        return { 
          label: 'Pending', 
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: <Clock className="w-4 h-4" />
        };
      }
    }

    return { 
      label: 'Not Started', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <XCircle className="w-4 h-4" />
    };
  };

  const getProjectProgress = (project: Project) => {
    // Use total steps from template (FMS_MASTER), not progress sheet
    const total = project.totalStepsInTemplate || project.tasks.length;
    const completed = project.tasks.filter(t => t.status === 'Done').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Target className="w-8 h-8" />
            FMS Project Progress
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No FMS projects available</p>
            <button
              onClick={() => navigate('/start-project')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              Start First Project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const progress = getProjectProgress(project);
              const isExpanded = expandedProjects.has(project.projectId);

              return (
                <div
                  key={project.projectId}
                  className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    className="p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleProject(project.projectId)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {project.projectName}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                          <span>FMS ID: {project.fmsId}</span>
                          <span>Project ID: {project.projectId}</span>
                          <span>Total Steps in Template: {project.totalStepsInTemplate || project.tasks.length}</span>
                          <span className="text-blue-600 font-medium">Current Active: {project.tasks.length}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {progress.completed}/{progress.total} ({progress.percentage}%)
                          </span>
                        </div>
                      </div>
                      <button className="text-slate-600 hover:text-slate-900 transition-colors ml-4">
                        {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-4">Task Status Timeline</h4>
                      <div className="space-y-3">
                        {project.tasks
                          .sort((a, b) => a.stepNo - b.stepNo)
                          .map((task, index) => {
                            const status = getTaskStatus(task);
                            return (
                              <div
                                key={`${task.stepNo}-${index}`}
                                className="relative border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                      task.status === 'Done' ? 'bg-green-600' : 
                                      task.status === 'In Progress' ? 'bg-blue-600' : 
                                      'bg-slate-400'
                                    }`}>
                                      {task.stepNo}
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-semibold text-slate-900">{task.what}</h5>
                                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${status.color} whitespace-nowrap`}>
                                        {status.icon}
                                        {status.label}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="text-slate-600">Assigned to:</span>
                                        <span className="ml-2 font-medium text-slate-900">{task.who}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-600">How:</span>
                                        <span className="ml-2 text-slate-800">{task.how}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        <span className="text-slate-600">Due:</span>
                                        <span className="font-medium text-slate-900">{formatDate(task.plannedDueDate)}</span>
                                      </div>
                                      {task.actualCompletedOn && (
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                          <span className="text-slate-600">Completed:</span>
                                          <span className="font-medium text-green-700">{formatDate(task.actualCompletedOn)}</span>
                                        </div>
                                      )}
                                      {task.completedBy && (
                                        <div>
                                          <span className="text-slate-600">Completed by:</span>
                                          <span className="ml-2 font-medium text-slate-900">{task.completedBy}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Show attachments if any */}
                                    {task.attachments && task.attachments.length > 0 && (
                                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                                          <Paperclip className="w-4 h-4" />
                                          Attachments ({task.attachments.length}):
                                        </p>
                                        <div className="space-y-1">
                                          {task.attachments.map((att: any, idx: number) => (
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
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

