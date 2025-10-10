/**
 * File Helper Utilities
 * Convert files to base64 for Google Drive upload
 */

/**
 * Convert File to Base64 string (removes data URL prefix)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data URL prefix (data:image/png;base64,)
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Convert FileList to array of base64 data
 */
export const filesToBase64Array = async (files: FileList): Promise<Array<{
  data: string;
  name: string;
  mimeType: string;
}>> => {
  const filesData = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const base64 = await fileToBase64(file);
    
    filesData.push({
      data: base64,
      name: file.name,
      mimeType: file.type
    });
  }
  
  return filesData;
};

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate file size
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
};

/**
 * Validate file type
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  if (allowedTypes.length === 0 || allowedTypes.includes('*/*')) {
    return true;
  }
  
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const category = type.split('/')[0];
      return file.type.startsWith(category + '/');
    }
    return file.type === type;
  });
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Check if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Check if file is a document
 */
export const isDocumentFile = (file: File): boolean => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  return documentTypes.includes(file.type);
};

