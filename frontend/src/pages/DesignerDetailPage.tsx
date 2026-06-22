import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { designerApi, diaryApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { User, Diary } from '../types';
import { HOUSE_TYPE_LABELS, formatCurrency, formatDate, getInitials, CONSTRUCTION_STAGE_LABELS } from '../utils/constants';

export default function DesignerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [designer, setDesigner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState('');
  const [myDiaries, setMyDiaries] = useState<Diary[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res: any = await designerApi.getById(id);
        if (res?.success) setDesigner(res.data);
        if (token) {
          const dRes: any = await diaryApi.getMine();
          if (dRes?.success) setMyDiaries(dRes.data || []);
        }
      } finally { setLoading(false); }
    };
    fetchData();
  }, [id, token]);

  const submitReview = async () => {
    if (!id) return;
    try {
      await designerApi.review(id, reviewRating, reviewText);
      alert('评价成功');
      setShowReview(false);
    } catch (e: any) { alert(e.message); }
  };

  const matchForDiary = async () => {
    if (!selectedDiary) { alert('请选择装修日记'); return; }
    navigate(`/diaries/${selectedDiary}`);
  };

  const startTransaction = () => {
    if (!myDiaries.length) { alert('请先创建装修日记'); navigate('/diaries/create'); return; }
    setShowMatch(true);
  };

  if (loading) return <div className="text-center py-20 text-gray-500">加载中...</div>;
  if (!designer) return <div className="text-center py-20 text-gray-500">设计师不存在</div>;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="shrink-0">
            {designer.avatar ? <img src={designer.avatar} className="w-28 h-28 rounded-3xl object-cover shadow-lg" /> :
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-200 to-primary-500 text-white flex items-center justify-center text-4xl font-bold shadow-lg">{getInitials(designer.nickname || designer.username)}</div>}
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{designer.nickname || designer.username}</h1>
              {designer.designerStatus === 'approved' && <span className="badge bg-accent-100 text-accent-700">✓ 平台认证设计师</span>}
              <div className="flex items-center ml-auto space-x-1 bg-amber-50 px-3 py-1.5 rounded-full">
                <span className="text-amber-500 text-lg">★</span>
                <span className="font-bold text-amber-700">{designer.statistics?.rating || 4.8}</span>
                <span className="text-xs text-amber-600">({designer.statistics?.reviewCount || 0}条评价)</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>📍 {designer.serviceAreas?.join('、') || '全国服务'}</span>
              <span>🏆 {designer.statistics?.completedProjects || 0} 个完成项目</span>
            </div>
            <p className="mt-4 text-gray-700 leading-relaxed">{designer.bio || '这位设计师很神秘，还没有填写个人简介'}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={startTransaction} className="btn-accent">🤝 发起合作</button>
              {user?._id !== id && token && <button onClick={() => setShowReview(true)} className="btn-outline">⭐ 提交评价</button>}
              {designer.qualifications?.licenseNumber && <span className="badge bg-blue-50 text-blue-700">📜 资质编号: {designer.qualifications.licenseNumber}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold text-primary-700">{designer.statistics?.completedProjects || 0}</p>
          <p className="text-sm text-gray-500 mt-1">完成项目</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold text-accent-700">{designer.statistics?.rating || 4.8}</p>
          <p className="text-sm text-gray-500 mt-1">平均评分</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold text-amber-600">{designer.statistics?.reviewCount || 0}</p>
          <p className="text-sm text-gray-500 mt-1">业主评价</p>
        </div>
      </div>

      {designer.portfolio && designer.portfolio.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">🎨 作品集</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(designer.portfolio || []).map((p, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-card transition-shadow">
                <div className="grid grid-cols-3 gap-0.5 aspect-[3/2] bg-gray-100">
                  {p.images.length > 0 ? p.images.slice(0, 3).map((img, j) => (
                    <img key={j} src={img} className={`w-full h-full object-cover ${j === 0 ? 'col-span-2 row-span-2 aspect-[2/2]' : 'aspect-square'}`} />
                  )) : Array(3).fill(0).map((_, j) => <div key={j} className={`bg-gray-100 ${j === 0 ? 'col-span-2 row-span-2' : ''} flex items-center justify-center text-gray-300`}>暂无图片</div>)}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <div className="flex items-center gap-2">
                      {p.style && <span className="badge bg-primary-50 text-primary-700 text-[10px]">{p.style}</span>}
                      {p.budgetRange && <span className="badge bg-amber-50 text-amber-700 text-[10px]">{formatCurrency(p.budgetRange.min)} - {formatCurrency(p.budgetRange.max)}</span>}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {designer.qualifications?.certificationImages && designer.qualifications.certificationImages.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📜 资质证明</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {designer.qualifications.certificationImages.map((img: string, i: number) => (
              <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden border border-gray-200">
                <img src={img} className="w-full h-full object-cover" alt="" />
              </div>
            ))}
          </div>
          {designer.qualifications.verifiedAt && <p className="mt-3 text-xs text-gray-500">✓ 平台审核于 {formatDate(designer.qualifications.verifiedAt, 'YYYY-MM-DD')}</p>}
        </div>
      )}

      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReview(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">⭐ 评价设计师</h3>
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">评分</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)} className={`text-3xl transition-colors ${n <= reviewRating ? 'text-amber-400' : 'text-gray-300'}`}>★</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">评价内容</p>
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} className="input min-h-[100px]" placeholder="请分享您的合作体验..." />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setShowReview(false)} className="btn-outline">取消</button>
              <button onClick={submitReview} className="btn-primary">提交评价</button>
            </div>
          </div>
        </div>
      )}

      {showMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMatch(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">🤝 发起合作</h3>
            {myDiaries.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">您还没有装修日记，请先创建</p>
                <button onClick={() => navigate('/diaries/create')} className="btn-primary">创建装修日记</button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">选择装修日记</p>
                  <select value={selectedDiary} onChange={e => setSelectedDiary(e.target.value)} className="input">
                    <option value="">请选择...</option>
                    {myDiaries.map(d => (
                      <option key={d._id} value={d._id}>{d.title} ({HOUSE_TYPE_LABELS[d.houseType]} · {d.houseArea}㎡ · {formatCurrency(d.budget?.totalEstimated || 0)})</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setShowMatch(false)} className="btn-outline">取消</button>
                  <button onClick={() => {
                    if (!selectedDiary) { alert('请选择装修日记'); return; }
                    navigate(`/transactions?create=1&diaryId=${selectedDiary}&designerId=${designer._id}`);
                  }} className="btn-accent">创建交易订单</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
