import { useState } from 'react'
import { Plus, ChevronRight, ChevronDown, Tag, FileText, Users } from 'lucide-react'

interface SubTag {
  name: string
  policyCount: number
  clauseCount: number
  crowdCount: number
}

interface TagItem {
  name: string
  policyCount: number
  clauseCount: number
  crowdCount: number
  subTags?: SubTag[]
}

const tagCategories: Record<string, TagItem[]> = {
  '人群': [
    {
      name: '企业职工',
      policyCount: 8,
      clauseCount: 32,
      crowdCount: 2450,
      subTags: [
        { name: '国有企业职工', policyCount: 5, clauseCount: 20, crowdCount: 980 },
        { name: '民营企业职工', policyCount: 6, clauseCount: 24, crowdCount: 1120 },
        { name: '外资企业职工', policyCount: 3, clauseCount: 12, crowdCount: 350 },
      ],
    },
    {
      name: '灵活就业人员',
      policyCount: 5,
      clauseCount: 18,
      crowdCount: 1280,
      subTags: [
        { name: '个体工商户', policyCount: 4, clauseCount: 14, crowdCount: 520 },
        { name: '自由职业者', policyCount: 3, clauseCount: 11, crowdCount: 760 },
      ],
    },
    {
      name: '城乡居民',
      policyCount: 6,
      clauseCount: 22,
      crowdCount: 3560,
      subTags: [
        { name: '农村居民', policyCount: 5, clauseCount: 18, crowdCount: 2100 },
        { name: '城镇居民', policyCount: 4, clauseCount: 15, crowdCount: 1460 },
      ],
    },
    { name: '退休人员', policyCount: 4, clauseCount: 16, crowdCount: 1890 },
    { name: '失业人员', policyCount: 3, clauseCount: 12, crowdCount: 456 },
    { name: '工伤人员', policyCount: 3, clauseCount: 10, crowdCount: 234 },
  ],
  '业务': [
    {
      name: '养老保险',
      policyCount: 12,
      clauseCount: 48,
      crowdCount: 5890,
      subTags: [
        { name: '职工基本养老', policyCount: 10, clauseCount: 40, crowdCount: 4200 },
        { name: '城乡居民养老', policyCount: 6, clauseCount: 24, crowdCount: 1690 },
      ],
    },
    {
      name: '医疗保险',
      policyCount: 9,
      clauseCount: 36,
      crowdCount: 6230,
      subTags: [
        { name: '职工医保', policyCount: 7, clauseCount: 28, crowdCount: 3800 },
        { name: '居民医保', policyCount: 5, clauseCount: 20, crowdCount: 2430 },
      ],
    },
    { name: '失业保险', policyCount: 7, clauseCount: 28, crowdCount: 3120 },
    { name: '工伤保险', policyCount: 5, clauseCount: 20, crowdCount: 1560 },
    { name: '生育保险', policyCount: 4, clauseCount: 16, crowdCount: 890 },
  ],
  '待遇': [
    {
      name: '养老待遇',
      policyCount: 6,
      clauseCount: 24,
      crowdCount: 1890,
      subTags: [
        { name: '基本养老金', policyCount: 5, clauseCount: 20, crowdCount: 1890 },
        { name: '过渡性养老金', policyCount: 3, clauseCount: 12, crowdCount: 560 },
      ],
    },
    {
      name: '医疗待遇',
      policyCount: 5,
      clauseCount: 20,
      crowdCount: 6230,
      subTags: [
        { name: '住院报销', policyCount: 4, clauseCount: 16, crowdCount: 6230 },
        { name: '门诊统筹', policyCount: 4, clauseCount: 15, crowdCount: 5890 },
      ],
    },
    { name: '失业待遇', policyCount: 4, clauseCount: 16, crowdCount: 456 },
    { name: '工伤待遇', policyCount: 3, clauseCount: 12, crowdCount: 234 },
  ],
  '地区': [
    {
      name: '省级',
      policyCount: 10,
      clauseCount: 40,
      crowdCount: 8560,
      subTags: [
        { name: '东部地区', policyCount: 8, clauseCount: 32, crowdCount: 4120 },
        { name: '中部地区', policyCount: 7, clauseCount: 28, crowdCount: 2650 },
        { name: '西部地区', policyCount: 6, clauseCount: 24, crowdCount: 1790 },
      ],
    },
    {
      name: '市级',
      policyCount: 8,
      clauseCount: 32,
      crowdCount: 5670,
      subTags: [
        { name: '直辖市', policyCount: 4, clauseCount: 16, crowdCount: 1890 },
        { name: '计划单列市', policyCount: 5, clauseCount: 20, crowdCount: 1230 },
      ],
    },
    { name: '县级', policyCount: 6, clauseCount: 24, crowdCount: 3450 },
  ],
}

const tabs = Object.keys(tagCategories)

export default function EnhancedTagSystem() {
  const [activeTab, setActiveTab] = useState('人群')
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(['企业职工']))

  const toggleExpand = (name: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div className="border border-gray-100 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">标签体系</h3>
        <button className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors">
          <Plus size={14} />
          新增标签
        </button>
      </div>

      <div className="flex border-b border-gray-100 mb-4 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm transition-colors relative ${
              activeTab === tab ? 'text-primary font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {tagCategories[activeTab]?.map((tag) => {
          const hasSub = tag.subTags && tag.subTags.length > 0
          const isExpanded = expandedTags.has(tag.name)
          return (
            <div key={tag.name}>
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => hasSub && toggleExpand(tag.name)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {hasSub ? (
                    isExpanded ? (
                      <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                    )
                  ) : (
                    <Tag size={14} className="text-gray-300 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-700 truncate">{tag.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="flex items-center gap-0.5 text-xs text-gray-400" title="关联政策">
                    <FileText size={10} />
                    {tag.policyCount}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-gray-400" title="关联条款">
                    <Tag size={10} />
                    {tag.clauseCount}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-gray-400" title="适用人群">
                    <Users size={10} />
                    {tag.crowdCount}
                  </span>
                </div>
              </div>
              {hasSub && isExpanded && (
                <div className="ml-5 border-l border-gray-100 pl-2 space-y-1">
                  {tag.subTags!.map((sub) => (
                    <div
                      key={sub.name}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <span className="text-xs text-gray-600 truncate">{sub.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {sub.policyCount}政策
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {sub.crowdCount}人
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
