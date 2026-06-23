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

      {/* AI智能识别摘要 */}
      {graphData?.distributions && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">🎨 空间风格分布</h3>
              <Link to="/inspiration" className="text-xs text-primary-700">查看详情 →</Link>
            </div>
            <div className="space-y-2.5">
              {Object.entries(graphData.distributions.styles || {}).slice(0, 6).map(([name, count], idx) => {
                const max = Math.max(...Object.values(graphData.distributions.styles || {}) as number[], 1);
                const pct = ((count as number) / max) * 100;
                const colors = ['bg-primary-500', 'bg-accent-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
                return (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20 truncate shrink-0">{name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[idx % 6]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count as number}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-gray-400">基于 {graphData.statistics?.totalDiaries || 0} 篇社区日记 AI 识别统计</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">🧱 材质元素热度</h3>
              <Link to="/inspiration" className="text-xs text-primary-700">查看详情 →</Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(graphData.distributions.materials || {}).slice(0, 14).map(([name, count]) => {
                const max = Math.max(...Object.values(graphData.distributions.materials || {}) as number[], 1);
                const size = 'text-xs';
                const weights = ['font-bold', 'font-semibold', 'font-medium', 'font-normal'];
                const wIdx = Math.min(3, Math.floor((1 - (count as number) / max) * 4));
                return (
                  <span key={name} className={`px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 ${size} ${weights[wIdx]} border border-amber-100`}>
                    {name} <span className="text-amber-500/60 ml-0.5">·{count as number}</span>
                  </span>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-amber-700">{graphData.statistics?.materialCount || 0}</p>
                  <p className="text-[10px] text-gray-500">识别材质</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-700">{graphData.statistics?.styleCount || 0}</p>
                  <p className="text-[10px] text-gray-500">风格分类</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-rose-700">{graphData.statistics?.brandCount || 0}</p>
                  <p className="text-[10px] text-gray-500">软装品牌</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">🏷️ 软装品牌识别</h3>
              <Link to="/inspiration" className="text-xs text-primary-700">查看详情 →</Link>
            </div>
            <div className="space-y-2">
              {Object.entries(graphData.distributions.brands || {}).slice(0, 6).map(([name, count]) => {
                const max = Math.max(...Object.values(graphData.distributions.brands || {}) as number[], 1);
                const pct = ((count as number) / max) * 100;
                return (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-xs font-bold text-rose-700 shrink-0">
                      {name.slice(0, 1)}
                    </div>
                    <span className="text-sm font-medium text-gray-800 truncate flex-1">{name}</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-gradient-to-r from-rose-400 to-purple-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-4 text-right">{count as number}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <p className="text-xs text-purple-700 font-medium">🤖 AI图像识别引擎</p>
              <p className="text-[11px] text-gray-500 mt-0.5">上传户型图/效果图，一键识别风格、材质、品牌</p>
              <Link to="/inspiration" className="mt-2 inline-block text-xs text-primary-700 font-medium">立即体验 →</Link>
            </div>
          </div>
        </section>
      )}

      {/* 精选日记 */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <h2 className="text-xl font-bold text-gray-900">🔥 最新装修日记</h2>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveStyle(null)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${activeStyle === null ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >全部</button>
              {DECORATION_STYLES.slice(0, 6).map(s => (
                <button
                  key={s}
                  onClick={() => setActiveStyle(s)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${activeStyle === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >{s}</button>
              ))}
            </div>
            <Link to="/diaries" className="text-sm text-primary-700 hover:text-primary-800 shrink-0">更多 →</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {diaries.slice(0, 8).map(diary => {
            const stageInfo = CONSTRUCTION_STAGE_LABELS[diary.constructionStage];
            const author = (typeof diary.userId === 'string' ? { username: '用户', avatar: '', nickname: '' } : diary.userId) as any;
            const currentStageIdx = STAGE_ORDER.indexOf(diary.constructionStage);
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
                  <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-700 transition-colors text-sm">
                    {diary.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>🏠 {HOUSE_TYPE_LABELS[diary.houseType] || diary.houseType} · {diary.houseArea}㎡</span>
                  </div>

                  {/* 施工进度条 */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                      <span>施工进度</span>
                      <span className="font-medium text-primary-700">{currentStageIdx + 1}/7 阶段</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
                        style={{ width: `${((currentStageIdx + 1) / 7) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 关键信息标签 */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {diary.floorPlan?.metadata && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">🗺️ 附户型图</span>
                    )}
                    {diary.floorPlan?.sketchupFile && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">📐 SketchUp</span>
                    )}
                    {diary.aiAnalysis && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">🤖 AI识别</span>
                    )}
                    {diary.budget?.items && diary.budget.items.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">
                        💰 {diary.budget.items.length}项预算
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-primary-700 font-bold text-sm">
                      {formatCurrency(diary.budget?.totalEstimated || 0)}
                    </span>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span>❤ {diary.likes?.length || diary.likesCount || 0}</span>
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
          <div>
            <h2 className="text-xl font-bold text-gray-900">⭐ 认证设计师推荐</h2>
            <p className="text-sm text-gray-500 mt-1">AI智能匹配 · 按户型相似度、预算区间、风格偏好排序</p>
          </div>
          <Link to="/designers" className="text-sm text-primary-700 hover:text-primary-800">查看全部 →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {designers.slice(0, 6).map(designer => {
            const cred = (designer as any).credentials || (designer as any).qualifications;
            const stats = designer.statistics || {} as any;
            const portfolio = designer.portfolio || [];
            return (
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
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {designer.serviceAreas?.slice(0, 3).join(' · ') || '全国服务'}
                  </p>
                  {(designer as any).serviceRadius && (
                    <p className="text-[11px] text-gray-400 mt-0.5">服务半径 {(designer as any).serviceRadius}km</p>
                  )}
                  <div className="flex items-center mt-2 space-x-1">
                    <span className="text-amber-500">★</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.rating || 4.8}</span>
                    <span className="text-xs text-gray-400">({stats.reviewCount || 12}评)</span>
                    <span className="text-xs text-gray-400 ml-2">·</span>
                    <span className="text-xs text-gray-400 ml-2">{stats.completedProjects || 28}项目</span>
                  </div>
                </div>
              </div>

              {/* 资质证明 */}
              {cred && (cred as any).certificationType && (
                <div className="mt-4 p-2.5 bg-blue-50/80 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">📜</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-800 truncate">{(cred as any).certificationType}</p>
                      {(cred as any).issuingAuthority && (
                        <p className="text-[10px] text-blue-500 truncate">颁证: {(cred as any).issuingAuthority}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p className="mt-4 text-sm text-gray-600 line-clamp-2">{designer.bio || '专业室内设计师，擅长多种风格，注重细节与品质。'}</p>

              {/* 作品集摘要 */}
              {portfolio.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">代表作品</p>
                  <div className="space-y-1.5">
                    {portfolio.slice(0, 2).map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate flex-1">{p.title}</span>
                        <span className="text-gray-400 ml-2 shrink-0">{p.houseArea || '-'}㎡</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {Array.from(new Set(
                  (portfolio.slice(0, 3).map((p: any) => p.style) || ['现代简约', '北欧风格']).filter(Boolean)
                )).map((style: string) => (
                  <span key={style} className="badge bg-gray-100 text-gray-600">{style}</span>
                ))}
                <span className="badge bg-primary-50 text-primary-700">{stats.completedProjects || 28}个项目</span>
              </div>
            </Link>
            );
          })}
        </div>
      </section>

      {/* 平台保障 */}
      <section className="mt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">🛡️ 平台全程保障</h2>
          <p className="text-gray-500 mt-2">定金托管 · 分阶段付款 · 内容安全审核 · 专业资质认证</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card p-6 text-center hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-2xl">
              💰
            </div>
            <h3 className="font-bold text-gray-900 mb-2">定金第三方托管</h3>
            <p className="text-sm text-gray-500 mb-3">定金由平台监管账户托管，项目启动后按阶段释放，资金安全有保障</p>
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
              100% 资金托管
            </div>
          </div>

          <div className="card p-6 text-center hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-2xl">
              📋
            </div>
            <h3 className="font-bold text-gray-900 mb-2">7阶段分期付款</h3>
            <p className="text-sm text-gray-500 mb-3">拆改→水电→泥木→油漆→安装→验收，业主确认后释放对应阶段款项</p>
            <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full inline-block">
              验收满意再付款
            </div>
          </div>

          <div className="card p-6 text-center hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-2xl">
              ✍️
            </div>
            <h3 className="font-bold text-gray-900 mb-2">电子签名验收</h3>
            <p className="text-sm text-gray-500 mb-3">验收报告支持电子签名，影像资料存档，全程留痕可追溯</p>
            <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full inline-block">
              具法律效力
            </div>
          </div>

          <div className="card p-6 text-center hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center text-2xl">
              🔍
            </div>
            <h3 className="font-bold text-gray-900 mb-2">内容安全审核</h3>
            <p className="text-sm text-gray-500 mb-3">装修术语过滤器屏蔽非标报价，违规举报溯源关联用户ID与时间</p>
            <div className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full inline-block">
              社区专业可信
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          <div className="card p-5 bg-gradient-to-br from-blue-50 to-transparent">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">📊 交易数据</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-blue-700">2,847</p>
                <p className="text-xs text-gray-500">完成交易</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-700">98.6%</p>
                <p className="text-xs text-gray-500">满意度</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-700">¥3.2亿</p>
                <p className="text-xs text-gray-500">托管资金</p>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-gradient-to-br from-emerald-50 to-transparent">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">🏛️ 设计师认证</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                <span>资质证书人工审核认证</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                <span>作品集真实案例验证</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                <span>服务半径与服务区域公示</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                <span>真实业主评价系统</span>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-gradient-to-br from-rose-50 to-transparent">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">🚨 举报溯源机制</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-rose-500">•</span>
                <span>违规内容一键举报，关联用户ID与发布时间</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-500">•</span>
                <span>内容快照存档，篡改可追溯</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-500">•</span>
                <span>非标报价话术自动识别拦截</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-500">•</span>
                <span>24小时人工审核处理</span>
              </div>
            </div>
          </div>
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
