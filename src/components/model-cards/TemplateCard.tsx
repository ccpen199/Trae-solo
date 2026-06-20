import React, { useState } from 'react';
import { Crown, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ModelCardTemplate } from '@shared/types';

interface TemplateCardProps {
  template: ModelCardTemplate;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

const platformBadgeVariant: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'default'> = {
  'Instagram': 'primary',
  'TikTok': 'secondary',
  'WeChat': 'success',
  'Professional': 'warning',
  'Print': 'default',
};

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick, selected = false, className }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      variant="default"
      hoverable
      className={cn(
        'group relative overflow-hidden', selected && 'ring-2 ring-rose-500 ring-offset-2 ring-offset-midnight-900', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-midnight-900">
        <img
          src={template.thumbnailUrl}
          alt={template.name}
          className={cn(
            'w-full h-full object-cover transition-all duration-500 ease-out-expo',
            isHovered && 'scale-110')}
        />

        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-midnight-900/80 via-transparent to-transparent transition-opacity duration-300', isHovered ? 'opacity-100' : 'opacity-60' )} />

        {template.isPremium && (
          <div className="absolute top-3 left-3">
            <Badge variant="warning" size="sm" dot>
              <Crown className="w-3 h-3" />
              高级
            </Badge>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <Badge variant={platformBadgeVariant[template.platform] || 'default'} size="sm">
            {template.platform}
          </Badge>
        </div>

        <div className={cn(
          'absolute inset-0 flex items-center justify-center transition-all duration-300',
          isHovered ? 'opacity-100 bg-midnight-900/60' : 'opacity-0 pointer-events-none'
        )}>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Eye className="w-4 h-4" />}
            className="shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            使用模板
          </Button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white text-base mb-1 line-clamp-1">
          {template.name}
        </h3>
        <div className="flex items-center justify-between text-sm text-midnight-400">
          <span>{template.width} × {template.height}</span>
          <span className="capitalize">{template.category}</span>
        </div>
      </div>
    </Card>
  );
};

export default TemplateCard;
