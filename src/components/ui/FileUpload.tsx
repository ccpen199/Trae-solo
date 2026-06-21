import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileImage, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  description?: string;
}

export default function FileUpload({
  onFileSelect,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024,
  label = '上传文件',
  description = '支持 JPG、PNG 格式，最大 10MB',
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    []
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    []
  );

  const handleFile = (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    if (file.size > maxSize) {
      setError(`文件大小不能超过 ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {!uploadedFile ? (
        <motion.label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            'flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
            isDragOver
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:border-primary-300 hover:bg-gray-100'
          )}
        >
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <motion.div
              animate={isDragOver ? { y: -5 } : { y: 0 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
              className="w-16 h-16 mb-4 rounded-full bg-primary-100 flex items-center justify-center"
            >
              <Upload className="w-8 h-8 text-primary-500" />
            </motion.div>
            <p className="mb-2 text-sm font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-danger-600 mt-2"
            >
              {error}
            </motion.p>
          )}
        </motion.label>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200"
        >
          <img
            src={preview || ''}
            alt="预览"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="w-5 h-5 text-success-400" />
              <div>
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-white/70">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
