import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Plus,
  Upload,
  AlertCircle,
  PackageX,
  PackageCheck,
  X,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  Eye,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import type { AfterSaleClaim, ClaimType, ClaimStatus } from '../../shared/types';

const typeMap: Record<ClaimType, { label: string; icon: any; color: string }> = {
  damage: { label: '破损申诉', icon: AlertCircle, color: 'tag-orange' },
  lost: { label: '丢件申诉', icon: PackageX, color: 'tag-red' },
};

const statusMap: Record<ClaimStatus, { label: string; color: string }> = {
  pending: { label: '已提交', color: 'tag-gray' },
  reviewing: { label: '审核中', color: 'tag-blue' },
  approved: { label: '审核通过', color: 'tag-green' },
  paid: { label: '已打款', color: 'tag-green' },
  rejected: { label: '已驳回', color: 'tag-red' },
};

const stages = [
  { key: 'pending', label: '已提交', icon: ShieldAlert },
  { key: 'reviewing', label: '审核中', icon: Eye },
  { key: 'approved', label: '通过', icon: CheckCircle2 },
  { key: 'paid', label: '已打款', icon: DollarSign },
];

export default function AfterSalePage() {
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [claims, setClaims] = useState<AfterSaleClaim[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const [newClaim, setNewClaim] = useState({
    waybillId: 'ZT7890123456789',
    type: 'damage' as ClaimType,
    amount: 200,
    description: '',
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    const data = await api.afterSale.list();
    setClaims(data as AfterSaleClaim[]);
  };

  const submitClaim = async () => {
    const claim = await api.afterSale.create(newClaim);
    if (uploadedImages.length > 0) {
      const files = uploadedImages.map((src) => {
        const arr = src.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        const u8 = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
        return new File([u8], `evidence_${Date.now()}.jpg`, { type: mime });
      });
      await api.afterSale.upload((claim as AfterSaleClaim).id, files);
    }
    setShowNew(false);
    setUploadedImages([]);
    loadClaims();
  };

  const handleFile = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const filtered = claims.filter((c) => {
    if (filter === 'active') return ['pending', 'reviewing', 'approved'].includes(c.status);
    if (filter === 'done') return ['paid', 'rejected'].includes(c.status);
    return true;
  });

  const viewDetail = async (claim: AfterSaleClaim) => {
    const d = await api.afterSale.get(claim.id);
    setSelectedDetail(d);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-700">售后中心</h1>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> 发起申诉
        </button>
      </div>

      <div className="card mb-6 !p-2 inline-flex">
        {[
          { k: 'all', label: '全部' },
          { k: 'active', label: '进行中' },
          { k: 'done', label: '已完成' },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setFilter(t.k as any)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === t.k ? 'bg-brand-500 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <div className="text-neutral-500 mb-4">暂无售后申诉记录</div>
          <button onClick={() => setShowNew(true)} className="btn-secondary">
            <Plus className="w-4 h-4" /> 发起申诉
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const t = typeMap[c.type];
            const s = statusMap[c.status];
            return (
              <div key={c.id} className="card hover:-translate-y-0.5 cursor-pointer" onClick={() => viewDetail(c)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={t.color}><t.icon className="w-3.5 h-3.5 inline mr-1" />{t.label}</span>
                    <span className={s.color}>{s.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neutral-400">申诉金额</div>
                    <div className="text-xl font-bold text-accent-500">¥{c.amount}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm mb-3">
                  <div className="flex items-center gap-1.5 text-neutral-600">
                    <PackageCheck className="w-4 h-4 text-neutral-400" />
                    <span className="font-mono">{c.waybillId}</span>
                  </div>
                  <div className="text-neutral-400">提交于 {c.createdAt}</div>
                </div>
                <div className="text-sm text-neutral-600 line-clamp-2 mb-3">{c.description}</div>
                {c.images.length > 0 && (
                  <div className="flex gap-2">
                    {c.images.slice(0, 4).map((img, i) => (
                      <div key={i} className="w-14 h-14 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden">
                        <ImageIcon className="w-5 h-5 text-neutral-400" />
                      </div>
                    ))}
                    {c.images.length > 4 && (
                      <div className="w-14 h-14 rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">
                        +{c.images.length - 4}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-brand-500">
                    {stages.slice(0, stages.findIndex((s) => s.key === c.status) + 1).map((stage, i) => (
                      <div key={stage.key} className="flex items-center gap-1">
                        <stage.icon className="w-3 h-3" />
                        {i < stages.findIndex((s) => s.key === c.status) && <ChevronRight className="w-3 h-3" />}
                      </div>
                    ))}
                  </div>
                  <button className="text-sm text-brand-500 flex items-center gap-1">
                    查看详情 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto scrollbar-thin animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-700">发起售后申诉</h3>
              <button onClick={() => setShowNew(false)} className="p-1 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="form-label">问题类型</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['damage', 'lost'] as ClaimType[]).map((tp) => {
                    const t = typeMap[tp];
                    return (
                      <button
                        key={tp}
                        onClick={() => setNewClaim({ ...newClaim, type: tp })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          newClaim.type === tp
                            ? tp === 'damage' ? 'border-orange-500 bg-orange-50' : 'border-red-500 bg-red-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <t.icon className={`w-5 h-5 ${tp === 'damage' ? 'text-accent-500' : 'text-danger-500'}`} />
                          <span className="font-semibold text-neutral-700">{t.label}</span>
                        </div>
                        <div className="text-xs text-neutral-500">{tp === 'damage' ? '外包装破损、内容物损坏等' : '包裹丢失、部分内容物缺失等'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="form-label">关联运单号</label>
                <input className="input-field font-mono" value={newClaim.waybillId} onChange={(e) => setNewClaim({ ...newClaim, waybillId: e.target.value })} />
              </div>
              <div>
                <label className="form-label">申诉金额（元）</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">¥</span>
                  <input type="number" className="input-field pl-8" value={newClaim.amount} onChange={(e) => setNewClaim({ ...newClaim, amount: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="form-label">问题描述</label>
                <textarea className="input-field h-28 resize-none" placeholder="请详细描述问题情况，包括包裹状态、物品损失等信息" value={newClaim.description} onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })} />
              </div>
              <div>
                <label className="form-label">图片证据（最多 9 张）</label>
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-neutral-300 rounded-xl hover:border-brand-400 hover:bg-brand-50 cursor-pointer transition-all">
                  <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                  <div className="text-sm text-neutral-500">点击或拖拽上传图片</div>
                  <div className="text-xs text-neutral-400">支持 JPG/PNG，单张不超过 5MB</div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files)} />
                </label>
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {uploadedImages.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setUploadedImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex gap-3 justify-end">
              <button onClick={() => setShowNew(false)} className="btn-secondary">取消</button>
              <button onClick={submitClaim} className="btn-primary bg-accent-500 hover:bg-accent-600">
                <CheckCircle2 className="w-4 h-4" /> 提交申诉
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print" onClick={() => setSelectedDetail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-auto scrollbar-thin animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-700">申诉详情</h3>
              <button onClick={() => setSelectedDetail(null)} className="p-1 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {typeMap[selectedDetail.claim.type] && <span className={typeMap[selectedDetail.claim.type].color}>{typeMap[selectedDetail.claim.type].label}</span>}
                {statusMap[selectedDetail.claim.status] && <span className={statusMap[selectedDetail.claim.status].color}>{statusMap[selectedDetail.claim.status].label}</span>}
              </div>
              <div className="mb-4 p-4 bg-neutral-50 rounded-xl space-y-2">
                <div className="flex justify-between text-sm"><span className="text-neutral-500">运单号</span><span className="font-mono">{selectedDetail.waybill?.tracking_no || '-'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-500">申诉金额</span><span className="font-bold text-accent-500">¥{selectedDetail.claim.amount}</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-500">提交时间</span><span>{selectedDetail.claim.createdAt}</span></div>
              </div>
              <div className="mb-4">
                <div className="text-sm font-semibold text-neutral-700 mb-2">问题描述</div>
                <div className="text-sm text-neutral-600 p-3 bg-neutral-50 rounded-lg">{selectedDetail.claim.description}</div>
              </div>
              {selectedDetail.claim.images?.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-neutral-700 mb-2">图片证据</div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDetail.claim.images.map((_: string, i: number) => (
                      <div key={i} className="aspect-square rounded-lg bg-neutral-100 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-neutral-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-neutral-700 mb-4">处理进度</div>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-neutral-200" />
                  {selectedDetail.timeline?.map((s: any, i: number) => (
                    <div key={i} className="relative pb-5 last:pb-0">
                      <div className={`absolute -left-[18px] w-5 h-5 rounded-full flex items-center justify-center ${s.done ? 'bg-brand-500 text-white' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${s.done ? 'text-neutral-700' : 'text-neutral-400'}`}>{s.label}</div>
                        {s.time && <div className="text-xs text-neutral-400">{s.time}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
