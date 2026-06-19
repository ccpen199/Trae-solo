import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';
import { formatFileSize, formatDate } from '@/utils/format';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  fileName?: string;
  fileSize?: number;
  imageUrl?: string;
  onBurn?: (messageId: string) => void;
  onDownload?: (messageId: string) => void;
}

export default function ChatMessageBubble({
  message,
  isOwn,
  fileName,
  fileSize,
  imageUrl,
  onBurn,
  onDownload,
}: ChatMessageBubbleProps) {
  const [burnCountdown, setBurnCountdown] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (message.burnAfterReading && message.isRead && message.burnDuration) {
      setBurnCountdown(message.burnDuration);
      const interval = setInterval(() => {
        setBurnCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setIsFading(true);
            setTimeout(() => onBurn?.(message.id), 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [message.burnAfterReading, message.isRead, message.burnDuration, message.id, onBurn]);

  const renderFileContent = () => {
    if (message.messageType === 'image' && imageUrl) {
      return (
        <div className="overflow-hidden rounded-lg">
          <img src={imageUrl} alt="图片消息" className="max-w-xs object-cover" />
        </div>
      );
    }

    if (message.messageType === 'file' && fileName) {
      return (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border p-3',
            isOwn
              ? 'border-white/20 bg-white/10'
              : 'border-primary-100 bg-primary-50'
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              isOwn ? 'bg-white/20' : 'bg-primary-100'
            )}
          >
            <FileText className={cn('h-5 w-5', isOwn ? 'text-white' : 'text-primary-600')} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'truncate text-sm font-medium',
                isOwn ? 'text-white' : 'text-primary-800'
              )}
            >
              {fileName}
            </p>
            <p className={cn('text-xs', isOwn ? 'text-white/70' : 'text-primary-500')}>
              {fileSize ? formatFileSize(fileSize) : ''}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.(message.id);
            }}
            className={cn(
              'shrink-0 rounded-lg p-2 transition-colors',
              isOwn
                ? 'text-white/70 hover:bg-white/20 hover:text-white'
                : 'text-primary-500 hover:bg-primary-100 hover:text-primary-700'
            )}
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return null;
  };

  const bubbleContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isFading ? 0 : 1, y: isFading ? -5 : 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex w-full max-w-[75%] flex-col gap-1', isOwn ? 'ml-auto items-end' : 'items-start')}
    >
      <div
        className={cn(
          'relative rounded-2xl px-4 py-3 shadow-sm',
          isOwn
            ? 'rounded-br-md bg-primary-800 text-white'
            : 'rounded-bl-md bg-white text-primary-800 border border-primary-100'
        )}
      >
        {message.burnAfterReading && (
          <div
            className={cn(
              'mb-2 flex items-center gap-1.5 text-xs',
              isOwn ? 'text-white/70' : 'text-orange-500'
            )}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>
              {burnCountdown !== null
                ? `${burnCountdown} 秒后焚毁`
                : '阅后即焚'}
            </span>
          </div>
        )}

        {message.messageType === 'text' ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
            {message.content}
          </p>
        ) : (
          renderFileContent()
        )}
      </div>

      <div
        className={cn(
          'flex items-center gap-2 px-1 text-xs text-primary-400',
          isOwn ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        <span>{formatDate(message.createdAt, 'HH:mm')}</span>
        {isOwn && (
          <span>{message.isRead ? '已读' : '未读'}</span>
        )}
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      {!isFading && bubbleContent}
    </AnimatePresence>
  );
}
