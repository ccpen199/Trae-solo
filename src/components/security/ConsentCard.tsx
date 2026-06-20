import React from 'react';
import * as Switch from '@radix-ui/react-switch';
import { ChevronDown, ChevronUp, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface ConsentData {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'marketing' | 'analytics' | 'third_party';
  required?: boolean;
  granted: boolean;
  grantedAt?: Date;
  expiresAt?: Date;
  details?: string[];
  canRevoke?: boolean;
}

export interface ConsentCardProps {
  consent: ConsentData;
  onToggle: (consentId: string, granted: boolean) => void;
  className?: string;
}

const getCategoryLabel = (category: ConsentData['category']): string => {
  switch (category) {
    case 'basic': return '基础功能';
    case 'marketing': return '营销推广';
    case 'analytics': return '数据分析';
    case 'third_party': return '第三方共享';
  }
};

const getCategoryColor = (category: ConsentData['category']): 'default' | 'primary' | 'secondary' | 'warning' => {
  switch (category) {
    case 'basic': return 'default';
    case 'marketing': return 'primary';
    case 'analytics': return 'secondary';
    case 'third_party': return 'warning';
  }
};

const ConsentCard: React.FC<ConsentCardProps> = ({ consent, onToggle, className }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const isExpired = consent.expiresAt && new Date(consent.expiresAt) < new Date();

  return (
    <div
      className={cn(
        'rounded-xl border border-midnight-700 bg-midnight-900/50 overflow-hidden transition-all duration-300',
        consent.granted && !isExpired && 'border-emerald-500/30',
        !consent.granted && !consent.required && 'border-midnight-700',
        className
      )}
    >
      <div className="flex items-start gap-4 p-4">
        <div className="pt-1">
          <Switch.Root
            checked={consent.granted}
            onCheckedChange={(checked) => {
              if (consent.canRevoke !== false || consent.required === false) {
                onToggle(consent.id, checked);
              }
            }}
            disabled={consent.required || consent.canRevoke === false}
            className={cn(
              'relative w-11 h-6 rounded-full transition-all duration-300',
              consent.granted ? 'bg-gradient-primary' : 'bg-midnight-700',
              (consent.required || consent.canRevoke === false) && 'opacity-70 cursor-not-allowed'
            )}
          >
            <Switch.Thumb
              className={cn(
                'block w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-300',
                consent.granted ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </Switch.Root>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-medium text-white">{consent.title}</h4>
            <Badge variant={getCategoryColor(consent.category)} size="sm">
              {getCategoryLabel(consent.category)}
            </Badge>
            {consent.required && (
              <Badge variant="danger" size="sm" dot>
                必需
              </Badge>
            )}
            {consent.granted && !isExpired && (
              <Badge variant="success" size="sm" dot>
                已授权
              </Badge>
            )}
            {isExpired && (
              <Badge variant="warning" size="sm" dot>
                已过期
              </Badge>
            )}
          </div>
          <p className="text-sm text-midnight-400 mb-2">{consent.description}</p>
          {consent.grantedAt && consent.granted && (
            <div className="flex items-center gap-4 text-xs text-midnight-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                授权时间：{format(new Date(consent.grantedAt), 'yyyy-MM-dd', { locale: zhCN })}
              </span>
              {consent.expiresAt && (
                <span className={cn(
                  'flex items-center gap-1',
                  isExpired && 'text-amber-400'
                )}>
                  {isExpired ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                  {isExpired ? '已过期' : '到期'}：{format(new Date(consent.expiresAt), 'yyyy-MM-dd', { locale: zhCN })}
                </span>
              )}
            </div>
          )}
          {consent.details && consent.details.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 mt-2 transition-colors"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  收起详情
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  查看详情
                </>
              )}
            </button>
          )}
        </div>
      </div>
      {showDetails && consent.details && (
        <div className="px-4 pb-4 pl-14 space-y-1.5 animate-fade-in">
          {consent.details.map((detail, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-midnight-300">
              <span className="text-rose-400 mt-0.5">•</span>
              {detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsentCard;
