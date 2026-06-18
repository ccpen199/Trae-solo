import { useState } from 'react'
import { Plus } from 'lucide-react'

const tagCategories: Record<string, { name: string; count: number }[]> = {
  '人群': [
    { name: '企业职工', count: 8 },
    { name: '灵活就业人员', count: 5 },
    { name: '城乡居民', count: 6 },
    { name: '退休人员', count: 4 },
    { name: '失业人员', count: 3 },
  ],
  '业务': [
    { name: '养老保险', count: 12 },
    { name: '医疗保险', count: 9 },
    { name: '失业保险', count: 7 },
    { name: '工伤保险', count: 5 },
    { name: '生育保险', count: 4 },
  ],
  '待遇': [
    { name: '养老待遇', count: 6 },
    { name: '医疗待遇', count: 5 },
    { name: '失业待遇', count: 4 },
    { name: '工伤待遇', count: 3 },
  ],
  '地区': [
    { name: '省级', count: 10 },
    { name: '市级', count: 8 },
    { name: '县级', count: 6 },
  ],
}

const tabs = Object.keys(tagCategories)

export default function TagSystem() {
  const [activeTab, setActiveTab] = useState('人群')

  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">标签体系</h3>
        <button className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors">
          <Plus size={14} />
          新增标签
        </button>
      </div>

      <div className="flex border-b border-gray-100 mb-4">
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

      <div className="space-y-2">
        {tagCategories[activeTab]?.map((tag) => (
          <div
            key={tag.name}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="text-sm text-gray-700">{tag.name}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {tag.count}个政策
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
