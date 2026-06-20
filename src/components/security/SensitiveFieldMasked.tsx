import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { maskValue, SensitiveFieldType } from '@/utils/security';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface SensitiveFieldMaskedProps {
  value: string;
  fieldType: SensitiveFieldType;
  label?: string;
  requireAuth?: boolean;
  onReveal?: () => Promise<boolean>;
  className?: string;
}

const SensitiveFieldMasked: React.FC<SensitiveFieldMaskedProps> = ({
  value,
  fieldType,
  label,
  requireAuth = true,
  onReveal,
  className,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  const maskedValue = maskValue(value, fieldType);

  const handleToggle = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    if (!requireAuth) {
      setIsRevealed(true);
      return;
    }

    setIsAuthLoading(true);
    setAuthFailed(false);

    try {
      const success = onReveal ? await onReveal() : true;
      if (success) {
        setIsRevealed(true);
      } else {
        setAuthFailed(true);
      }
    } catch {
      setAuthFailed(true);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <span className="text-sm text-midnight-400">{label}</span>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-midnight-900/50 border border-midnight-700">
          {!isRevealed && <Lock className="w-4 h-4 text-midnight-500" />}
          <span className={cn(
            'font-mono transition-all duration-300',
            isRevealed ? 'text-white' : 'text-midnight-300'
          )}>
            {isRevealed ? value : maskedValue}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          loading={isAuthLoading}
          leftIcon={isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        >
          {isRevealed ? '隐藏' : '显示'}
        </Button>
      </div>
      {authFailed && (
        <p className="text-sm text-red-400 animate-fade-in">
          验证失败，无法显示敏感信息
        </p>
      )}
      {requireAuth && !isRevealed && !authFailed && (
        <p className="text-xs text-midnight-500">
          查看此信息需要身份验证
        </p>
      )}
    </div>
  );
};

export default SensitiveFieldMasked;
