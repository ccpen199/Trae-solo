import React from 'react';
import { User, Image, Phone, Ruler, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';

export interface DataScopeCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  fields: DataScopeField[];
}

export interface DataScopeField {
  id: string;
  label: string;
  description?: string;
}

export const DEFAULT_DATA_SCOPE_CATEGORIES: DataScopeCategory[] = [
  {
    id: 'basic',
    label: '基本信息',
    description: '姓名、年龄、身高等基础资料',
    icon: <User className="w-5 h-5" />,
    fields: [
      { id: 'stageName', label: '艺名/昵称', description: '公开显示的名称' },
      { id: 'realName', label: '真实姓名' },
      { id: 'age', label: '年龄' },
      { id: 'gender', label: '性别' },
      { id: 'location', label: '所在地区' },
    ],
  },
  {
    id: 'photos',
    label: '照片资料',
    description: '个人照片和媒体资产',
    icon: <Image className="w-5 h-5" />,
    fields: [
      { id: 'photos', label: '个人照片', description: '包含模卡和作品集照片' },
      { id: 'threeView', label: '三视照片' },
      { id: 'videos', label: '视频资料' },
    ],
  },
  {
    id: 'contact',
    label: '联系方式',
    description: '电话、邮箱等联系信息',
    icon: <Phone className="w-5 h-5" />,
    fields: [
      { id: 'phone', label: '手机号码' },
      { id: 'email', label: '邮箱地址' },
      { id: 'wechat', label: '微信号' },
    ],
  },
  {
    id: 'measurements',
    label: '身体数据',
    description: '身高、体重、三围等',
    icon: <Ruler className="w-5 h-5" />,
    fields: [
      { id: 'height', label: '身高' },
      { id: 'weight', label: '体重' },
      { id: 'bust', label: '胸围' },
      { id: 'waist', label: '腰围' },
      { id: 'hips', label: '臀围' },
      { id: 'eyeColor', label: '眼睛颜色' },
      { id: 'hairColor', label: '头发颜色' },
    ],
  },
  {
    id: 'schedule',
    label: '日程安排',
    description: '工作档期和日程信息',
    icon: <Calendar className="w-5 h-5" />,
    fields: [
      { id: 'schedule', label: '工作日程', description: '已确认和待确认的档期' },
      { id: 'history', label: '工作经历' },
    ],
  },
];

export interface DataScopeSelectorProps {
  selectedFields: string[];
  onChange: (fields: string[]) => void;
  categories?: DataScopeCategory[];
  className?: string;
}

const DataScopeSelector: React.FC<DataScopeSelectorProps> = ({
  selectedFields,
  onChange,
  categories = DEFAULT_DATA_SCOPE_CATEGORIES,
  className,
}) => {
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>(
    categories.map((c) => c.id)
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const isCategorySelected = (category: DataScopeCategory): boolean => {
    return category.fields.every((f) => selectedFields.includes(f.id));
  };

  const isCategoryIndeterminate = (category: DataScopeCategory): boolean => {
    const selected = category.fields.filter((f) => selectedFields.includes(f.id)).length;
    return selected > 0 && selected < category.fields.length;
  };

  const toggleCategoryFields = (category: DataScopeCategory) => {
    const fieldIds = category.fields.map((f) => f.id);
    const allSelected = isCategorySelected(category);

    if (allSelected) {
      onChange(selectedFields.filter((id) => !fieldIds.includes(id)));
    } else {
      onChange([...new Set([...selectedFields, ...fieldIds])]);
    }
  };

  const toggleField = (fieldId: string) => {
    if (selectedFields.includes(fieldId)) {
      onChange(selectedFields.filter((id) => id !== fieldId));
    } else {
      onChange([...selectedFields, fieldId]);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {categories.map((category) => {
          const expanded = expandedCategories.includes(category.id);
          const selected = isCategorySelected(category);
          const indeterminate = isCategoryIndeterminate(category);

          return (
            <div
              key={category.id} className="rounded-xl border border-midnight-700 bg-midnight-900/50 overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-midnight-800/50 transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                <button
                  type="button"
                  className="text-midnight-400 hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(category.id);
                  }}
                >
                  {expanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                </button>
                <div className="text-rose-400">{category.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{category.label}</p>
                  <p className="text-sm text-midnight-400">{category.description}</p>
                </div>
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => toggleCategoryFields(category)}
                  aria-label={`选择${category.label}的所有字段`}
                />
              </div>
              {expanded && (
                <div className="px-4 pb-4 pl-16 space-y-2 border-t border-midnight-700/50 pt-3">
                  {category.fields.map((field) => (
                    <Checkbox
                      key={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                      label={field.label}
                      description={field.description}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default DataScopeSelector;
