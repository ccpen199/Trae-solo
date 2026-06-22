import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { transactionApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Transaction, User, Diary } from '../types';
import { TRANSACTION_STATUS_LABELS, formatCurrency, formatDate, getInitials, CONSTRUCTION_STAGE_LABELS } from '../utils/constants';

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [requestStage, setRequestStage] = useState<number | null>(null);
  const [requestDesc, setRequestDesc] = useState('');
  const [confirmStage, setConfirmStage] = useState<number | null>(null);
  const [confirmDesc, setConfirmDesc] = useState('');
  const [confirmRating, setConfirmRating] = useState(5);
  const [acceptanceImages, setAcceptanceImages] = useState<File[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDispute, setShowDispute] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await transactionApi.getById(id);
      if (res?.success) setTransaction(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const doAction = async (action: () => Promise<any>, key: string) => {
    setActionLoading(key);
    try {
      await action();
      await fetchData();
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(''); }
  };

  const payDeposit = () => doAction(async () => {
    const res: any = await transactionApi.payDeposit(id!);
    if (res?.success) alert(res.message);
  }, 'deposit');

  const submitStageRequest = () => doAction(async () => {
    if (requestStage === null) return;
    const res: any = await transactionApi.requestStage(id!, { stageIndex: requestStage, description: requestDesc });
    if (res?.success) { alert(res.message); setRequestStage(null); setRequestDesc(''); }
  }, 'request');

  const submitConfirmation = () => doAction(async () => {
    if (confirmStage === null) return;
    const formData = new FormData();
    formData.append('stageIndex', String(confirmStage));
    formData.append('description', confirmDesc);
    formData.append('rating', String(confirmRating));
    formData.append('signature', JSON.stringify({ homeownerSignature: signature, designerSignature: '' }));
    acceptanceImages.forEach(f => formData.append('acceptanceImages', f));
    const res: any = await transactionApi.confirmStage(id!, formData);
    if (res?.success) { alert(res.message); setConfirmStage(null); setConfirmDesc(''); setAcceptanceImages([]); }
  }, 'confirm');

  const submitDispute = () => doAction(async () => {
    if (!disputeReason.trim()) { alert('请填写争议原因'); return; }
    const res: any = await transactionApi.raiseDispute(id!, disputeReason);
    if (res?.success) { alert(res.message); setShowDispute(false); setDisputeReason(''); }
  }, 'dispute');

  if (loading) return <div className="text-center py-20 text-gray-500">加载中...</div>;
  if (!transaction) return <div className="text-center py-20 text-gray-500">交易不存在</div>;

  const homeowner = (typeof transaction.homeownerId === 'string' ? { _id: transaction.homeownerId, username: '业主', avatar: '', nickname: '', phone: '' } : transaction.homeownerId) as User;
  const designer = (typeof transaction.designerId === 'string' ? { _id: transaction.designerId, username: '设计师', avatar: '', nickname: '', phone: '' } : transaction.designerId) as User;
  const diary = typeof transaction.diaryId === 'string' ? null : transaction.diaryId as Diary;
  const isHomeowner = user?._id === homeowner._id;
  const isDesigner = user?._id === designer._id;
  const status = TRANSACTION_STATUS_LABELS[transaction.status];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-3">← 返回交易列表</button>
        <div className="card p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-gray-900">{transaction.projectName}</h1>
                <span className={`badge ${status.bg} ${status.color}`}>{status.label}</span>
              </div>
              <p className="text-sm text-gray-500">订单号: {transaction._id} · 创建于 {formatDate(transaction.createdAt)}</p>
              {diary && <Link to={`/diaries/${diary._id}`} className="text-sm text-primary-700 hover:underline mt-1 inline-flex items-center gap-1">📝 查看关联装修日记 →</Link>}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(transaction.totalAmount)}</p>
              <p className="text-sm text-gray-500 mt-1">合同总金额</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
              {homeowner.avatar ? <img src={homeowner.avatar} className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-blue-200 flex items-center justify-center text-xl font-bold text-blue-800">{getInitials(homeowner.nickname || homeowner.username)}</div>}
              <div>
                <p className="text-xs text-blue-600 mb-0.5">👤 业主</p>
                <p className="font-semibold text-gray-900">{homeowner.nickname || homeowner.username}</p>
                {homeowner.phone && <p className="text-xs text-gray-500 mt-0.5">📞 {homeowner.phone}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
              {designer.avatar ? <img src={designer.avatar} className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-purple-200 flex items-center justify-center text-xl font-bold text-purple-800">{getInitials(designer.nickname || designer.username)}</div>}
              <div>
                <p className="text-xs text-purple-600 mb-0.5">🎨 设计师</p>
                <p className="font-semibold text-gray-900">{designer.nickname || designer.username}</p>
                {designer.phone && <p className="text-xs text-gray-500 mt-0.5">📞 {designer.phone}</p>}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-sm font-medium text-amber-800 mb-1">🔐 定金托管信息</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <div>
                <p className="text-xs text-amber-600">定金金额</p>
                <p className="font-bold text-gray-900">{formatCurrency(transaction.depositAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">托管状态</p>
                <p className={`font-bold ${transaction.depositStatus === 'held' ? 'text-amber-600' : transaction.depositStatus === 'released' ? 'text-accent-700' : transaction.depositStatus === 'refunded' ? 'text-red-600' : 'text-gray-500'}`}>
                  {transaction.depositStatus === 'pending' ? '待支付' : transaction.depositStatus === 'held' ? '平台托管中' : transaction.depositStatus === 'released' ? '已释放' : '已退还'}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-600">托管账户</p>
                <p className="font-bold text-gray-900 text-sm">{transaction.escrowAccount}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">支付方式</p>
                <p className="font-bold text-gray-900">{transaction.paymentMethod === 'alipay' ? '支付宝' : transaction.paymentMethod === 'wechat' ? '微信支付' : '银行转账'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">📋 施工进度 & 付款节点</h2>
          <span className="text-xs text-gray-500">
            已完成 {transaction.stages.filter(s => s.status === 'released').length}/{transaction.stages.length} 阶段
          </span>
        </div>
        <div className="space-y-4">
          {transaction.stages.map((stage, idx) => {
            const prevStage = idx > 0 ? transaction.stages[idx - 1] : null;
            const canRequest = isDesigner && stage.status === 'pending' && (idx === 0 || prevStage?.status === 'released');
            const canConfirm = isHomeowner && stage.status === 'held';
            return (
              <div key={idx} className={`p-5 rounded-2xl border-2 transition-all ${stage.status === 'released' ? 'bg-accent-50 border-accent-200' : stage.status === 'held' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${stage.status === 'released' ? 'bg-accent-500 text-white' : stage.status === 'held' ? 'bg-amber-500 text-white' : 'bg-gray-300 text-white'}`}>
                      {stage.status === 'released' ? '✓' : idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{stage.stageName}</h3>
                        <span className={`badge ${stage.status === 'released' ? 'bg-accent-100 text-accent-700' : stage.status === 'held' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                          {stage.status === 'pending' ? '待开始' : stage.status === 'held' ? '待业主验收' : '已完成'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        节点金额 <span className="font-bold text-primary-700">{formatCurrency(stage.amount)}</span>
                        <span className="mx-2 text-gray-400">·</span>
                        占比 {stage.percentage}%
                      </p>
                      {stage.requestedAt && <p className="text-xs text-gray-500 mt-1">申请验收时间: {formatDate(stage.requestedAt)}</p>}
                      {stage.releasedAt && <p className="text-xs text-accent-700 mt-1">✓ 款项释放时间: {formatDate(stage.releasedAt)}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {canRequest && (
                      requestStage === idx ? (
                        <div className="bg-white p-3 rounded-xl shadow-sm w-64 space-y-2">
                          <textarea value={requestDesc} onChange={e => setRequestDesc(e.target.value)} className="input text-sm" rows={2} placeholder="说明施工情况..." />
                          <div className="flex gap-2">
                            <button onClick={() => setRequestStage(null)} className="btn-outline !py-1 text-xs flex-1">取消</button>
                            <button onClick={submitStageRequest} disabled={actionLoading === 'request'} className="btn-accent !py-1 text-xs flex-1">提交</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setRequestStage(idx)} disabled={actionLoading !== ''} className="btn-accent !py-1.5 text-sm">申请验收</button>
                      )
                    )}
                    {canConfirm && (
                      confirmStage === idx ? (
                        <div className="bg-white p-4 rounded-xl shadow-lg w-80 space-y-3 -mt-10">
                          <h4 className="font-semibold text-sm">阶段验收</h4>
                          <textarea value={confirmDesc} onChange={e => setConfirmDesc(e.target.value)} className="input text-sm" rows={2} placeholder="验收描述..." />
                          <div>
                            <p className="text-xs text-gray-600 mb-1">施工评分</p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setConfirmRating(n)} className={`text-2xl ${n <= confirmRating ? 'text-amber-400' : 'text-gray-300'}`}>★</button>)}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">验收照片</p>
                            <label className="block w-full p-3 border-2 border-dashed rounded-lg text-center text-xs text-gray-500 cursor-pointer hover:border-primary-400">
                              {acceptanceImages.length > 0 ? `已选${acceptanceImages.length}张` : '点击上传'}
                              <input type="file" multiple accept="image/*" className="hidden" onChange={e => setAcceptanceImages(Array.from(e.target.files || []))} />
                            </label>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">电子签名</p>
                            <input value={signature} onChange={e => setSignature(e.target.value)} className="input text-sm" placeholder="请输入您的姓名作为电子签名" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setConfirmStage(null)} className="btn-outline !py-1 text-xs flex-1">取消</button>
                            <button onClick={submitConfirmation} disabled={actionLoading === 'confirm'} className="btn-accent !py-1 text-xs flex-1">确认通过</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmStage(idx)} disabled={actionLoading !== ''} className="btn-primary !py-1.5 text-sm">
                          验收确认
                        </button>
                      )
                    )}
                  </div>
                </div>

                {stage.acceptanceReport && (
                  <div className="mt-4 ml-14 p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-sm text-gray-900">📄 验收报告</p>
                      {stage.acceptanceReport.rating && (
                        <div className="flex items-center text-amber-500 text-sm">
                          {'★'.repeat(stage.acceptanceReport.rating)}{'☆'.repeat(5 - stage.acceptanceReport.rating)}
                          <span className="text-gray-600 ml-1">{stage.acceptanceReport.rating}.0</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{stage.acceptanceReport.description}</p>
                    {stage.acceptanceReport.images?.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        {stage.acceptanceReport.images.map((img, i) => <img key={i} src={img} className="aspect-square rounded-lg object-cover w-full" />)}
                      </div>
                    )}
                    {stage.acceptanceReport.signature && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-600">业主签名: <span className="font-semibold text-gray-900 font-cursive italic">{stage.acceptanceReport.signature.homeownerSignature || '-'}</span></span>
                        <span className="text-gray-600">设计师签名: <span className="font-semibold text-gray-900 font-cursive italic">{stage.acceptanceReport.signature.designerSignature || '-'}</span></span>
                        {stage.acceptanceReport.signature.signedAt && <span className="text-gray-500">签署: {formatDate(stage.acceptanceReport.signature.signedAt, 'YYYY-MM-DD')}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">⚡ 快捷操作</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {isHomeowner && transaction.status === 'pending' && (
            <button onClick={payDeposit} disabled={actionLoading === 'deposit'} className="p-5 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 text-white hover:shadow-lg transition-all text-left">
              <p className="text-2xl mb-1">💰</p>
              <p className="font-bold">支付定金</p>
              <p className="text-xs opacity-90 mt-1">{formatCurrency(transaction.depositAmount)} · 平台托管</p>
              {actionLoading === 'deposit' && <div className="text-xs mt-2 animate-pulse">处理中...</div>}
            </button>
          )}
          <Link to={`/designers/${designer._id}`} className="p-5 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-all text-left">
            <p className="text-2xl mb-1">💬</p>
            <p className="font-bold text-gray-900">联系设计师</p>
            <p className="text-xs text-gray-600 mt-1">查看设计师资料</p>
          </Link>
          {(isHomeowner || isDesigner) && !['completed', 'cancelled', 'disputed'].includes(transaction.status) && (
            <button onClick={() => setShowDispute(true)} className="p-5 rounded-2xl bg-red-50 hover:bg-red-100 transition-all text-left">
              <p className="text-2xl mb-1">⚠️</p>
              <p className="font-bold text-red-700">发起争议</p>
              <p className="text-xs text-red-600 mt-1">平台客服24h介入</p>
            </button>
          )}
        </div>
      </div>

      {transaction.messages && transaction.messages.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📝 交易日志</h2>
          <div className="space-y-3">
            {(transaction.messages || []).map((msg, idx) => {
              const isH = msg.userId === homeowner._id;
              const isD = msg.userId === designer._id;
              return (
                <div key={idx} className={`flex gap-3 ${isH ? '' : 'flex-row-reverse'}`}>
                  <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${isH ? 'bg-blue-100 rounded-tl-none' : isD ? 'bg-purple-100 rounded-tr-none' : 'bg-gray-100'}`}>
                    <p className={`text-xs mb-1 ${isH ? 'text-blue-600' : isD ? 'text-purple-600' : 'text-gray-500'}`}>
                      {isH ? '业主' : isD ? '设计师' : '系统'} · {formatDate(msg.timestamp, 'MM-DD HH:mm')}
                    </p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {transaction.dispute && (
        <div className="card p-6 border-2 border-red-200 bg-red-50/30">
          <h2 className="text-lg font-bold text-red-700 mb-3">⚠️ 争议处理中</h2>
          <p className="text-sm text-gray-700 mb-2">{transaction.dispute.reason}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>发起于 {formatDate(transaction.dispute.raisedAt)}</span>
            <span>状态: <span className="badge bg-red-100 text-red-700">{transaction.dispute.status === 'open' ? '处理中' : transaction.dispute.status === 'resolved' ? '已解决' : '已升级'}</span></span>
          </div>
          {transaction.dispute.resolution && <p className="mt-3 text-sm text-accent-700 bg-accent-50 p-3 rounded-lg">✓ 处理结果: {transaction.dispute.resolution}</p>}
        </div>
      )}

      {showDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDispute(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-red-700 mb-4">⚠️ 发起争议</h3>
            <p className="text-sm text-gray-500 mb-4">请详细描述您遇到的问题，平台客服将在24小时内介入处理。</p>
            <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="input min-h-[120px]" placeholder="请说明争议原因、涉及金额、相关证据等..." />
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowDispute(false)} className="btn-outline">取消</button>
              <button onClick={submitDispute} disabled={actionLoading === 'dispute'} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">提交争议</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
