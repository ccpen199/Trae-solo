import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { transactionApi, designerApi, diaryApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Transaction, User, Diary } from '../types';
import { TRANSACTION_STATUS_LABELS, formatCurrency, formatDate, getInitials } from '../utils/constants';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === '1');
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [designer, setDesigner] = useState<User | null>(null);

  const [createForm, setCreateForm] = useState({
    diaryId: searchParams.get('diaryId') || '',
    designerId: searchParams.get('designerId') || '',
    totalAmount: 200000,
    depositPercentage: 20,
    projectName: ''
  });

  useEffect(() => {
    const init = async () => {
      if (!token) { navigate('/auth/login'); return; }
      await fetchTransactions();
      if (showCreateModal) {
        try {
          const [dRes, desRes]: any = await Promise.all([
            diaryApi.getMine(),
            createForm.designerId ? designerApi.getById(createForm.designerId) : Promise.resolve({ data: null })
          ]);
          if (dRes?.success) setDiaries(dRes.data || []);
          if (desRes?.success) setDesigner(desRes.data);
        } catch (_) { /* ignore */ }
      }
    };
    init();
  }, [statusFilter, token]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res: any = await transactionApi.getList({ status: statusFilter });
      if (res?.success) setTransactions(res.data.transactions || []);
    } catch (_) { /* ignore */ }
    finally { setLoading(false); }
  };

  const createTransaction = async () => {
    if (!createForm.diaryId) { alert('请选择装修日记'); return; }
    if (!createForm.designerId) { alert('请选择设计师'); return; }
    try {
      const selectedDiary = diaries.find(d => d._id === createForm.diaryId);
      const res: any = await transactionApi.create({
        ...createForm,
        projectName: createForm.projectName || selectedDiary?.title || '装修项目'
      });
      if (res?.success) {
        alert('交易创建成功，请支付定金');
        setShowCreateModal(false);
        navigate(`/transactions/${res.data._id}`);
      }
    } catch (e: any) { alert(e.message); }
  };

  const stats = {
    total: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    inProgress: transactions.filter(t => ['deposit_paid', 'in_progress', 'stage_completed'].includes(t.status)).length,
    completed: transactions.filter(t => t.status === 'completed').length,
    disputed: transactions.filter(t => t.status === 'disputed').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 我的交易</h1>
          <p className="text-gray-500 text-sm mt-1">定金托管 · 分阶段付款 · 全程保障</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-accent">+ 发起新交易</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4"><p className="text-xs text-gray-500">全部</p><p className="text-2xl font-bold mt-1">{stats.total}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-500">待付定金</p><p className="text-2xl font-bold mt-1 text-gray-700">{stats.pending}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-500">进行中</p><p className="text-2xl font-bold mt-1 text-primary-700">{stats.inProgress}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-500">已完成</p><p className="text-2xl font-bold mt-1 text-accent-700">{stats.completed}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-500">争议中</p><p className="text-2xl font-bold mt-1 text-red-600">{stats.disputed}</p></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: '', label: '全部' },
          { key: 'pending', label: '待支付定金' },
          { key: 'deposit_paid', label: '定金已付' },
          { key: 'in_progress', label: '施工中' },
          { key: 'completed', label: '已完成' },
          { key: 'disputed', label: '争议中' }
        ].map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`tag ${statusFilter === f.key ? 'tag-active' : ''}`}>{f.label}</button>
        ))}
      </div>

      {loading ? <div className="card p-12 text-center text-gray-500">加载中...</div> : transactions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-gray-500 mb-4">暂无交易记录</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">发起第一笔交易</button>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map(t => {
            const homeowner = typeof t.homeownerId === 'string' ? { _id: t.homeownerId, username: '业主', avatar: '', nickname: '' } as User : t.homeownerId as User;
            const des = typeof t.designerId === 'string' ? { _id: t.designerId, username: '设计师', avatar: '', nickname: '' } as User : t.designerId as User;
            const diary = typeof t.diaryId === 'string' ? { title: '装修项目', coverImage: '' } as Diary : t.diaryId as Diary;
            const status = TRANSACTION_STATUS_LABELS[t.status];
            const isOwner = user?._id === homeowner._id;
            return (
              <Link to={`/transactions/${t._id}`} key={t._id} className="card p-5 hover:shadow-lg transition-all block">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{t.projectName || diary.title}</h3>
                      <span className={`badge ${status.bg} ${status.color} shrink-0`}>{status.label}</span>
                    </div>
                    {diary.coverImage && <img src={diary.coverImage} className="w-20 h-14 rounded-lg object-cover float-left mr-3 mb-2" />}
                    <div className="text-sm text-gray-500 space-y-1 clear-none">
                      <p className="flex items-center gap-2">
                        <span>业主:</span>
                        {homeowner.avatar ? <img src={homeowner.avatar} className="w-5 h-5 rounded-full" /> : <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">{getInitials(homeowner.nickname || homeowner.username)}</span>}
                        <span>{homeowner.nickname || homeowner.username}</span>
                        {isOwner && <span className="badge bg-blue-50 text-blue-700">我</span>}
                      </p>
                      <p className="flex items-center gap-2">
                        <span>设计师:</span>
                        {des.avatar ? <img src={des.avatar} className="w-5 h-5 rounded-full" /> : <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] flex items-center justify-center font-bold">{getInitials(des.nickname || des.username)}</span>}
                        <span>{des.nickname || des.username}</span>
                        {!isOwner && user?._id === des._id && <span className="badge bg-purple-50 text-purple-700">我</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">合同金额</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(t.totalAmount)}</p>
                    <p className="text-xs text-gray-500 mt-2">定金: {formatCurrency(t.depositAmount)}</p>
                    <p className="text-xs text-gray-400 mt-3">创建于 {formatDate(t.createdAt, 'YYYY-MM-DD')}</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-7 gap-1">
                    {t.stages.map((stage, idx) => (
                      <div key={idx} className="text-center">
                        <div className={`w-full h-2 rounded-full mb-1.5 ${stage.status === 'released' ? 'bg-accent-500' : stage.status === 'held' ? 'bg-amber-500 animate-pulse' : 'bg-gray-200'}`} />
                        <p className="text-[10px] text-gray-500 line-clamp-1">{stage.stageName}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      进度: {t.stages.filter(s => s.status === 'released').length}/{t.stages.length} 阶段已完成
                    </span>
                    <span className="font-semibold text-primary-700">查看详情 →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-5">🤝 发起装修交易</h3>
            <div className="space-y-4">
              {designer && (
                <div className="p-4 bg-purple-50 rounded-xl flex items-center gap-3">
                  {designer.avatar ? <img src={designer.avatar} className="w-12 h-12 rounded-xl" /> : <div className="w-12 h-12 rounded-xl bg-purple-200 flex items-center justify-center font-bold text-purple-800">{getInitials(designer.nickname || designer.username)}</div>}
                  <div>
                    <p className="font-semibold">{designer.nickname || designer.username}</p>
                    <p className="text-xs text-purple-600">已选择此设计师</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">选择装修日记 *</label>
                <select value={createForm.diaryId} onChange={e => setCreateForm(p => ({ ...p, diaryId: e.target.value }))} className="input">
                  <option value="">请选择装修日记...</option>
                  {diaries.map(d => <option key={d._id} value={d._id}>{d.title} ({d.houseArea}㎡ · {formatCurrency(d.budget?.totalEstimated || 0)})</option>)}
                </select>
                {diaries.length === 0 && <p className="text-xs text-amber-600 mt-1">暂无日记，<Link to="/diaries/create" className="underline">去创建</Link></p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">设计师ID</label>
                <input value={createForm.designerId} onChange={e => setCreateForm(p => ({ ...p, designerId: e.target.value }))} className="input" placeholder="从设计师页面发起会自动填充" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">项目名称</label>
                <input value={createForm.projectName} onChange={e => setCreateForm(p => ({ ...p, projectName: e.target.value }))} className="input" placeholder="不填则使用日记标题" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">合同总金额 (元) *</label>
                <input type="number" value={createForm.totalAmount} onChange={e => setCreateForm(p => ({ ...p, totalAmount: Number(e.target.value) }))} className="input text-lg font-semibold" min={0} step={1000} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">定金比例: {createForm.depositPercentage}%</label>
                <input type="range" min={10} max={40} value={createForm.depositPercentage} onChange={e => setCreateForm(p => ({ ...p, depositPercentage: Number(e.target.value) }))} className="w-full" />
                <p className="text-xs text-gray-500 mt-1">定金金额: <span className="font-semibold text-primary-700">{formatCurrency(Math.round(createForm.totalAmount * createForm.depositPercentage / 100))}</span> · 平台托管保障</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl text-xs text-amber-800 space-y-1">
                <p className="font-medium">🔒 平台交易保障</p>
                <p>• 定金由平台托管，项目启动后释放</p>
                <p>• 施工分 {7} 个阶段，业主验收通过后释放对应款项</p>
                <p>• 验收报告支持电子签名，全程留痕</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-outline">取消</button>
              <button onClick={createTransaction} className="btn-primary">创建交易订单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
