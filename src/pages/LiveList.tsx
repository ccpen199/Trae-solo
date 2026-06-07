import { useState } from 'react'
import { Search, Grid3X3, LayoutList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stableImageUrl } from '@/lib/media'
import LiveCard from '@/components/LiveCard'

const categories = [
  { value: 'all', label: '全部' },
  { value: 'house_viewing', label: '看房' },
  { value: 'renovation', label: '装修' },
  { value: 'design', label: '设计' },
  { value: 'legal', label: '法律' },
]

const statusTabs = [
  { value: 'live', label: '正在直播', count: 128 },
  { value: 'scheduled', label: '即将开播', count: 56 },
  { value: 'replay', label: '精彩回放', count: 342 },
]

const demoLives = [
  { id: 1, coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800&h=450', title: '朝阳公园旁精品三居室 直播带看中', hostName: '张顾问', viewerCount: 1256, status: 'live' as const, category: 'house_viewing' },
  { id: 2, coverImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800&h=450', title: '现代简约风格装修设计分享', hostName: '李设计师', viewerCount: 892, status: 'live' as const, category: 'design' },
  { id: 3, coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800&h=450', title: '二手房交易法律风险避坑指南', hostName: '王律师', viewerCount: 2341, status: 'live' as const, category: 'legal' },
  { id: 4, coverImage: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800&h=450', title: '全屋定制材料选择攻略', hostName: '陈工长', viewerCount: 567, status: 'scheduled' as const, category: 'renovation', scheduledAt: '2024-01-15 14:00' },
  { id: 5, coverImage: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&q=80&w=800&h=450', title: '海淀区学区房专场直播', hostName: '刘顾问', viewerCount: 1823, status: 'live' as const, category: 'house_viewing' },
  { id: 6, coverImage: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800&h=450', title: '小户型空间利用设计技巧', hostName: '周设计师', viewerCount: 0, status: 'replay' as const, category: 'design' },
  { id: 7, coverImage: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=800&h=450', title: '装修预算如何合理分配', hostName: '赵监理', viewerCount: 0, status: 'replay' as const, category: 'renovation' },
  { id: 8, coverImage: 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&q=80&w=800&h=450', title: '租房合同签订注意事项', hostName: '孙律师', viewerCount: 0, status: 'replay' as const, category: 'legal' },
]

export default function LiveList() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeStatus, setActiveStatus] = useState('live')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredLives = demoLives.filter((live) => {
    const matchesCategory = activeCategory === 'all' || live.category === activeCategory
    const matchesStatus = live.status === activeStatus
    const matchesSearch = live.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      live.hostName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesStatus && matchesSearch
  })

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">直播中心</h1>
          <p className="text-slate-500">专业直播带看，互动答疑，足不出户看好房</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索直播间、主播..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2.5 rounded-lg transition-colors',
                  viewMode === 'grid' ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                <Grid3X3 size={18} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2.5 rounded-lg transition-colors',
                  viewMode === 'list' ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                <LayoutList size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-2 shadow-md mb-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  'px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  activeCategory === cat.value
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveStatus(tab.value)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap',
                activeStatus === tab.value
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                  : 'bg-white text-slate-600 hover:bg-teal-50 shadow-md'
              )}
            >
              {tab.label}
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                activeStatus === tab.value ? 'bg-white/20' : 'bg-slate-100'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {filteredLives.length > 0 ? (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          )}>
            {filteredLives.map((live) => (
              viewMode === 'list' ? (
                <div key={live.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative md:w-80 h-48 md:h-auto">
                      <img src={stableImageUrl(live.coverImage, live.title)} alt={live.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3">
                        {live.status === 'live' && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                            <span className="w-2 h-2 bg-white rounded-full live-pulse" />
                            直播中
                          </span>
                        )}
                        {live.status === 'scheduled' && (
                          <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                            预告
                          </span>
                        )}
                        {live.status === 'replay' && (
                          <span className="px-2.5 py-1 bg-slate-400 text-white text-xs font-medium rounded-full">
                            回放
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{live.title}</h3>
                      <p className="text-slate-600 mb-4">主播：{live.hostName}</p>
                      {live.status === 'live' && (
                        <p className="text-teal-600 font-medium">{live.viewerCount.toLocaleString()} 人观看</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <LiveCard key={live.id} {...live} />
              )
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-16 text-center shadow-md">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Search size={32} className="text-slate-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无相关直播</h3>
            <p className="text-slate-500">试试其他筛选条件或搜索关键词</p>
          </div>
        )}
      </div>
    </div>
  )
}
