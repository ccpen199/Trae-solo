import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Plus } from 'lucide-react';
import api from '@/utils/api';

interface RectifyRecord {
  id: number;
  action: string;
  result: string;
  deadline: string;
  operator_id: number;
  operated_at: string;
}

interface AnomalyDetail {
  anomaly: {
    id: number;
    anomaly_type: string;
    household_id: number;
    parcel_id: number;
    application_id: number;
    description: string;
    rectify_status: string;
    rectify_requirement: string;
    deadline: string;
    created_at: string;
  };
  records: RectifyRecord[];
}

const typeLabels: Record<string, string> = {
  over_area: '超面积', multi_homestead: '一户多宅', missing_material: '材料缺失',
  disputed_parcel: '争议地块', illegal_construction: '违规建设',
};
const rectifyLabels: Record<string, string> = {
  pending: '待整改', in_progress: '整改中', completed: '已整改', overdue: '已逾期',
};

export default function AnomalyDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AnomalyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState({ action: '', result: '', deadline: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<any>(`/api/anomalies/${id}`)
      .then((res) => {
        const { records, ...anomalyFields } = res;
        setDetail({ anomaly: anomalyFields as any, records: records || [] });
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await api.post(`/api/anomalies/${id}/rectify`, newRecord);
      const updated = await api.get<any>(`/api/anomalies/${id}`);
      if (updated.anomaly && updated.records) {
        setDetail(updated);
      } else {
        setDetail({ anomaly: updated, records: [] });
      }
      setShowForm(false);
      setNewRecord({ action: '', result: '', deadline: '' });
    } catch {} finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-slate-400">加载中...</div>;
  if (!detail) return <div className="text-center py-16 text-slate-400">未找到该异常</div>;

  const a = detail.anomaly;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/anomalies" className="text-slate-400 hover:text-teal-700"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-slate-800">异常详情</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-600" />
              <h2 className="text-base font-semibold text-slate-800">异常信息</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-sm text-slate-500">异常类型</span><div className="text-sm font-medium text-slate-800 mt-0.5">{typeLabels[a.anomaly_type] || a.anomaly_type}</div></div>
              <div><span className="text-sm text-slate-500">整改状态</span><div className="text-sm font-medium text-slate-800 mt-0.5">{rectifyLabels[a.rectify_status] || a.rectify_status}</div></div>
              <div className="col-span-2"><span className="text-sm text-slate-500">异常描述</span><div className="text-sm text-slate-700 mt-0.5">{a.description}</div></div>
              <div><span className="text-sm text-slate-500">整改要求</span><div className="text-sm text-slate-700 mt-0.5">{a.rectify_requirement || '-'}</div></div>
              <div><span className="text-sm text-slate-500">整改期限</span><div className="text-sm text-slate-700 mt-0.5">{a.deadline || '-'}</div></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">关联信息</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-slate-500">农户ID</span>
                <div className="mt-0.5">
                  {a.household_id ? <Link to={`/households/${a.household_id}`} className="text-sm text-teal-700 hover:underline">{a.household_id}</Link> : <span className="text-sm text-slate-400">-</span>}
                </div>
              </div>
              <div>
                <span className="text-sm text-slate-500">地块ID</span>
                <div className="mt-0.5">
                  {a.parcel_id ? <Link to={`/parcels/${a.parcel_id}`} className="text-sm text-teal-700 hover:underline">{a.parcel_id}</Link> : <span className="text-sm text-slate-400">-</span>}
                </div>
              </div>
              <div>
                <span className="text-sm text-slate-500">申请ID</span>
                <div className="mt-0.5">
                  {a.application_id ? <Link to={`/applications/${a.application_id}`} className="text-sm text-teal-700 hover:underline">{a.application_id}</Link> : <span className="text-sm text-slate-400">-</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">整改记录</h2>
            <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors">
              <Plus size={14} />
              添加记录
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleAddRecord} className="p-4 mb-4 rounded-lg border border-teal-200 bg-teal-50/30 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">整改措施 <span className="text-red-500">*</span></label>
                <input type="text" value={newRecord.action} onChange={(e) => setNewRecord((p) => ({ ...p, action: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">整改结果</label>
                <textarea value={newRecord.result} onChange={(e) => setNewRecord((p) => ({ ...p, result: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">整改期限</label>
                <input type="date" value={newRecord.deadline} onChange={(e) => setNewRecord((p) => ({ ...p, deadline: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 disabled:opacity-50">
                  {saving ? '保存中...' : '保存'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50">
                  取消
                </button>
              </div>
            </form>
          )}
          {detail.records.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">暂无整改记录</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />
              {detail.records.map((r) => (
                <div key={r.id} className="relative flex items-start gap-3 mb-4 last:mb-0">
                  <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
                  <div className="flex-1 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{r.action}</span>
                      <span className="text-xs text-slate-400">{r.operated_at}</span>
                    </div>
                    {r.result && <div className="text-xs text-slate-500 mt-1">结果: {r.result}</div>}
                    {r.deadline && <div className="text-xs text-slate-400 mt-0.5">期限: {r.deadline}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
