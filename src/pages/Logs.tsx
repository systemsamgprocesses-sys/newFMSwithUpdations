import { useState, useEffect } from 'react';
import { FileText, GitBranch, PlayCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Log } from '../types';
import { SkeletonList } from '../components/SkeletonLoader';

export default function Logs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.username) {
      loadLogs();
    }
  }, [user?.username]);

  const loadLogs = async () => {
    if (!user?.username) return;
    
    setLoading(true);
    try {
      const result = await api.getAllLogs();
      if (result.success) {
        // Filter logs based on user role and permissions
        let filteredLogs = result.logs || [];
        
        // Super Admin and Admin see all logs
        if (user.role?.toLowerCase() === 'superadmin' || user.role?.toLowerCase() === 'super admin' || user.role?.toLowerCase() === 'admin') {
          // Keep all logs for admins
        } else {
          // Regular users see only logs related to their activities
          filteredLogs = filteredLogs.filter((log: Log) => {
            // Show logs where user is mentioned or involved
            return log.userId === user.username || 
                   log.username === user.username ||
                   log.message?.toLowerCase().includes(user.username.toLowerCase()) ||
                   log.message?.toLowerCase().includes(user.name?.toLowerCase() || '');
          });
        }
        
        setLogs(filteredLogs);
      } else {
        setError('Failed to load logs');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'FMS_CREATED':
        return <GitBranch className="w-5 h-5 text-blue-600" />;
      case 'PROJECT_CREATED':
        return <PlayCircle className="w-5 h-5 text-green-600" />;
      case 'TASK_UPDATED':
        return <CheckCircle className="w-5 h-5 text-slate-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'FMS_CREATED':
        return 'bg-blue-50 border-blue-200';
      case 'PROJECT_CREATED':
        return 'bg-green-50 border-green-200';
      case 'TASK_UPDATED':
        return 'bg-slate-50 border-slate-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getLogTitle = (log: Log) => {
    switch (log.type) {
      case 'FMS_CREATED':
        return `FMS Template Created: ${log.fmsName}`;
      case 'PROJECT_CREATED':
        return `Project Started: ${log.projectName}`;
      case 'TASK_UPDATED':
        return `Task Updated: ${log.projectName} - Step ${log.stepNo}`;
      default:
        return 'Unknown Action';
    }
  };

  const getLogDescription = (log: Log) => {
    switch (log.type) {
      case 'FMS_CREATED':
        return `Created by ${log.createdBy}`;
      case 'PROJECT_CREATED':
        return `Started by ${log.createdBy}`;
      case 'TASK_UPDATED':
        return `${log.what} - Status: ${log.status} - Updated by ${log.updatedBy}`;
      default:
        return '';
    }
  };

  const getLogDate = (log: Log) => {
    return formatDate(log.createdOn || log.updatedOn || '');
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6"
      >
        <div className="card-premium p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-accent-500 to-brand-500 rounded-xl">
              <div className="w-5 h-5 bg-white/20 rounded"></div>
            </div>
            <div className="skeleton h-8 w-48 rounded-lg" />
          </div>
          <div className="space-y-3 sm:space-y-4">
            {[...Array(8)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-2 rounded-xl p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200"
              >
                <div className="flex items-start gap-2 sm:gap-4">
                  <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                    <div className="skeleton w-5 h-5 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="skeleton h-4 w-3/4 rounded-lg" />
                    <div className="skeleton h-3 w-full rounded-lg" />
                    <div className="skeleton h-3 w-1/2 rounded-lg" />
                  </div>
                  <div className="skeleton h-3 w-16 rounded-lg hidden sm:block" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6"
    >
      <div className="card-premium p-4 sm:p-6">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"
        >
          <div className="p-2 bg-gradient-to-br from-accent-500 to-brand-500 rounded-xl">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          Activity Logs
        </motion.h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {logs.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-sm sm:text-base">No activity logs yet</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {logs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border-2 rounded-xl p-3 sm:p-4 ${getLogColor(log.type)} hover:shadow-lg transition-all`}
              >
                <div className="flex items-start gap-2 sm:gap-4">
                  <div className="mt-0.5 sm:mt-1 flex-shrink-0">{getLogIcon(log.type)}</div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base break-words">
                      {getLogTitle(log)}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2 break-words">
                      {getLogDescription(log)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getLogDate(log)}
                    </p>
                  </div>

                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:block whitespace-nowrap">
                    {log.type.replace('_', ' ')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
