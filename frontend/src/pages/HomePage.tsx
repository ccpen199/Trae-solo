import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { diaryApi, designerApi, aiApi } from '../services/api';
import type { Diary, User } from '../types';
import { CONSTRUCTION_STAGE_LABELS, HOUSE_TYPE_LABELS, formatCurrency, fromNow, getInitials, STAGE_ORDER, DECORATION_STYLES } from '../utils/constants';

export default function HomePage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [designers, setDesigners] = useState<User[]>([]);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dRes, dsRes, gRes]: any = await Promise.allSettled([
          diaryApi.getList({ limit: 8, sort: 'latest', style: activeStyle || undefined }),
          designerApi.getList({ limit: 6 }),
          aiApi.getInspirationGraph({ limit: 100 })
        ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

        if (dRes?.success) setDiaries(dRes.data.diaries || []);
        if (dsRes?.success) setDesigners(dsRes.data.designers || []);
        if (gRes?.success) setGraphData(gRes.data);
      } catch (e) {
        // 开发环境：无后端时展示静态mock
        setDiaries(mockDiaries);
        setDesigners(mockDesigners);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeStyle]);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 p-8 sm:p-12 text-white">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="20" cy="20" r="20" fill="white" />
            <circle cx="80" cy="30" r="30" fill="white" />
          </svg>
        </div>
        <div className="relative max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            记录每一个细节
            <br />
            <span className="text-primary-200">打造您的梦想家</span>
          </h1>
          <p className="text-lg text-primary-100 mb-8 max-w-xl">
            发布装修日记 · 关联户型图与施工阶段 · AI智能识别风格材质
            <br />
            匹配优秀设计师 · 定金托管分阶段付款 · 全程交易安全保障
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/diaries/create" className="inline-flex items-center px-6 py-3 rounded-xl bg-white text-primary-800 font-semibold hover:bg-primary-50 transition-colors">
              ✨ 发布装修日记
            </Link>
            <Link to="/designers" className="inline-flex items-center px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 backdrop-blur transition-colors">
              🎨 寻找设计师
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-10 max-w-lg">
            <div>
              <p className="text-2xl sm:text-3xl font-bold">{diaries.length * 120}+</p>
              <p className="text-sm text-primary-200 mt-1">真实装修日记</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold">{designers.length * 45}+</p>
              <p className="text-sm text-primary-200 mt-1">认证设计师</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold">98%</p>
              <p className="text-sm text-primary-200 mt-1">业主满意度</p>
            </div>
          </div>
        </div>
      </section>

      {/* 施工阶段导航 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">📋 施工阶段浏览</h2>
          <Link to="/diaries" className="text-sm text-primary-700 hover:text-primary-800">查看全部 →</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {STAGE_ORDER.map(stage => {
            const info = CONSTRUCTION_STAGE_LABELS[stage];
            return (
              <Link
                key={stage}
                to={`/diaries?stage=${stage}`}
                className={`card p-4 text-center hover:-translate-y-0.5 transition-all ${info.bg} border-0`}
              >
                <p className="text-2xl mb-2">
                  {stage === 'planning' && '📐'}
                  {stage === 'demolition' && '🔨'}
                  {stage === 'plumbing_electrical' && '⚡'}
                  {stage === 'masonry_carpentry' && '🧱'}
                  {stage === 'painting' && '🎨'}
                  {stage === 'installation' && '🔧'}
                  {stage === 'acceptance' && '✅'}
                </p>
                <p className={`text-sm font-semibold ${info.color}`}>{info.label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 风格筛选 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">🎨 风格灵感</h2>
          <Link to="/inspiration" className="text-sm text-primary-700 hover:text-primary-800">进入灵感图谱 →</Link>
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveStyle(null)}
            className={`tag ${activeStyle === null ? 'tag-active' : ''}`}
          >全部</button>
          {DECORATION_STYLES.slice(0, 10).map(s => (
            <button
              key={s}
              onClick={() => setActiveStyle(s)}
              className={`tag ${activeStyle === s ? 'tag-active' : ''}`}
            >{s}</button>
          ))}
        </div>

        {graphData?.distributions && (
          <div className="card p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">📊 社区风格分布</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(graphData.distributions.styles || {}).slice(0, 6).map(([name, count]) => (
                <div key={name} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">{name}</p>
                  <p className="text-lg font-bold text-gray-900">{count as number}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 精选日记 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">🔥 最新装修日记</h2>
          <Link to="/diaries" className="text-sm text-primary-700 hover:text-primary-800">查看全部 →</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {diaries.slice(0, 8).map(diary => {
            const stageInfo = CONSTRUCTION_STAGE_LABELS[diary.constructionStage];
            const author = (typeof diary.userId === 'string' ? { username: '用户', avatar: '', nickname: '' } : diary.userId) as any;
            return (
              <Link key={diary._id} to={`/diaries/${diary._id}`} className="card group hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  <img
                    src={diary.coverImage || `https://picsum.photos/seed/${diary._id}/600/450`}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {stageInfo && <div className={`absolute top-3 left-3 badge ${stageInfo.bg} ${stageInfo.color}`}>
                    {stageInfo.label}
                  </div>}
                  <div className="absolute top-3 right-3 flex items-center space-x-1">
                    <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur">
                      👁 {diary.views || 0}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-700 transition-colors">
                    {diary.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                    <span>🏠 {HOUSE_TYPE_LABELS[diary.houseType] || diary.houseType} · {diary.houseArea}㎡</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <div className="flex items-center space-x-1.5">
                      {author.avatar ? (
                        <img src={author.avatar} className="w-5 h-5 rounded-full" alt="" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[10px] flex items-center justify-center font-semibold">
                          {getInitials(author.nickname || author.username)}
                        </div>
                      )}
                      <span className="text-gray-600">{author.nickname || author.username}</span>
                    </div>
                    <span className="text-gray-400">{fromNow(diary.createdAt)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-primary-700 font-semibold text-sm">
                      {formatCurrency(diary.budget?.totalEstimated || 0)}
                    </span>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span>❤ {diary.likes?.length || 0}</span>
                      <span>💬 {diary.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {diaries.length === 0 && (
          <div className="card p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">📝</p>
            <p>暂无装修日记，快来发布第一篇吧！</p>
            <Link to="/diaries/create" className="btn-primary mt-4">发布日记</Link>
          </div>
        )}
      </section>

      {/* 推荐设计师 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">⭐ 认证设计师推荐</h2>
          <Link to="/designers" className="text-sm text-primary-700 hover:text-primary-800">查看全部 →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {designers.slice(0, 6).map(designer => (
            <Link key={designer._id} to={`/designers/${designer._id}`} className="card p-5 hover:-translate-y-1 transition-all">
              <div className="flex items-start space-x-4">
                {designer.avatar ? (
                  <img src={designer.avatar} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-200 to-primary-400 text-primary-800 flex items-center justify-center text-2xl font-bold">
                    {getInitials(designer.nickname || designer.username)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 truncate">{designer.nickname || designer.username}</h3>
                    <span className="badge bg-accent-50 text-accent-700 text-[10px]">✓ 认证</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {designer.serviceAreas?.slice(0, 3).join(' · ') || '全国服务'}
                  </p>
                  <div className="flex items-center mt-2 space-x-1">
                    <span className="text-amber-500">★</span>
                    <span className="text-sm font-semibold text-gray-900">{designer.statistics?.rating || 4.8}</span>
                    <span className="text-xs text-gray-400">({designer.statistics?.reviewCount || 12}条评价)</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 line-clamp-2">{designer.bio || '专业室内设计师，擅长多种风格，注重细节与品质。'}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(designer.portfolio?.slice(0, 2).map(p => p.style) || ['现代简约', '北欧风格']).filter(Boolean).map(style => (
                  <span key={style} className="badge bg-gray-100 text-gray-600">{style}</span>
                ))}
                <span className="badge bg-primary-50 text-primary-700">{designer.statistics?.completedProjects || 28}个项目</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

const mockDiaries: Diary[] = [
  {
    _id: 'demo1', userId: { _id: 'u1', username: '阳光暖暖', avatar: '', nickname: '' } as any,
    title: '120㎡北欧风三居室改造全记录', description: '', coverImage: '',
    images: [], houseType: 'apartment', houseArea: 120,
    constructionStage: 'masonry_carpentry', stageHistory: [],
    budget: { totalEstimated: 280000, items: [] },
    styleTags: ['北欧风格', '现代简约'], materialTags: ['木饰面', '乳胶漆'],
    likes: ['1', '2', '3'], commentCount: 24, comments: [], views: 1256, shares: 0,
    isPublished: true, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: ''
  },
  {
    _id: 'demo2', userId: { _id: 'u2', username: '山间清风', avatar: '', nickname: '' } as any,
    title: '新中式联排别墅装修流水账', description: '', coverImage: '',
    images: [], houseType: 'townhouse', houseArea: 260,
    constructionStage: 'plumbing_electrical', stageHistory: [],
    budget: { totalEstimated: 980000, items: [] },
    styleTags: ['新中式'], materialTags: ['岩板', '实木地板'],
    likes: ['1'], commentCount: 15, comments: [], views: 2380, shares: 0,
    isPublished: true, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: ''
  },
  {
    _id: 'demo3', userId: { _id: 'u3', username: '小小云朵', avatar: '', nickname: '' } as any,
    title: '60㎡小户型爆改两居室，收纳控的天堂', description: '', coverImage: '',
    images: [], houseType: 'apartment', houseArea: 60,
    constructionStage: 'painting', stageHistory: [],
    budget: { totalEstimated: 150000, items: [] },
    styleTags: ['日式极简', '北欧风格'], materialTags: ['复合地板'],
    likes: [], commentCount: 8, comments: [], views: 890, shares: 0,
    isPublished: true, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: ''
  },
  {
    _id: 'demo4', userId: { _id: 'u4', username: '柠檬不萌', avatar: '', nickname: '' } as any,
    title: '轻奢180㎡大平层，岩板背景墙真香', description: '', coverImage: '',
    images: [], houseType: 'apartment', houseArea: 180,
    constructionStage: 'installation', stageHistory: [],
    budget: { totalEstimated: 680000, items: [] },
    styleTags: ['轻奢风格', '现代简约'], materialTags: ['岩板', '大理石'],
    likes: ['1', '2'], commentCount: 42, comments: [], views: 3420, shares: 0,
    isPublished: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: ''
  }
];

const mockDesigners: User[] = [
  {
    _id: 'd1', username: 'designer_li', email: '', phone: '', role: 'designer',
    designerStatus: 'approved', avatar: '', nickname: '李 · 空间美学',
    bio: '10年室内设计经验，擅长现代简约、轻奢、新中式风格。注重空间动线与收纳设计，让设计服务于生活。',
    serviceAreas: ['北京市', '上海市', '深圳市', '广州市'],
    statistics: { completedProjects: 156, rating: 4.9, reviewCount: 128 },
    portfolio: [{ title: '', description: '', images: [], style: '现代简约' }, { title: '', description: '', images: [], style: '轻奢风格' }],
    createdAt: '', updatedAt: ''
  },
  {
    _id: 'd2', username: 'designer_wang', email: '', phone: '', role: 'designer',
    designerStatus: 'approved', avatar: '', nickname: '王工工作室',
    bio: '国家注册高级室内建筑师，专注别墅大宅设计。',
    serviceAreas: ['上海市', '杭州市', '苏州市'],
    statistics: { completedProjects: 89, rating: 4.8, reviewCount: 76 },
    portfolio: [{ title: '', description: '', images: [], style: '新中式' }, { title: '', description: '', images: [], style: '美式风格' }],
    createdAt: '', updatedAt: ''
  },
  {
    _id: 'd3', username: 'designer_zhang', email: '', phone: '', role: 'designer',
    designerStatus: 'approved', avatar: '', nickname: 'Zhang · 北欧研究所',
    bio: '专注北欧、日式极简风格，擅长小户型空间利用。',
    serviceAreas: ['成都市', '重庆市', '西安市'],
    statistics: { completedProjects: 203, rating: 4.95, reviewCount: 187 },
    portfolio: [{ title: '', description: '', images: [], style: '北欧风格' }, { title: '', description: '', images: [], style: '日式极简' }],
    createdAt: '', updatedAt: ''
  }
];
