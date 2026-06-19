import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, FileText, Image as ImageIcon, X, AlertTriangle } from 'lucide-react';
import type { EvidenceFile } from '@/types';
import { formatFileSize, maskFileName } from '@/utils/format';

interface EvidencePreviewProps {
  file: EvidenceFile;
  onDownload?: (file: EvidenceFile) => void;
}

export default function EvidencePreview({ file, onDownload }: EvidencePreviewProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewImage, setPreviewImage] = useState(false);

  const displayName = maskFileName(file.originalName || file.fileName);

  const handleDownloadClick = () => {
    setShowConfirm(true);
  };

  const confirmDownload = () => {
    setShowConfirm(false);
    onDownload?.(file);
  };

  const renderImagePreview = () => (
    <div
      onClick={() => setPreviewImage(true)}
      className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg border border-primary-100 bg-primary-50"
    >
      <img
        src={file.fileUrl}
        alt={displayName}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {file.watermarkEnabled && (
        <div className="watermark-overlay">
          <div className="flex h-full w-full items-center justify-center">
            <span className="rotate-[-25deg] text-2xl font-bold text-accent-gold">
              法律公益咨询平台
            </span>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
    </div>
  );

  const renderFilePreview = () => (
    <div className="flex items-center gap-3 rounded-lg border border-primary-100 bg-primary-50/50 p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
        {file.fileType === 'image' ? (
          <ImageIcon className="h-6 w-6 text-primary-500" />
        ) : (
          <FileText className="h-6 w-6 text-primary-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary-800">{displayName}</p>
        <p className="text-xs text-primary-500">{formatFileSize(file.fileSize)}</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-primary-100/50 bg-white p-4 shadow-card">
      {file.fileType === 'image' ? renderImagePreview() : renderFilePreview()}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-primary-400">
          {file.watermarkEnabled && (
            <span className="badge border border-accent-gold/30 bg-accent-gold/5 text-accent-gold-dark">
              已加水印
            </span>
          )}
          <span>
            {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString('zh-CN') : ''}
          </span>
        </div>

        <button
          onClick={handleDownloadClick}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700 transition-all duration-200 hover:border-accent-gold hover:text-accent-gold-dark"
        >
          <Download className="h-3.5 w-3.5" />
          下载
        </button>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-semibold text-primary-800">
                    确认下载证据文件
                  </h4>
                  <p className="text-xs text-primary-500">请确保用于合法用途</p>
                </div>
              </div>

              <p className="mb-5 text-sm text-primary-600">
                您即将下载文件 <span className="font-medium text-primary-800">{displayName}</span>
                ，请确认您已获得相关授权，并承诺仅用于法律维权等合法用途。
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn-outline flex-1"
                >
                  取消
                </button>
                <button
                  onClick={confirmDownload}
                  className="btn-primary flex-1"
                >
                  确认下载
                </button>
              </div>

              <button
                onClick={() => setShowConfirm(false)}
                className="absolute right-3 top-3 rounded-lg p-1 text-primary-400 transition-colors hover:bg-primary-100 hover:text-primary-600"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewImage && file.fileType === 'image' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90"
              onClick={() => setPreviewImage(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setPreviewImage(false)}
            >
              <div
                className="relative max-h-full max-w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={file.fileUrl}
                  alt={displayName}
                  className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
                />
                {file.watermarkEnabled && (
                  <div className="watermark-overlay">
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="rotate-[-25deg] text-4xl font-bold text-accent-gold">
                        法律公益咨询平台
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setPreviewImage(false)}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
