import { useState } from 'react'
import { Search, Grid3X3, List, FileText, Play, Image, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import ContentCard from '@/components/ContentCard'

const typeTabs = [
  { value: 'all', label: '全部', icon: Grid3X3 },
  { value: 'article', label: '文章', icon: FileText },
  { value: 'video', label: '视频', icon: Play },
  { value: 'image', label: '图集', icon: Image },
]

const demoContents = [
  { id: 1, title: '2024年北京房价走势分析与预测', excerpt: '结合最新政策和市场数据，为您解读北京房地产市场的未来走向，分析影响房价的关键因素，帮助购房者做出明智决策。', contentType: 'article' as const, authorName: '房产研究员', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 2341, collectCount: 856 },
  { id: 2, title: '装修避坑指南：10个最容易忽略的细节', excerpt: '过来人总结的装修经验，帮你少走弯路，省钱又省心。从水电改造到竣工验收，全方位解析装修中的常见陷阱。', contentType: 'video' as const, authorName: '装修达人', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 5672, collectCount: 2134 },
  { id: 3, title: 'VR看房攻略：如何在线选到心仪的房子', excerpt: '利用VR技术足不出户就能全方位了解房源，教你看门道而不是看热闹。详细讲解VR看房的技巧和注意事项。', contentType: 'article' as const, authorName: '科技宅', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 1893, collectCount: 621 },
  { id: 4, title: '小户型大空间：30㎡loft改造全过程', excerpt: '30平米loft如何变身两室一厅？看设计师如何施展空间魔法，打造功能齐全的温馨小窝。', contentType: 'video' as const, authorName: '设计师小周', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 8923, collectCount: 4521 },
  { id: 5, title: '100款最美客厅设计图集', excerpt: '精选100款不同风格的客厅设计案例，现代简约、北欧、新中式、美式、轻奢...总有一款适合你。', contentType: 'image' as const, authorName: '家居美学', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 3456, collectCount: 1892 },
  { id: 6, title: '二手房交易流程全解析', excerpt: '从看房、议价、签合同到过户、交房，二手房交易完整流程指南。避开交易陷阱，保障自身权益。', contentType: 'article' as const, authorName: '王律师', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1560184897-67f4a319d2cd?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 4521, collectCount: 2341 },
  { id: 7, title: '智能家居入门：哪些设备值得买', excerpt: '智能家居产品琳琅满目，哪些才是真正提升生活品质的刚需？从实际使用体验出发，给你最真诚的推荐。', contentType: 'video' as const, authorName: '数码爱好者', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 2789, collectCount: 1234 },
  { id: 8, title: '20款绝美厨房设计', excerpt: '厨房是家的心脏，高颜值又实用的厨房设计谁不爱？精选20款不同风格厨房设计，给你装修灵感。', contentType: 'image' as const, authorName: '美食博主', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 4123, collectCount: 2567 },
  { id: 9, title: '租房还是买房？算一笔明白账', excerpt: '租房和买房哪个更划算？用数据说话，从财务角度分析不同情况下的最优选择。', contentType: 'article' as const, authorName: '理财师', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 6789, collectCount: 3456 },
]

export default function ContentList() {
  const [activeType, setActiveType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'waterfall' | 'grid'>('waterfall')

  const filteredContents = demoContents.filter((content) => {
    const matchesType = activeType === 'all' || content.contentType === activeType
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">内容中心</h1>
          <p className="text-slate-500">专业房产知识，装修干货分享，助您做出明智决策</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文章、视频..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('waterfall')}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    viewMode === 'waterfall' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                  )}
                >
                  <Grid3X3 size={18} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    viewMode === 'grid' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                  )}
                >
                  <List size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
          {typeTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveType(tab.value)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap',
                activeType === tab.value
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                  : 'bg-white text-slate-600 hover:bg-teal-50 shadow-md'
              )}
            >
              <tab.icon size={18} strokeWidth={1.5} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-teal-600" strokeWidth={1.5} />
          <span className="text-sm text-slate-500">
            共找到 <span className="font-semibold text-teal-600">{filteredContents.length}</span> 条内容
          </span>
        </div>

        {filteredContents.length > 0 ? (
          <div className={viewMode === 'waterfall' ? 'masonry-grid' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
            {filteredContents.map((content) => (
              <ContentCard key={content.id} {...content} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-16 text-center shadow-md">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Search size={32} className="text-slate-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无相关内容</h3>
            <p className="text-slate-500">试试其他筛选条件或搜索关键词</p>
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <button className="px-8 py-3 bg-white text-teal-600 rounded-xl font-medium hover:bg-teal-50 transition-colors shadow-md">
            加载更多
          </button>
        </div>
      </div>
    </div>
  )
}
