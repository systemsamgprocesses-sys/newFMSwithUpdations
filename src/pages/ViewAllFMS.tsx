import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Loader, Eye, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { api } from '../services/api';
import { FMSTemplate } from '../types';

export default function ViewAllFMS() {
  const { user } = useAuth();
  const { fmsList, fmsDetails, loadFMSList, loadFMSDetails, loading, error } = useData();
  const navigate = useNavigate();
  const [expandedFMS, setExpandedFMS] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role && user.department) {
      console.log('Loading FMS for user:', user);
      loadFMSList(user.username, user.role, user.department);
    } else if (user && !user.role) {
      console.log('User logged in but role not loaded yet:', user);
    }
  }, [loadFMSList, user]);

  // FMS list is now filtered at API level based on user login
  // No need for client-side filtering anymore

  const handleFMSDetails = async (fmsId: string) => {
    if (fmsDetails[fmsId]) {
      setExpandedFMS(expandedFMS === fmsId ? null : fmsId);
      return;
    }

    await loadFMSDetails(fmsId);
    setExpandedFMS(expandedFMS === fmsId ? null : fmsId);
  };

  const formatDuration = (step: any) => {
    if (step.whenUnit === 'days') {
      return `${step.whenDays || step.when} days`;
    } else if (step.whenUnit === 'hours') {
      return `${step.whenHours || Math.round(step.when * 24)} hours`;
    } else if (step.whenUnit === 'days+hours') {
      return `${step.whenDays || Math.floor(step.when)}d ${step.whenHours || Math.round((step.when % 1) * 24)}h`;
    }
    return `${step.when} days`;
  };

  const calculateTotalTime = (steps: any[]) => {
    let totalDays = 0;
    let totalHours = 0;

    steps.forEach(step => {
      const days = step.whenDays || Math.floor(step.when || 0);
      const hours = step.whenHours || Math.round(((step.when || 0) % 1) * 24);
      totalDays += days;
      totalHours += hours;
    });

    // Convert excess hours to days
    if (totalHours >= 24) {
      totalDays += Math.floor(totalHours / 24);
      totalHours = totalHours % 24;
    }

    if (totalDays > 0 && totalHours > 0) {
      return `${totalDays} days ${totalHours} hours`;
    } else if (totalDays > 0) {
      return `${totalDays} days`;
    } else if (totalHours > 0) {
      return `${totalHours} hours`;
    }
    return '0 days';
  };

  if (loading.fmsList) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6"
      >
        <div className="card-premium p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="skeleton h-8 w-64 rounded-lg" />
            <div className="skeleton h-10 w-32 rounded-lg" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4">
                <div className="skeleton h-6 w-3/4 mb-3" />
                <div className="skeleton h-4 w-1/2 mb-2" />
                <div className="flex gap-4">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 sm:gap-3">
            <GitBranch className="w-6 h-6 sm:w-8 sm:h-8" />
            All FMS Templates
          </h1>
          <button
            onClick={() => navigate('/create-fms')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {fmsList.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No FMS templates available</p>
            <button
              onClick={() => navigate('/create-fms')}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Create First FMS Template
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {fmsList.map((fms) => (
              <div
                key={fms.fmsId}
                className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className="p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleFMSDetails(fms.fmsId)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {fms.fmsName}
                      </h3>
                      {fms.totalTimeFormatted && (
                        <div className="mb-2 inline-block px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-medium">
                          ⏱️ Total Time: {fms.totalTimeFormatted}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <span>Steps: {fms.stepCount}</span>
                        <span>Created by: {fms.createdBy}</span>
                        <span>
                          Created on:{' '}
                          {new Date(fms.createdOn).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <button className="text-slate-600 hover:text-slate-900 transition-colors">
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {expandedFMS === fms.fmsId && (
                  <div className="p-4 bg-white border-t border-slate-200">
                    {fmsDetails[fms.fmsId] && fmsDetails[fms.fmsId].steps ? (
                      <>
                        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-slate-600">Total Duration</span>
                              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                {calculateTotalTime(fmsDetails[fms.fmsId].steps)}
                              </p>
                            </div>
                            <div className="text-4xl">⏱️</div>
                          </div>
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-3">Steps:</h4>
                        <div className="space-y-3">
                          {fmsDetails[fms.fmsId].steps.map((step: any) => (
                        <div
                          key={step.stepNo}
                          className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                              {step.stepNo}
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-semibold text-slate-700">What:</span>{' '}
                                <span className="text-slate-900">{step.what}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">Who:</span>{' '}
                                <span className="text-slate-900">{step.who}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">How:</span>{' '}
                                <span className="text-slate-900">{step.how}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">When:</span>{' '}
                                <span className="text-slate-900">{formatDuration(step)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="w-6 h-6 animate-spin text-slate-600 mr-2" />
                        <span className="text-slate-600">Loading FMS details...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
