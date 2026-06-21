import { useState } from 'react';
import { FileText, Search, Check, Eye, ArrowRight } from 'lucide-react';
import { mockContractTemplates } from '@/mock/data';
import Tag from '@/components/ui/Tag';
import { getIndustryLabel } from '@/utils/helpers';
import type { IndustryType } from '../../../shared/types';

const industryFilters = [
  { id: 'all', name: '全部' },
  { id: 'restaurant', name: '餐饮' },
  { id: 'retail', name: '零售' },
  { id: 'housekeeping', name: '家政' },
  { id: 'logistics', name: '物流' },
  { id: 'security', name: '安保' },
];

const industryColorMap: Record<string, string> = {
  restaurant: 'orange',
  retail: 'blue',
  housekeeping: 'purple',
  logistics: 'green',
  security: 'red',
  other: 'gray',
};

const keyFeatures = [
  '包含劳动报酬条款',
  '包含工作时间与休息条款',
  '包含社会保险条款',
  '包含劳动保护条款',
  '包含合同终止与解除条款',
];

export default function ContractTemplates() {
  const [searchText, setSearchText] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  const filteredTemplates = mockContractTemplates.filter(template => {
    const matchSearch = template.name.includes(searchText) || template.description.includes(searchText);
    const matchIndustry = selectedIndustry === 'all' || template.industry === selectedIndustry;
    return matchSearch && matchIndustry;
  });

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#1E3A5F]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">劳务合同模板库</h1>
        </div>
        <p className="text-gray-500 ml-13">基于行业标准的合规合同模板，支持自定义条款</p>
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索模板名称..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35]/50 bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {industryFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedIndustry(filter.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedIndustry === filter.id
                    ? 'bg-[#1E3A5F] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="glass rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-[#1E3A5F]/20"
          >
            <div className="mb-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 pr-2">{template.name}</h3>
              </div>
              <Tag
                label={getIndustryLabel(template.industry as IndustryType)}
                color={industryColorMap[template.industry] || 'gray'}
              />
            </div>

            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{template.description}</p>

            <div className="space-y-2 mb-5">
              {keyFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Check className="h-2.5 w-2.5 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-600 leading-snug">{feature}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-sm text-gray-500">
                共 <span className="font-semibold text-[#1E3A5F]">{template.clauseCount}</span> 条标准条款
              </p>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#1E3A5F]/90 transition-colors shadow-sm">
                使用此模板
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-2">
                <Eye className="h-4 w-4" />
                预览
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="glass rounded-2xl py-16 flex flex-col items-center justify-center">
          <FileText className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-1">未找到匹配的模板</h3>
          <p className="text-sm text-gray-400">请尝试调整搜索条件或筛选行业</p>
        </div>
      )}
    </div>
  );
}
