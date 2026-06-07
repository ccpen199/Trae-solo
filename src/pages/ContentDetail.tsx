import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, CheckCircle, FileText, Heart, Image, Play, Share2, User } from 'lucide-react'
import SmartImage from '@/components/SmartImage'
import { cn } from '@/lib/utils'

const contentItems = [
  {
    id: 1,
    title: '2024年北京房价走势分析与预测',
    contentType: 'article',
    authorName: '房产研究员',
    mediaUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200&h=720',
    likeCount: 2341,
    collectCount: 856,
    body: [
      '北京房地产市场在政策宽松、改善型需求释放和核心区供应稀缺的共同作用下，进入更重视品质与通勤效率的新阶段。',
      '从成交结构看，总价段分化明显。核心区学区和产业带改善盘仍保持较强韧性，远郊同质化房源议价空间更大。',
      '购房者应优先核验产权、学区、物业维护和交通规划，同时结合月供压力做保守预算，避免只按挂牌价判断价值。',
    ],
    tags: ['房价趋势', '政策解读', '购房决策'],
  },
  {
    id: 2,
    title: '装修避坑指南：10个最容易忽略的细节',
    contentType: 'video',
    authorName: '装修达人',
    mediaUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200&h=720',
    likeCount: 5672,
    collectCount: 2134,
    body: [
      '装修预算最容易失控的环节通常在水电点位、柜体五金、防水闭水和墙面基层处理。',
      '签约前应把材料品牌、施工工艺、验收节点和增项计价写清楚，口头承诺需要落到报价单和合同附件。',
      '隐蔽工程验收时保留照片、视频和管线图，后续维修、安装家电和二次改造都会用得上。',
    ],
    tags: ['装修避坑', '报价单', '隐蔽工程'],
  },
  {
    id: 3,
    title: 'VR看房攻略：如何在线选到心仪的房子',
    contentType: 'article',
    authorName: '科技宅',
    mediaUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=1200&h=720',
    likeCount: 1893,
    collectCount: 621,
    body: [
      'VR看房适合先排除户型硬伤、采光遮挡和装修老化问题，再把时间留给少量线下复看。',
      '观看时重点留意窗外遮挡、梁柱位置、卫生间暗角、厨房动线和收纳空间，不要只看镜头里的开阔感。',
      '最终决策仍建议结合小区实地环境、噪声、物业维护和周边通勤体验一起判断。',
    ],
    tags: ['VR看房', '线上选房', '实勘'],
  },
]

const contentTypeConfig = {
  article: { label: '文章', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  video: { label: '视频', icon: Play, color: 'bg-red-100 text-red-700' },
  image: { label: '图集', icon: Image, color: 'bg-amber-100 text-amber-700' },
}

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [notice, setNotice] = useState('')

  const content = contentItems.find((item) => item.id === Number(id)) || contentItems[0]
  const config = contentTypeConfig[content.contentType as keyof typeof contentTypeConfig]
  const TypeIcon = config.icon

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/content" className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 mb-6">
          <ArrowLeft size={16} strokeWidth={1.5} />
          返回内容中心
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          <div className="relative aspect-[16/9] bg-slate-100">
            <SmartImage
              src={content.mediaUrl}
              alt={content.title}
              className="w-full h-full object-cover"
              fallbackText="内容图片"
              aspectRatio="16/9"
            />
            <div className="absolute top-5 left-5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${config.color}`}>
                <TypeIcon size={15} strokeWidth={1.5} />
                {config.label}
              </span>
            </div>
            {content.contentType === 'video' && (
              <button
                onClick={() => setNotice('视频已进入试看模式，完整播放记录已生成')}
                className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-teal-600 shadow-lg transition-transform hover:scale-105"
                aria-label="播放视频"
              >
                <Play size={28} fill="currentColor" strokeWidth={1.5} />
              </button>
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              {content.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl font-bold text-slate-900">{content.title}</h1>
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                <User size={16} strokeWidth={1.5} />
              </span>
              <span>{content.authorName}</span>
              <span>平台精选</span>
              <span>阅读 {((content.likeCount + content.collectCount) * 3).toLocaleString()}</span>
            </div>

            {notice && (
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
                <CheckCircle size={18} strokeWidth={1.5} />
                {notice}
              </div>
            )}

            <div className="mt-8 space-y-5 text-base leading-8 text-slate-700">
              {content.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
              <button
                onClick={() => setLiked((value) => !value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition-colors',
                  liked ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                )}
              >
                <Heart size={18} className={liked ? 'fill-current' : ''} strokeWidth={1.5} />
                {liked ? content.likeCount + 1 : content.likeCount}
              </button>
              <button
                onClick={() => setCollected((value) => !value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition-colors',
                  collected ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                )}
              >
                <Bookmark size={18} className={collected ? 'fill-current' : ''} strokeWidth={1.5} />
                {collected ? '已收藏' : `收藏 ${content.collectCount}`}
              </button>
              <button
                onClick={() => setNotice('分享链接已生成，可复制给客户或家人查看')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-5 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                <Share2 size={18} strokeWidth={1.5} />
                分享
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
