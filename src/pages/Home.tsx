import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, TrendingUp, ArrowRight, Flame, Clock, Inbox, AlertTriangle, RefreshCw } from 'lucide-react'
import CategoryNav from '@/components/CategoryNav'
import PostCard from '@/components/PostCard'
import { api } from '@/utils/api'
import { CATEGORIES } from '@/types'
import type { Post } from '@/types'
import { SkeletonCard, SkeletonList, EmptyState, ErrorState } from '@/components/StateFeedback'
import { useAppStore } from '@/stores/appStore'

export default function Home() {
  const [hotPosts, setHotPosts] = useState<Post[]>([])
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [loadingHot, setLoadingHot] = useState(true)
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [hotError, setHotError] = useState<string | null>(null)
  const [recentError, setRecentError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const location = useAppStore((s) => s.location)

  const fetchHot = useCallback(() => {
    setLoadingHot(true)
    setHotError(null)
    api.posts.list({
      status: 'approved',
      limit: 8,
      province: location.province || undefined,
      city: location.city || undefined,
    })
      .then((res) => setHotPosts(res.posts || []))
      .catch((err) => setHotError(err.message || '加载热门推荐失败'))
      .finally(() => setLoadingHot(false))
  }, [location.province, location.city])

  const fetchRecent = useCallback(() => {
    setLoadingRecent(true)
    setRecentError(null)
    api.posts.list({
      status: 'approved',
      limit: 6,
      page: 1,
      province: location.province || undefined,
      city: location.city || undefined,
    })
      .then((res) => setRecentPosts(res.posts || []))
      .catch((err) => setRecentError(err.message || '加载最新发布失败'))
      .finally(() => setLoadingRecent(false))
  }, [location.province, location.city])

  useEffect(() => {
    fetchHot()
    fetchRecent()
  }, [fetchHot, fetchRecent, retryKey])

  return (
    <div>
      <section className="relative bg-gradient-to-r from-navy-800 to-navy-600 text-white py-16 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full animate-pulse" />
        <div className="absolute top-20 right-20 w-24 h-24 bg-white/20 rounded-full animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-white/20 rounded-full animate-pulse [animation-delay:2s]" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl font-bold mb-4 text-balance">全国分类信息公共服务平台</h1>
          <p className="text-navy-200 text-lg mb-8">UGC+PGC混合治理 · 12大类目 · 地理围栏智能匹配</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/publish" className="btn-accent text-base px-6 py-2.5">发布信息</Link>
            <Link to="/voice-search" className="border-2 border-white text-white rounded-lg px-6 py-2.5 font-medium hover:bg-white/10 active:bg-white/20 transition-all duration-200 text-base">语音搜索</Link>
          </div>
        </div>
      </section>

      <div className="bg-accent-50 border-b border-accent-200 py-2 overflow-hidden">
        <div className="flex items-center gap-2 animate-marquee whitespace-nowrap">
          <Megaphone className="w-4 h-4 text-accent-500 shrink-0" />
          <span className="text-sm text-accent-700">
            平台公告：全面加强虚假信息治理，保障用户权益 &nbsp;|&nbsp; 新增语音搜索功能，说出需求即可精准匹配 &nbsp;|&nbsp; 商家认证体系升级，保证金托管更安全 &nbsp;&nbsp;&nbsp;&nbsp;
            平台公告：全面加强虚假信息治理，保障用户权益 &nbsp;|&nbsp; 新增语音搜索功能，说出需求即可精准匹配 &nbsp;|&nbsp; 商家认证体系升级，保证金托管更安全
          </span>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-navy-800" />
          <h2 className="text-xl font-bold text-slate-800">分类导航</h2>
          <span className="text-sm text-slate-400 ml-2">点击类目快速筛选信息</span>
        </div>
        <CategoryNav />
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent-500" />
            <h2 className="text-xl font-bold text-slate-800">热门推荐</h2>
          </div>
          <Link to="/list" className="flex items-center gap-1 text-sm text-navy-600 hover:text-navy-800">
            查看更多 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loadingHot ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : hotError ? (
          <ErrorState
            title="热门推荐加载失败"
            description={hotError}
            onRetry={() => setRetryKey(k => k + 1)}
          />
        ) : hotPosts.length === 0 ? (
          <EmptyState
            title="暂无热门推荐"
            description="当前地区还没有热门信息，试试切换地区或发布第一条信息"
            action={<Link to="/publish" className="btn-accent text-sm">发布信息</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {hotPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-navy-800" />
            <h2 className="text-xl font-bold text-slate-800">最新发布</h2>
            <span className="text-sm text-slate-400 ml-2">实时更新</span>
          </div>
          {loadingRecent ? (
            <SkeletonList count={6} />
          ) : recentError ? (
            <ErrorState
              title="最新发布加载失败"
              description={recentError}
              onRetry={() => setRetryKey(k => k + 1)}
            />
          ) : recentPosts.length === 0 ? (
            <EmptyState
              title="暂无最新发布"
              description="当前区域暂无信息，快来发布第一条吧"
              action={<Link to="/publish" className="btn-accent text-sm">立即发布</Link>}
            />
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {recentPosts.map((post) => {
                const cat = CATEGORIES.find((c) => c.key === post.category)
                return (
                  <Link
                    key={post.id}
                    to={`/list/${post.id}`}
                    className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className="badge shrink-0"
                        style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
                      >
                        {cat?.label}
                      </span>
                      <span className="text-sm text-slate-700 truncate">{post.title}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs text-slate-400 ml-4">
                      <span>{post.district}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-navy-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="font-bold mb-3">关于平台</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                全国分类信息公共服务平台，致力于构建安全、可信的分类信息生态，服务亿万用户生活需求。
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-3">快速链接</h3>
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <Link to="/publish" className="hover:text-white transition-colors">发布信息</Link>
                <Link to="/list" className="hover:text-white transition-colors">信息列表</Link>
                <Link to="/voice-search" className="hover:text-white transition-colors">语音搜索</Link>
                <Link to="/merchant" className="hover:text-white transition-colors">商家认证</Link>
                <Link to="/admin" className="hover:text-white transition-colors">管理后台</Link>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-3">联系方式</h3>
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <span>电话：400-888-0000</span>
                <span>邮箱：service@classified.gov.cn</span>
                <span>工作时间：周一至周日 9:00-21:00</span>
              </div>
            </div>
          </div>
          <div className="border-t border-navy-700 pt-4 text-center text-sm text-slate-500">
            © 2024 分类信息公共服务平台 · 构建可信分类信息生态
          </div>
        </div>
      </footer>
    </div>
  )
}
