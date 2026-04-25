import React, { useState } from 'react';
import { 
  Edit2, 
  Trash2, 
  X,
  DollarSign,
  Calendar,
  Tv,
  TrendingUp,
  ShoppingCart,
  Wrench,
  Zap,
  Plus,
  Settings,
  Check,
  Droplets,
  Flame,
  Wifi,
  Lightbulb,
  Sparkles,
  Package as PackageIcon
} from 'lucide-react';
import { useHomeContext } from '../context/HomeContext';
import type { BudgetEntry } from '../types';

interface QuickTemplate {
  id: string;
  label: string;
  description: string;
  category: 'utility' | 'maintenance' | 'replacement' | 'other';
  icon: React.ReactNode;
  defaultAmount?: number;
  applianceRelated?: boolean;
}

const quickTemplates: QuickTemplate[] = [
  {
    id: 'electricity',
    label: '电费',
    description: '每月电费支出',
    category: 'utility',
    icon: <Zap className="w-5 h-5" />,
    defaultAmount: 200,
  },
  {
    id: 'water',
    label: '水费',
    description: '每月水费支出',
    category: 'utility',
    icon: <Droplets className="w-5 h-5" />,
    defaultAmount: 50,
  },
  {
    id: 'gas',
    label: '燃气费',
    description: '每月燃气费支出',
    category: 'utility',
    icon: <Flame className="w-5 h-5" />,
    defaultAmount: 80,
  },
  {
    id: 'internet',
    label: '网费',
    description: '网络/宽带费用',
    category: 'utility',
    icon: <Wifi className="w-5 h-5" />,
    defaultAmount: 100,
  },
  {
    id: 'ac_clean',
    label: '空调清洗',
    description: '空调深度清洁服务',
    category: 'maintenance',
    icon: <Sparkles className="w-5 h-5" />,
    defaultAmount: 150,
    applianceRelated: true,
  },
  {
    id: 'ac_filter',
    label: '空调滤网',
    description: '更换空调滤网',
    category: 'replacement',
    icon: <PackageIcon className="w-5 h-5" />,
    defaultAmount: 50,
    applianceRelated: true,
  },
  {
    id: 'range_clean',
    label: '油烟机清洁',
    description: '油烟机深度清洁',
    category: 'maintenance',
    icon: <Sparkles className="w-5 h-5" />,
    defaultAmount: 200,
    applianceRelated: true,
  },
  {
    id: 'fridge_clean',
    label: '冰箱清洁',
    description: '冰箱除冰清洁',
    category: 'maintenance',
    icon: <Sparkles className="w-5 h-5" />,
    defaultAmount: 100,
    applianceRelated: true,
  },
  {
    id: 'washer_clean',
    label: '洗衣机清洁',
    description: '洗衣机槽清洁',
    category: 'maintenance',
    icon: <Sparkles className="w-5 h-5" />,
    defaultAmount: 80,
    applianceRelated: true,
  },
  {
    id: 'light_bulb',
    label: '灯泡更换',
    description: '更换灯泡',
    category: 'replacement',
    icon: <Lightbulb className="w-5 h-5" />,
    defaultAmount: 30,
  },
  {
    id: 'battery',
    label: '电池',
    description: '遥控器/门锁电池',
    category: 'replacement',
    icon: <PackageIcon className="w-5 h-5" />,
    defaultAmount: 20,
  },
  {
    id: 'cleaning_supplies',
    label: '清洁用品',
    description: '垃圾袋、清洁剂等',
    category: 'other',
    icon: <ShoppingCart className="w-5 h-5" />,
    defaultAmount: 50,
  },
];

interface BudgetFormProps {
  entry?: BudgetEntry;
  onClose: () => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ entry, onClose }) => {
  const { appliances, addBudgetEntry, updateBudgetEntry } = useHomeContext();
  const [formData, setFormData] = useState({
    category: entry?.category || 'utility' as const,
    amount: entry?.amount || 0,
    description: entry?.description || '',
    date: entry?.date || new Date().toISOString().split('T')[0],
    applianceId: entry?.applianceId || '',
    receiptUrl: entry?.receiptUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entry) {
      updateBudgetEntry(entry.id, formData);
    } else {
      addBudgetEntry(formData);
    }
    onClose();
  };

  const categories = [
    { id: 'utility', label: '水电费用', icon: <Zap className="w-4 h-4" /> },
    { id: 'maintenance', label: '维护费用', icon: <Wrench className="w-4 h-4" /> },
    { id: 'replacement', label: '配件更换', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'purchase', label: '设备购买', icon: <Tv className="w-4 h-4" /> },
    { id: 'other', label: '其他支出', icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{entry ? '编辑支出' : '新增支出'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">支出分类</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.id as any }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    formData.category === cat.id
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat.icon}
                  <span className="text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金额 (元) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={e => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：200"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支出描述 *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：空调清洗服务"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联设备</label>
              <select
                value={formData.applianceId}
                onChange={e => setFormData(prev => ({ ...prev, applianceId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">无</option>
                {appliances.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">凭证链接 (可选)</label>
            <input
              type="url"
              value={formData.receiptUrl}
              onChange={e => setFormData(prev => ({ ...prev, receiptUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入发票/收据链接"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {entry ? '保存修改' : '确认添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface QuickAddFormProps {
  template: QuickTemplate;
  onClose: () => void;
}

const QuickAddForm: React.FC<QuickAddFormProps> = ({ template, onClose }) => {
  const { appliances, addBudgetEntry } = useHomeContext();
  const [amount, setAmount] = useState(template.defaultAmount?.toString() || '');
  const [applianceId, setApplianceId] = useState('');
  const [date] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    
    addBudgetEntry({
      category: template.category,
      amount: Number(amount),
      description: template.label,
      date,
      applianceId: applianceId || undefined,
    });
    onClose();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'utility': return 'bg-green-100 text-green-700';
      case 'maintenance': return 'bg-orange-100 text-orange-700';
      case 'replacement': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden">
        <div className={`p-6 ${getCategoryColor(template.category)}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/50 rounded-lg flex items-center justify-center">
              {template.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{template.label}</h3>
              <p className="text-sm opacity-80">{template.description}</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金额 (元)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">¥</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl font-semibold"
                placeholder="输入金额"
                autoFocus
              />
            </div>
            {template.defaultAmount && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAmount(template.defaultAmount?.toString() || '')}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                >
                  建议: ¥{template.defaultAmount}
                </button>
              </div>
            )}
          </div>
          
          {template.applianceRelated && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联设备 (可选)</label>
              <select
                value={applianceId}
                onChange={e => setApplianceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">无</option>
                {appliances.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              确认记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BudgetView: React.FC<{ showAddForm: boolean; onCloseForm: () => void }> = ({ showAddForm, onCloseForm }) => {
  const { budgetEntries, appliances, deleteBudgetEntry } = useHomeContext();
  const [filter, setFilter] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [quickTemplate, setQuickTemplate] = useState<QuickTemplate | null>(null);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const filteredEntries = budgetEntries.filter(e => filter === 'all' || e.category === filter);
  
  const totalAmount = budgetEntries.reduce((sum, b) => sum + b.amount, 0);
  const categoryTotals = budgetEntries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
    return acc;
  }, {} as Record<string, number>);

  const getApplianceName = (id?: string) => {
    if (!id) return '';
    return appliances.find(a => a.id === id)?.name || '';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'purchase': return <Tv className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'replacement': return <ShoppingCart className="w-4 h-4" />;
      case 'utility': return <Zap className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'purchase': return '设备购买';
      case 'maintenance': return '维护费用';
      case 'replacement': return '配件更换';
      case 'utility': return '水电费用';
      default: return '其他支出';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'purchase': return 'bg-blue-100 text-blue-700';
      case 'maintenance': return 'bg-orange-100 text-orange-700';
      case 'replacement': return 'bg-purple-100 text-purple-700';
      case 'utility': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const categories = ['all', 'utility', 'maintenance', 'replacement', 'purchase', 'other'];
  const displayTemplates = showAllTemplates ? quickTemplates : quickTemplates.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总支出</p>
              <p className="text-2xl font-bold text-gray-800">¥{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {Object.entries(categoryTotals).slice(0, 4).map(([category, amount]) => (
          <div key={category} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(category)}`}>
                {getCategoryIcon(category)}
              </div>
              <div>
                <p className="text-sm text-gray-500">{getCategoryLabel(category)}</p>
                <p className="text-xl font-bold text-gray-800">¥{amount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">快捷记账</h3>
          <button
            onClick={() => setShowAllTemplates(!showAllTemplates)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Settings className="w-4 h-4" />
            {showAllTemplates ? '收起' : '更多模板'}
          </button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {displayTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => setQuickTemplate(template)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(template.category)} group-hover:scale-110 transition-transform`}>
                  {template.icon}
                </div>
                <span className="text-xs text-gray-600 text-center line-clamp-2">{template.label}</span>
              </button>
            ))}
            
            <button
              onClick={onCloseForm}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-xs text-gray-600 text-center">自定义</span>
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              点击模板快速记账，或选择"自定义"添加详细支出记录
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {cat === 'all' ? '全部' : getCategoryLabel(cat)}
            ({cat === 'all' ? budgetEntries.length : budgetEntries.filter(b => b.category === cat).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredEntries.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(entry => (
                <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(entry.category)}`}>
                        {getCategoryIcon(entry.category)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{entry.description}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {entry.date}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(entry.category)}`}>
                            {getCategoryLabel(entry.category)}
                          </span>
                          {entry.applianceId && (
                            <span className="flex items-center gap-1">
                              <Tv className="w-4 h-4" />
                              {getApplianceName(entry.applianceId)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-800">
                        ¥{entry.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBudgetEntry(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无支出记录</p>
            <p className="text-sm mt-1">使用上方快捷模板或点击"自定义"添加记录</p>
          </div>
        )}
      </div>

      {showAddForm && <BudgetForm onClose={onCloseForm} />}
      {editingEntry && (
        <BudgetForm entry={editingEntry} onClose={() => setEditingEntry(null)} />
      )}
      {quickTemplate && (
        <QuickAddForm template={quickTemplate} onClose={() => setQuickTemplate(null)} />
      )}
    </div>
  );
};
