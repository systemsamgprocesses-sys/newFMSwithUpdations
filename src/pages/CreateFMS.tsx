import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, GitBranch, CheckSquare, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { api } from '../services/api';
import { FMSStep, User, ChecklistItem } from '../types';
import mermaid from 'mermaid';
import DriveFileUpload, { DriveFileUploadHandle } from '../components/DriveFileUpload';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

export default function CreateFMS() {
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();
  const [fmsName, setFmsName] = useState('');
  const [steps, setSteps] = useState<FMSStep[]>([
    { 
      stepNo: 1, 
      what: '', 
      who: '', 
      how: '', 
      when: 0, 
      whenUnit: 'days', 
      whenDays: 0, 
      whenHours: 0,
      requiresChecklist: false,
      checklistItems: []
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showDiagram, setShowDiagram] = useState(false);
  const [diagramSvg, setDiagramSvg] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [fmsList, setFmsList] = useState<any[]>([]);
  const [pendingUploads, setPendingUploads] = useState<{[key: number]: boolean}>({});
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  // Refs for file upload components
  const fileUploadRefs = useRef<{ [key: number]: DriveFileUploadHandle | null }>({});

  useEffect(() => {
    if (showDiagram && steps.every(s => s.what)) {
      generateDiagram();
    }
    
    // Load users and FMS list for dropdowns
    loadUsers();
    loadFMSList();
  }, [showDiagram, steps]);
  
  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      if (response.success) {
        setUsers(response.users || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadFMSList = async () => {
    try {
      const response = await api.getAllFMS();
      if (response.success) {
        setFmsList(response.fmsList || []);
      }
    } catch (err) {
      console.error('Error loading FMS list:', err);
    }
  };

  const generateDiagram = async () => {
    const mermaidCode = `
graph LR
    Start([Start])
    ${steps.map((step, idx) => `
    Step${idx + 1}["Step ${step.stepNo}<br/>WHAT: ${step.what}<br/>WHO: ${step.who}<br/>HOW: ${step.how}<br/>WHEN: ${step.whenUnit === 'days' ? `${step.whenDays} days` : step.whenUnit === 'hours' ? `${step.whenHours} hours` : `${step.whenDays}d ${step.whenHours}h`}"]
    `).join('\n')}
    End([End])

    Start --> Step1
    ${steps.map((_, idx) =>
      idx < steps.length - 1 ? `Step${idx + 1} --> Step${idx + 2}` : `Step${idx + 1} --> End`
    ).join('\n')}

    style Start fill:#10b981,stroke:#059669,color:#fff
    style End fill:#ef4444,stroke:#dc2626,color:#fff
    ${steps.map((_, idx) => `style Step${idx + 1} fill:#3b82f6,stroke:#2563eb,color:#fff`).join('\n')}
    `;

    try {
      const { svg } = await mermaid.render('fms-diagram', mermaidCode);
      setDiagramSvg(svg);
    } catch (err) {
      console.error('Mermaid rendering error:', err);
    }
  };

  const addStep = (afterIndex?: number) => {
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : steps.length;
    const newSteps = [...steps];
    
    // Insert new step at the specified position
    newSteps.splice(insertIndex, 0, {
      stepNo: insertIndex + 1,
      what: '',
      who: '',
      how: '',
      when: 0,
      whenUnit: 'days',
      whenDays: 0,
      whenHours: 0,
      requiresChecklist: false,
      checklistItems: []
    });
    
    // Update step numbers for all steps
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      stepNo: index + 1
    }));
    
    setSteps(updatedSteps);
  };

  const addChecklistItem = (stepIndex: number) => {
    const newSteps = [...steps];
    const checklistItems = newSteps[stepIndex].checklistItems || [];
    checklistItems.push({
      id: `checklist-${Date.now()}`,
      text: '',
      completed: false
    });
    newSteps[stepIndex].checklistItems = checklistItems;
    setSteps(newSteps);
  };

  const removeChecklistItem = (stepIndex: number, itemId: string) => {
    const newSteps = [...steps];
    newSteps[stepIndex].checklistItems = (newSteps[stepIndex].checklistItems || []).filter(
      item => item.id !== itemId
    );
    setSteps(newSteps);
  };

  const updateChecklistItem = (stepIndex: number, itemId: string, text: string) => {
    const newSteps = [...steps];
    const item = (newSteps[stepIndex].checklistItems || []).find(i => i.id === itemId);
    if (item) {
      item.text = text;
      setSteps(newSteps);
    }
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      // Update step numbers for all remaining steps
      const updatedSteps = newSteps.map((step, idx) => ({
        ...step,
        stepNo: idx + 1
      }));
      setSteps(updatedSteps);
    }
  };

  const updateStep = (index: number, field: keyof FMSStep, value: string | number | boolean | ChecklistItem[]) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };

    if (field === 'whenUnit' || field === 'whenDays' || field === 'whenHours') {
      const step = newSteps[index];
      if (step.whenUnit === 'days') {
        step.when = step.whenDays || 0;
      } else if (step.whenUnit === 'hours') {
        step.when = (step.whenHours || 0) / 24;
      } else if (step.whenUnit === 'days+hours') {
        step.when = (step.whenDays || 0) + ((step.whenHours || 0) / 24);
      }
    }

    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fmsName.trim()) {
      showError('Please enter FMS name');
      return;
    }

    const hasEmptyFields = steps.some(
      step => !step.what.trim() || !step.who.trim() || !step.how.trim()
    );

    if (hasEmptyFields) {
      showError('Please fill in all step fields');
      return;
    }

    // Validate checklist items
    const hasEmptyChecklists = steps.some(
      step => step.requiresChecklist && 
      (!step.checklistItems || step.checklistItems.length === 0 || 
       step.checklistItems.some(item => !item.text.trim()))
    );

    if (hasEmptyChecklists) {
      showError('Please add at least one checklist item for steps that require checklists');
      return;
    }

    setLoading(true);

    try {
      // Check if any step has pending file uploads and upload them automatically
      const hasPendingUploads = Object.values(pendingUploads).some(pending => pending === true);
      
      if (hasPendingUploads) {
        setLoadingMessage('Uploading files to Google Drive...');
        setUploadProgress('📤 Uploading files to Google Drive...');
        
        // Upload all pending files
        for (let i = 0; i < steps.length; i++) {
          const uploadRef = fileUploadRefs.current[i];
          if (uploadRef && uploadRef.hasPendingFiles()) {
            setLoadingMessage(`Uploading files for Step ${i + 1}...`);
            setUploadProgress(`📤 Uploading files for Step ${i + 1}...`);
            
            try {
              const success = await uploadRef.uploadPendingFiles();
              
              if (!success) {
                throw new Error(`Upload failed for Step ${i + 1}. Please try again.`);
              }
            } catch (uploadError: any) {
              throw new Error(`Failed to upload files for Step ${i + 1}: ${uploadError.message}`);
            }
          }
        }
        
        setLoadingMessage('All files uploaded! Creating FMS...');
        setUploadProgress('✅ All files uploaded! Saving FMS...');
        // Small delay to show success message
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        setLoadingMessage('Creating FMS template...');
      }

      // Save the FMS
      const result = await api.createFMS(fmsName, steps, user!.username);

      if (result.success) {
        setUploadProgress('');
        showSuccess('FMS template created successfully!');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        showError(result.message || 'Failed to create FMS');
      }
    } catch (err: any) {
      showError(err.message || 'Connection error. Please try again.');
      setUploadProgress('');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto p-4 sm:p-6"
    >
      <div className="card-premium p-4 sm:p-6 mb-4 sm:mb-6">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"
        >
          <div className="p-2 bg-gradient-to-br from-accent-500 to-brand-500 rounded-xl">
            <GitBranch className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          Create FMS Template
        </motion.h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              FMS Name
            </label>
            <input
              type="text"
              value={fmsName}
              onChange={(e) => setFmsName(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none text-sm sm:text-base"
              placeholder="Enter FMS template name"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Steps</h2>
            </div>

            {steps.map((step, index) => (
              <div key={index}>
                <div className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Step {step.stepNo}</h3>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WHAT (Task Description)
                    </label>
                    <input
                      type="text"
                      value={step.what}
                      onChange={(e) => updateStep(index, 'what', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                      placeholder="What needs to be done?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WHO (Responsible Person)
                    </label>
                    <select
                      value={step.who}
                      onChange={(e) => updateStep(index, 'who', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                      required
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.username} value={user.username}>
                          {user.name} ({user.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      HOW (Method/Process)
                    </label>
                    <input
                      type="text"
                      value={step.how}
                      onChange={(e) => updateStep(index, 'how', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                      placeholder="How will it be done?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WHEN (Duration)
                    </label>
                    <select
                      value={step.whenUnit}
                      onChange={(e) => updateStep(index, 'whenUnit', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                      required
                    >
                      <option value="days">Days</option>
                      <option value="hours">Hours</option>
                      <option value="days+hours">Days + Hours</option>
                    </select>

                    {step.whenUnit === 'days' && (
                      <input
                        type="number"
                        min="0"
                        value={step.whenDays || 0}
                        onChange={(e) => updateStep(index, 'whenDays', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                        placeholder="Number of days"
                        required
                      />
                    )}

                    {step.whenUnit === 'hours' && (
                      <input
                        type="number"
                        min="0"
                        value={step.whenHours || 0}
                        onChange={(e) => updateStep(index, 'whenHours', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                        placeholder="Number of hours"
                        required
                      />
                    )}

                    {step.whenUnit === 'days+hours' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="0"
                          value={step.whenDays || 0}
                          onChange={(e) => updateStep(index, 'whenDays', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                          placeholder="Days"
                          required
                        />
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={step.whenHours || 0}
                          onChange={(e) => updateStep(index, 'whenHours', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                          placeholder="Hours"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachment Option - REAL FILE UPLOAD */}
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <label className="block text-sm font-medium text-green-900 mb-2">
                    📎 Upload Attachments to Google Drive
                  </label>
                  <DriveFileUpload
                    ref={(ref) => {
                      fileUploadRefs.current[index] = ref;
                    }}
                    stepIndex={index}
                    fmsName={fmsName}
                    username={user!.username}
                    onFilesUploaded={(files) => {
                      const newSteps = [...steps];
                      newSteps[index].attachments = files;
                      setSteps(newSteps);
                    }}
                    currentFiles={step.attachments || []}
                    maxFiles={3}
                    maxSizeMB={2}
                    onPendingFilesChange={(hasPending) => {
                      setPendingUploads(prev => ({
                        ...prev,
                        [index]: hasPending
                      }));
                    }}
                  />
                </div>

                {/* Checklist Option */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={step.requiresChecklist || false}
                      onChange={(e) => updateStep(index, 'requiresChecklist', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      This step requires a checklist
                    </span>
                  </label>

                  {step.requiresChecklist && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-800">Checklist Items:</span>
                        <button
                          type="button"
                          onClick={() => addChecklistItem(index)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add Item
                        </button>
                      </div>

                      {(step.checklistItems || []).map((item, itemIndex) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <span className="text-xs text-blue-700">{itemIndex + 1}.</span>
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => updateChecklistItem(index, item.id, e.target.value)}
                            placeholder="Checklist item..."
                            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required={step.requiresChecklist}
                          />
                          <button
                            type="button"
                            onClick={() => removeChecklistItem(index, item.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {(!step.checklistItems || step.checklistItems.length === 0) && (
                        <p className="text-xs text-blue-600 italic">
                          Click "Add Item" to create checklist items
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* FMS Trigger Option */}
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <label className="block text-sm font-medium text-purple-900 mb-2">
                    🚀 Trigger Another FMS When This Step Completes
                  </label>
                  <select
                    value={step.triggersFMSId || ''}
                    onChange={(e) => updateStep(index, 'triggersFMSId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">None - Don't trigger any FMS</option>
                    {fmsList.map((fms) => (
                      <option key={fms.fmsId} value={fms.fmsId}>
                        {fms.fmsName} ({fms.stepCount} steps)
                      </option>
                    ))}
                  </select>
                  {step.triggersFMSId && (
                    <p className="text-xs text-purple-700 mt-2">
                      ✨ When this step is marked as "Done", a new project will automatically be created from the selected FMS template.
                    </p>
                  )}
                </div>
                </div>
                
                {/* Add Step button after each step */}
                <div className="flex justify-center mt-3">
                  <button
                    type="button"
                    onClick={() => addStep(index)}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Step After This
                  </button>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {uploadProgress && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200 text-blue-800 px-3 sm:px-4 py-3 rounded-xl text-sm sm:text-base flex items-center gap-3 shadow-lg"
              >
                <Loader className="w-5 h-5 animate-spin" />
                <span className="font-medium">{uploadProgress}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setShowDiagram(!showDiagram)}
              disabled={!steps.every(s => s.what)}
              className="btn-premium flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg"
            >
              <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
              {showDiagram ? 'Hide' : 'Show'} Flowchart
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-premium flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-accent-600 to-brand-600 text-white rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  {loadingMessage || 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  Save FMS Template
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>

      {showDiagram && diagramSvg && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Flow Diagram</h2>
          <div
            className="flex justify-center overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: diagramSvg }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
