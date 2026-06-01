import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import api from '@/utils/api';
import useAuthStore from '@/stores/authStore';

interface ApprovalRecord {
  id: number;
  stage: string;
  action: string;
  opinion: string;
  operator_id: number;
  operated_at: string;
}

interface ApplicationDetail {
  application: {
    id: number;
    app_code: string;
    household_id: number;
    parcel_id: number;
    type: string;
    status: string;
    materials: string;
    remarks: string;
    created_at: string;
    updated_at: string;
  };
  timeline: ApprovalRecord[];
}

const typeLabels: Record<string, string> = { new_build: '新建', rebuild: '翻建', expand: '扩建', exit: '退出', transfer: '流转' };
const statusLabels: Record<string, string> = {
  draft: '草稿', submitted: '已提交', village_review: '村级审核',
  township_review: '乡镇复核', supervisor_filing: '监管备案',
  approved: '已通过', rejected: '已退回', returned: '已退回',
};
const stageLabels: Record<string, string> = { village_review: '村级审核', township_review: '乡镇复核', supervisor_filing: '监管备案' };
const actionLabels: Record<string, string> = { approve: '通过', reject: '退回', return: '补正' };
const actionColors: Record<string, string> = { approve: 'bg-green-500', reject: 'bg-red-500', return: 'bg-yellow-500' };

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [opinion, setOpinion] = useState('');
  const [operating, setOperating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<any>(`/api/applications/${id}`)
      .then((res) => {
        setDetail({
          application: {
            id: res.id,
            app_code: res.app_code,
            household_id: res.household_id,
            parcel_id: res.parcel_id,
            type: res.type,
            status: res.status,
            materials: res.materials,
            remarks: res.remarks,
            created_at: res.created_at,
            updated_at: res.updated_at,
          },
          timeline: res.approvals || [],
        });
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    if (!id || !detail) return;
    setOperating(true);
    try {
      await api.post(`/api/applications/${id}/approve`, { opinion });
      navigate('/applications');
    } catch {
      setOperating(false);
    }
  };

  const handleReject = async () => {
    if (!id || !detail) return;
    setOperating(true);
    try {
      await api.post(`/api/applications/${id}/reject`, { opinion });
      navigate('/applications');
    } catch {
      setOperating(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-slate-400">加载中...</div>;
  if (!detail) return <div className="text-center py-16 text-slate-400">未找到该申请</div>;

  const app = detail.application;
  const materials: string[] = (() => { try { return JSON.parse(app.materials || '[]'); } catch { return []; } })();
  const canApprove = user && ['village', 'township', 'supervisor'].includes(user.role) && ['submitted', 'village_review', 'township_review'].includes(app.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/applications" className="text-slate-400 hover:text-teal-700"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-slate-800">申请详情</h1>
        <span className="ml-2 px-2.5 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200">
          {statusLabels[app.status] || app.status}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">申请信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-sm text-slate-500">申请编号</span><div className="text-sm font-medium text-slate-800 mt-0.5">{app.app_code}</div></div>
              <div><span className="text-sm text-slate-500">申请类型</span><div className="text-sm font-medium text-slate-800 mt-0.5">{typeLabels[app.type] || app.type}</div></div>
              <div><span className="text-sm text-slate-500">农户ID</span><div className="text-sm font-medium text-slate-800 mt-0.5">{app.household_id}</div></div>
              <div><span className="text-sm text-slate-500">地块ID</span><div className="text-sm font-medium text-slate-800 mt-0.5">{app.parcel_id || '-'}</div></div>
              <div><span className="text-sm text-slate-500">申请时间</span><div className="text-sm font-medium text-slate-800 mt-0.5">{app.created_at}</div></div>
              <div><span className="text-sm text-slate-500">更新时间</span><div className="text-sm font-medium text-slate-800 mt-0.5">{app.updated_at}</div></div>
            </div>
            {materials.length > 0 && (
              <div className="mt-4">
                <span className="text-sm text-slate-500">提交材料</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {materials.map((m, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {app.remarks && (
              <div className="mt-4">
                <span className="text-sm text-slate-500">备注</span>
                <div className="text-sm text-slate-700 mt-0.5">{app.remarks}</div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">审批时间线</h2>
            {detail.timeline.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无审批记录</p>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />
                {detail.timeline.map((record) => (
                  <div key={record.id} className="relative flex items-start gap-3 mb-5 last:mb-0">
                    <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white ${actionColors[record.action] || 'bg-slate-400'}`} />
                    <div className="flex-1 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">
                          {stageLabels[record.stage] || record.stage} - {actionLabels[record.action] || record.action}
                        </span>
                        <span className="text-xs text-slate-400">{record.operated_at}</span>
                      </div>
                      {record.opinion && <div className="text-xs text-slate-500 mt-1">审批意见: {record.opinion}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {canApprove && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 h-fit">
            <h2 className="text-base font-semibold text-slate-800 mb-4">审批操作</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">审批意见</label>
                <textarea
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="请输入审批意见"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={operating}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  通过
                </button>
                <button
                  onClick={handleReject}
                  disabled={operating}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle size={16} />
                  退回
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
