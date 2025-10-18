import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Upload, X, File, Loader, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { fileToBase64, formatFileSize } from '../utils/fileHelpers';
import { Attachment } from '../types';

interface DriveFileUploadProps {
  stepIndex?: number;
  fmsName: string;
  username: string;
  onFilesUploaded: (files: Attachment[]) => void;
  currentFiles?: Attachment[];
  maxFiles?: number;
  maxSizeMB?: number;
  onPendingFilesChange?: (hasPending: boolean) => void;
}

export interface DriveFileUploadHandle {
  uploadPendingFiles: () => Promise<boolean>;
  hasPendingFiles: () => boolean;
}

const DriveFileUpload = forwardRef<DriveFileUploadHandle, DriveFileUploadProps>(
  (props, ref) => {
  const {
    stepIndex = 0,
    fmsName,
    username,
    onFilesUploaded,
    currentFiles = [],
    maxFiles = 5,
    maxSizeMB = 2,
    onPendingFilesChange
  } = props;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    uploadPendingFiles: async () => {
      if (selectedFiles.length === 0) return true;
      const success = await uploadFiles();
      return success; // Returns true if upload successful
    },
    hasPendingFiles: () => selectedFiles.length > 0
  }));

  // Notify parent component about pending files
  useEffect(() => {
    if (onPendingFilesChange) {
      onPendingFilesChange(selectedFiles.length > 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');

    // Check max files (including already uploaded)
    if (files.length + currentFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files total. You already have ${currentFiles.length} uploaded.`);
      return;
    }

    // Check file sizes
    const maxBytes = maxSizeMB * 1024 * 1024;
    const oversized = Array.from(files).find(f => f.size > maxBytes);
    
    if (oversized) {
      setError(`File "${oversized.name}" is too large. Max ${maxSizeMB}MB per file.`);
      return;
    }

    setSelectedFiles(Array.from(files));
  };

  const uploadFiles = async (): Promise<boolean> => {
    if (selectedFiles.length === 0) return true;

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      // Convert files to base64
      const filesData = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProgress(Math.round(((i) / selectedFiles.length) * 40)); // 0-40% for conversion
        
        const base64Data = await fileToBase64(file);
        
        filesData.push({
          data: base64Data,
          name: file.name,
          mimeType: file.type
        });
      }
      
      setProgress(50); // Conversion done
      
      // Upload to Google Drive
      const context = fmsName ? `FMS-${fmsName}-Step${stepIndex + 1}` : 'General';
      
      setProgress(50); // Start upload
      const result = await api.uploadMultipleFiles(filesData, context, username);
      
      setProgress(90);
      
      if (result.success) {
        setProgress(100);
        
        // Check if files were uploaded
        if (result.files && result.files.length > 0) {
          // Combine with existing files
          const allFiles = [...currentFiles, ...result.files];
          onFilesUploaded(allFiles);
        }
        
        // Clear selection (upload was successful even if some files failed)
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Show errors if any files failed
        if (result.errors && result.errors.length > 0) {
          setError('Some files had issues: ' + result.errors.join(', '));
          setTimeout(() => setError(''), 5000);
        }
        
        setTimeout(() => setProgress(0), 2000);
        return true; // Upload successful (even if some files had issues)
      } else {
        setError(result.message || 'Upload failed');
        setProgress(0);
        return false; // Upload failed completely
      }
      
    } catch (err: any) {
      setError(err.message || 'Upload failed. Check your internet connection.');
      setProgress(0);
      return false; // Upload failed
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (fileId: string) => {
    const updatedFiles = currentFiles.filter(f => f.id !== fileId);
    onFilesUploaded(updatedFiles);
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 hover:bg-green-100 transition-all"
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-green-500" />
        <p className="text-sm text-green-900 font-medium mb-1">
          Click to upload files to Google Drive
        </p>
        <p className="text-xs text-green-700">
          Max {maxFiles} files • {maxSizeMB}MB each • Auto-uploaded to Drive
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Files (Ready to Upload) */}
      {selectedFiles.length > 0 && !uploading && (
        <div className="space-y-2">
          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">📁 Files ready to upload</p>
              <p className="text-xs text-blue-700 mt-1">These files will be automatically uploaded when you save the FMS.</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-800">
              Selected ({selectedFiles.length}):
            </p>
          </div>
          
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-white border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeSelectedFile(idx)}
                className="text-red-600 hover:text-red-700 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin text-green-600" />
              <span className="text-green-900 font-medium">Uploading to Google Drive...</span>
            </div>
            <span className="text-green-600 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-600 to-green-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-green-700">
            {progress < 40 ? 'Converting files...' : 
             progress < 90 ? 'Uploading to Drive...' : 
             'Finalizing...'}
          </p>
        </div>
      )}

      {/* Uploaded Files (Already in Drive) */}
      {currentFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Uploaded to Drive ({currentFiles.length}):
              </p>
            </div>
          </div>
          
          {currentFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-green-300 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">{file.name}</p>
                  {file.uploadedOn && (
                    <p className="text-xs text-green-700">
                      Uploaded {new Date(file.uploadedOn).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  View
                </a>
                <button
                  onClick={() => removeUploadedFile(file.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      {currentFiles.length === 0 && selectedFiles.length === 0 && (
        <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
          💡 <strong>How it works:</strong> 
          <ol className="list-decimal ml-4 mt-1 space-y-1">
            <li>Click above to select files (max {maxSizeMB}MB each)</li>
            <li>Files will be automatically uploaded when you save</li>
            <li>Wait for upload to complete before the FMS is saved</li>
            <li>⚠️ Large files may take longer to upload</li>
          </ol>
        </div>
      )}
    </div>
  );
});

DriveFileUpload.displayName = 'DriveFileUpload';

export default DriveFileUpload;
