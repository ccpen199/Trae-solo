import { User, Phone, MapPin, DollarSign, MessageSquare, Eye, Edit, Trash2 } from 'lucide-react';
import type { Customer } from '@/types';
import { formatPhone, getCustomerTypeLabel, getCustomerTypeColor, timeAgo } from '@/utils/format';
import AITagBadge from '../AITagBadge';

interface CustomerCardProps {
  customer: Customer;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onFollowUp?: (id: number) => void;
}

const CustomerCard = ({ customer, onView, onEdit, onDelete, onFollowUp }: CustomerCardProps) => {
  const getBudgetDisplay = () => {
    if (customer.type === 'buyer' || customer.type === 'tenant') {
      if (customer.type === 'buyer') {
        return `${(customer.budget_min / 10000).toFixed(0)}万 - ${(customer.budget_max / 10000).toFixed(0)}万`;
      }
      return `${customer.budget_min} - ${customer.budget_max}元/月`;
    }
    return '-';
  };

  return (
    <div className="card group">
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
            {customer.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-zinc-800">{customer.name}</h3>
              <span className={`tag ${getCustomerTypeColor(customer.type)}`}>
                {getCustomerTypeLabel(customer.type)}
              </span>
            </div>
            <p className="text-sm text-zinc-500 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {formatPhone(customer.phone)}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-zinc-400">{timeAgo(customer.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gold-500" />
            <div>
              <p className="text-xs text-zinc-400">预算</p>
              <p className="text-sm font-medium text-zinc-700">{getBudgetDisplay()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-500" />
            <div>
              <p className="text-xs text-zinc-400">意向区域</p>
              <p className="text-sm font-medium text-zinc-700 truncate">{customer.area_pref || '-'}</p>
            </div>
          </div>
        </div>

        {customer.remarks && (
          <div className="mb-3 p-3 bg-zinc-50 rounded-lg">
            <p className="text-sm text-zinc-600 line-clamp-2">{customer.remarks}</p>
          </div>
        )}

        {customer.voice_text && (
          <div className="mb-3 p-3 bg-primary-50 border border-primary-100 rounded-lg">
            <p className="text-xs text-primary-600 font-medium mb-1">🎤 语音录入内容</p>
            <p className="text-sm text-primary-700 line-clamp-2">{customer.voice_text}</p>
          </div>
        )}

        <div className="mb-4">
          <AITagBadge tags={customer.ai_tags || []} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <button
            onClick={() => onFollowUp?.(customer.id)}
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            <span>添加跟进</span>
          </button>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onView?.(customer.id)}
              className="p-1.5 text-zinc-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="查看详情"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit?.(customer.id)}
              className="p-1.5 text-zinc-500 hover:text-info-600 hover:bg-info-50 rounded-lg transition-colors"
              title="编辑"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(customer.id)}
              className="p-1.5 text-zinc-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;
