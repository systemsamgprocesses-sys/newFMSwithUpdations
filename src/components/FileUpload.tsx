import { useState, useRef } from 'react';
import { Upload, X, File, Loader, AlertCircle } from 'lucide-react';
import { formatFileSize } from '../utils/fileHelpers';

interface FileUploadProps {
  onFilesSelected: (files: FileList) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  label?: string;
}

export default function FileUpload({ 
  onFilesSelected, 
  maxFiles = 5, 
  maxSizeMB = 2,
  accept = "*/*",
  label = "Upload Files"
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');

    // Validate file count
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    const maxBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = Array.from(files).filter(file => file.size > maxBytes);
    
    if (oversizedFiles.length > 0) {
      setError(`Files must be smaller than ${maxSizeMB}MB`);
      return;
    }

    setSelectedFiles(Array.from(files));
    onFilesSelected(files);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    // Create a new FileList-like object
    const dt = new DataTransfer();
    newFiles.forEach(file => dt.items.add(file));
    
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
    }
    
    onFilesSelected(dt.files);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label} (Max {maxFiles} files, {maxSizeMB}MB each)
        </label>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="text-sm text-slate-600 mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-slate-500">
          {accept === "*/*" ? "Any file type" : accept}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">
            Selected Files ({selectedFiles.length}):
          </p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="text-red-600 hover:text-red-700 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

