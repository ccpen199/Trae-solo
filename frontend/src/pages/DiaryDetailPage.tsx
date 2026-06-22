import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { diaryApi, designerApi, moderationApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Diary, DesignerMatch, User, Comment, FilterResult } from '../types';
import { CONSTRUCTION_STAGE_LABELS, HOUSE_TYPE_LABELS, STAGE_ORDER, formatCurrency, formatDate, getInitials } from '../utils/constants';

export default function DiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [matchedDesigners, setMatchedDesigners] = useState<DesignerMatch[]>([]);
  const [showDesigners, setShowDesigners] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('inappropriate');
  const [reportDesc, setReportDesc] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchDiary = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await diaryApi.getById(id);
      if (res?.success) {
        setDiary(res.data);
        setLikeCount(res.data.likes?.length || 0);
        setLiked(res.data.likes?.includes(user?._id) || false);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDiary(); }, [id]);

  const handleLike = async () => {
    if (!id) return;
    try {
      const res: any = await diaryApi.toggleLike(id);
      if (res?.success) {
        setLiked(res.data.liked);
        setLikeCount(res.data.likeCount);
      }
    } catch (e) { alert('操作失败'); }
  };

  const handleCommentCheck = async () => {
    if (!comment.trim()) return;
    try {
      const res: any = await moderationApi.checkContent(comment, 'comment');
      setFilterResult(res.data);
      if (!res.data.passed && res.data.action === 'blocked') {
        return;
      }
    } catch (_) { /* ignore */ }
  };

  const submitComment = async () => {
    if (!id) return;
    const contentToSend = (filterResult?.passed === false && filterResult?.filteredContent) ? filterResult.filteredContent : comment;
    try {
      const res: any = await diaryApi.addComment(id, contentToSend);
      if (res?.success) {
        setComment('');
        setFilterResult(null);
        fetchDiary();
      }
    } catch (e: any) { alert(e.message); }
  };

  const loadMatchedDesigners = async () => {
    if (!id) return;
    try {
      const res: any = await designerApi.matchForDiary(id);
      if (res?.success) {
        setMatchedDesigners(res.data.matches || []);
        setShowDesigners(true);
      }
    } catch (e) { alert('匹配失败'); }
  };

  const submitReport = async () => {
    if (!diary || !reportDesc.trim()) { alert('请填写举报原因'); return; }
    try {
      const formData = new FormData();
      formData.append('targetType', 'diary');
      formData.append('targetId', diary._id);
      formData.append('targetUserId', typeof diary.userId === 'string' ? diary.userId : diary.userId._id);
      formData.append('reportType', reportType);
      formData.append('description', reportDesc);
      await moderationApi.submitReport(formData);
      alert('举报已提交');
      setShowReport(false);
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">加载中...</div>;
  if (!diary) return <div className="text-center py-20 text-gray-500">日记不存在</div>;

  const author = typeof diary.userId === 'string' ? { _id: '', username: '用户', avatar: '', nickname: '', role: 'homeowner' as const } : diary.userId as User;
  const isOwner = token && author._id === user?._id;
  const stageInfo = CONSTRUCTION_STAGE_LABELS[diary.constructionStage];
  const currentStageIdx = STAGE_ORDER.indexOf(diary.constructionStage);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="card overflow-hidden">
          {diary.images?.length > 0 && (
            <div className="grid grid-cols-6 grid-rows-2 gap-1">
              <div className="col-span-4 row-span-2 aspect-[4/3] bg-gray-100 overflow-hidden">
                <img src={diary.coverImage || diary.images[0]} className="w-full h-full object-cover" alt="" />
              </div>
              {diary.images.slice(1, 6).map((img, i) => (
                <div key={i} className="aspect-square bg-gray-100 overflow-hidden">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${stageInfo.bg} ${stageInfo.color}`}>{stageInfo.label}</span>
                  {HOUSE_TYPE_LABELS[diary.houseType] && <span className="badge bg-gray-100 text-gray-700">{HOUSE_TYPE_LABELS[diary.houseType]} · {diary.houseArea}㎡</span>}
                  {diary.address?.city && <span className="badge bg-blue-50 text-blue-700">📍 {diary.address.city}</span>}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{diary.title}</h1>
              </div>
              <div className="flex space-x-2">
                {isOwner && <Link to={`/transactions/create?diaryId=${diary._id}`} className="btn-accent !py-2 text-sm">发起交易</Link>}
                <button onClick={() => setShowReport(true)} className="btn-ghost !py-2 text-sm text-gray-500">🚩 举报</button>
              </div>
            </div>

            <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
              <Link to={author._id ? `/designers/${author._id}` : '#'}>
                {author.avatar ? <img src={author.avatar} className="w-11 h-11 rounded-full object-cover" /> :
                  <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">{getInitials(author.nickname || author.username)}</div>}
              </Link>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{author.nickname || author.username}</p>
                <p className="text-xs text-gray-500">发布于 {formatDate(diary.createdAt)} · {diary.views} 次浏览</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">📝 装修记录</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{diary.description}</p>
            </div>

            {diary.floorPlan?.image && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">🗺️ 户型图</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <img src={diary.floorPlan.image} className="w-full" alt="户型图" />
                </div>
                {diary.floorPlan.metadata && (
                  <div className="grid grid-cols-4 gap-3 mt-3 text-center">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">建筑面积</p>
                      <p className="font-bold">{diary.floorPlan.metadata.area}㎡</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">卧室</p>
                      <p className="font-bold">{diary.floorPlan.metadata.rooms}间</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">卫生间</p>
                      <p className="font-bold">{diary.floorPlan.metadata.bathrooms}间</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">楼层</p>
                      <p className="font-bold">{diary.floorPlan.metadata.floors}层</p>
                    </div>
                  </div>
                )}
                {diary.floorPlan.sketchupFile && (
                  <a href={diary.floorPlan.sketchupFile} download className="mt-3 inline-flex btn-outline text-sm">
                    📥 下载 SketchUp 源文件
                  </a>
                )}
              </div>
            )}

            {diary.aiAnalysis && (
              <div className="mt-6 p-5 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">🤖 AI 智能识别</h3>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">分析于 {formatDate(diary.aiAnalysis.analyzedAt)}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">空间风格</p>
                    <p className="font-bold text-purple-900">{diary.aiAnalysis.style?.primary}</p>
                    <p className="text-xs text-gray-500 mt-1">置信度 {((diary.aiAnalysis.style?.confidence || 0) * 100).toFixed(0)}%</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {diary.aiAnalysis.style?.secondary?.map(s => <span key={s} className="text-[10px] badge bg-white border border-purple-200 text-purple-700">{s}</span>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">材质元素</p>
                    <div className="space-y-1.5">
                      {diary.aiAnalysis.materials?.slice(0, 5).map((m, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-800">{m.name} <span className="text-gray-400">· {m.location}</span></span>
                          <span className="text-purple-600">{(m.confidence * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">识别品牌</p>
                    <div className="space-y-1.5">
                      {diary.aiAnalysis.brands?.length ? diary.aiAnalysis.brands.map((b, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-medium text-gray-900">{b.name}</span>
                          <span className="text-gray-500"> · {b.product}</span>
                        </div>
                      )) : <p className="text-xs text-gray-400">暂未识别到品牌</p>}
                    </div>
                    {diary.aiAnalysis.colors && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">配色方案</p>
                        <div className="flex gap-1">
                          {diary.aiAnalysis.colors.map((c, i) => (
                            <div key={i} className="w-7 h-7 rounded-lg border border-white shadow" style={{ background: c }} title={c} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {diary.styleTags?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">🏷️ 标签</h3>
                <div className="flex flex-wrap gap-2">
                  {diary.styleTags.map(s => <span key={s} className="badge bg-primary-50 text-primary-700">#{s}</span>)}
                  {diary.materialTags.map(m => <span key={m} className="badge bg-amber-50 text-amber-700">🎨 {m}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">📊 施工进度</h3>
          <div className="space-y-4">
            {STAGE_ORDER.map((stage, idx) => {
              const info = CONSTRUCTION_STAGE_LABELS[stage];
              const done = idx < currentStageIdx;
              const active = idx === currentStageIdx;
              const history = diary.stageHistory?.find(h => h.stage === stage);
              return (
                <div key={stage} className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${done ? 'bg-accent-100 text-accent-700' : active ? `bg-primary-100 text-primary-700 ring-4 ring-primary-50` : 'bg-gray-100 text-gray-400'}`}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold ${active ? 'text-primary-700' : done ? 'text-gray-900' : 'text-gray-400'}`}>{info.label}</p>
                      {history && <span className="text-xs text-gray-500">{formatDate(history.startedAt, 'MM-DD')}</span>}
                    </div>
                    {active && <p className="text-xs text-primary-600 mt-0.5 animate-pulse">● 当前阶段进行中</p>}
                    {history?.description && <p className="text-xs text-gray-500 mt-1">{history.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">💰 预算跟踪</h3>
            <div className="text-right">
              <p className="text-sm text-gray-500">总预算 <span className="font-bold text-gray-900">{formatCurrency(diary.budget?.totalEstimated || 0)}</span></p>
              <p className="text-sm text-gray-500">已支出 <span className="font-bold text-accent-700">{formatCurrency(diary.budget?.totalActual || 0)}</span></p>
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-accent-500 to-accent-700 rounded-full transition-all" style={{ width: `${diary.budgetProgress || 0}%` }} />
          </div>
          {diary.budget?.items?.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {diary.budget.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500">{item.category}{item.subCategory ? ` · ${item.subCategory}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">预算 {formatCurrency(item.estimatedAmount)}</p>
                    {item.actualAmount && <p className="text-sm font-semibold text-accent-700">实付 {formatCurrency(item.actualAmount)}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-gray-400 py-6 text-sm">暂无预算记录</p>}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">💬 评论 ({diary.commentCount})</h3>
          {token ? (
            <div className="mb-6">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                onBlur={handleCommentCheck}
                className="input min-h-[80px]"
                placeholder="分享您的想法或经验..."
              />
              {filterResult && (filterResult.matchedWords.length > 0 || filterResult.matchedPatterns.length > 0) && (
                <div className={`mt-2 p-3 rounded-lg text-sm ${filterResult.riskLevel === 'high' ? 'bg-red-50 text-red-700 border border-red-100' : filterResult.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                  <p className="font-medium mb-1">⚠️ 内容安全检测：{filterResult.riskLevel === 'high' ? '禁止发布' : filterResult.riskLevel === 'medium' ? '敏感词处理' : '提示'}</p>
                  {filterResult.matchedWords.length > 0 && <p>命中敏感词: {filterResult.matchedWords.join('、')}</p>}
                  {filterResult.matchedPatterns.length > 0 && <p>可疑模式: {filterResult.matchedPatterns.join('、')}</p>}
                  <p className="mt-1">处理方式: {filterResult.action === 'blocked' ? '已拦截，无法发送' : filterResult.action === 'censored' ? '已自动屏蔽敏感词' : '已标记待审核'}</p>
                </div>
              )}
              <div className="mt-2 flex justify-end">
                <button onClick={submitComment} disabled={!comment.trim() || (filterResult?.action === 'blocked')} className="btn-primary">发表评论</button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-gray-500 text-sm">登录后可发表评论</p>
              <Link to="/auth/login" className="btn-primary mt-2 !py-1.5 text-sm">去登录</Link>
            </div>
          )}

          <div className="space-y-4">
            {(diary.comments || []).map((c: Comment, idx: number) => {
              const cu = typeof c.userId === 'string' ? { username: '用户', avatar: '', nickname: '' } : c.userId as User;
              return (
                <div key={idx} className="flex space-x-3">
                  {cu.avatar ? <img src={cu.avatar} className="w-9 h-9 rounded-full shrink-0" /> :
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0 text-sm">{getInitials(cu.nickname || cu.username)}</div>}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{cu.nickname || cu.username}</p>
                      <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              );
            })}
            {diary.comments?.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">暂无评论，来第一个分享吧！</p>}
          </div>
        </div>

        <div className="sticky bottom-4">
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={handleLike} className={`flex items-center space-x-1 ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors`}>
                <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
                <span className="text-sm">{likeCount}</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
                <span className="text-xl">💬</span>
                <span className="text-sm">{diary.commentCount}</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500">
                <span className="text-xl">🔗</span>
                <span className="text-sm">分享</span>
              </button>
            </div>
            <button onClick={loadMatchedDesigners} className="btn-accent">
              🎯 AI智能匹配设计师
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {!isOwner && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">👤 业主信息</h3>
            <div className="flex items-center space-x-3">
              {author.avatar ? <img src={author.avatar} className="w-14 h-14 rounded-xl object-cover" /> :
                <div className="w-14 h-14 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">{getInitials(author.nickname || author.username)}</div>}
              <div>
                <p className="font-semibold">{author.nickname || author.username}</p>
                <p className="text-xs text-gray-500">{author.role === 'designer' ? '设计师' : '业主'}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900 text-lg">{diary.views}</p>
                <p className="text-xs text-gray-500">浏览</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900 text-lg">{likeCount}</p>
                <p className="text-xs text-gray-500">点赞</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900 text-lg">{diary.commentCount}</p>
                <p className="text-xs text-gray-500">评论</p>
              </div>
            </div>
          </div>
        )}

        {showDesigners && matchedDesigners.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">🎯 匹配设计师</h3>
              <button onClick={() => setShowDesigners(false)} className="text-xs text-gray-500">关闭</button>
            </div>
            <div className="space-y-4">
              {matchedDesigners.map(match => {
                const d = match.designer;
                return (
                  <Link key={d._id} to={`/designers/${d._id}`} className="block p-4 border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {d.avatar ? <img src={d.avatar} className="w-9 h-9 rounded-full" /> :
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">{getInitials(d.nickname || d.username)}</div>}
                        <span className="font-semibold">{d.nickname || d.username}</span>
                      </div>
                      <span className="text-primary-700 font-bold">{match.matchScore}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ width: `${match.matchScore}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{match.matchDetails.slice(0, 2).join('；')}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">📋 快捷操作</h3>
          <div className="space-y-2">
            <Link to="/inspiration" className="block p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="font-medium text-sm">🎨 获取更多装修灵感</p>
            </Link>
            <Link to={`/designers?city=${diary.address?.city || ''}`} className="block p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="font-medium text-sm">🎨 浏览更多本地设计师</p>
            </Link>
          </div>
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">🚩 举报内容</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">举报类型</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)} className="input">
                  <option value="inappropriate">不当内容</option>
                  <option value="spam">垃圾广告</option>
                  <option value="fraud">欺诈信息</option>
                  <option value="copyright">侵权</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">详细说明</label>
                <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} className="input min-h-[100px]" placeholder="请详细描述举报原因..." />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setShowReport(false)} className="btn-outline">取消</button>
              <button onClick={submitReport} className="btn-primary">提交举报</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
