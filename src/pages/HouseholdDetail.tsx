import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, FileText, Clock } from 'lucide-react';
import api from '@/utils/api';

interface Member {
  id: number;
  name: string;
  relationship: string;
  id_card: string;
  household_registration: string;
}

interface Parcel {
  id: number;
  parcel_code: string;
  area: number;
  usage: string;
  ownership_status: string;
}

interface Application {
  id: number;
  app_code: string;
  type: string;
  status: string;
  created_at: string;
}

interface HouseholdDetail {
  household: {
    id: number;
    head_name: string;
    id_card: string;
    address: string;
    phone: string;
    eligibility_status: string;
    created_at: string;
    updated_at: string;
  };
  members: Member[];
  parcels: Parcel[];
  applications: Application[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  qualified: { label: '符合资格', className: 'bg-green-50 text-green-700 border-green-200' },
  disqualified: { label: '不符合资格', className: 'bg-red-50 text-red-700 border-red-200' },
  pending: { label: '待审核', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  restricted: { label: '受限', className: 'bg-orange-50 text-orange-700 border-orange-200' },
};

const usageLabels: Record<string, string> = {
  residence: '住宅',
  production: '生产',
  business: '经营',
  other: '其他',
};

const ownershipLabels: Record<string, string> = {
  confirmed: '已确权',
  unconfirmed: '未确权',
  transferring: '流转中',
  exited: '已退出',
};

const typeLabels: Record<string, string> = {
  new_build: '新建',
  rebuild: '翻建',
  expand: '扩建',
  exit: '退出',
  transfer: '流转',
};

const appStatusLabels: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  village_review: '村级审核',
  township_review: '乡镇复核',
  supervisor_filing: '监管备案',
  approved: '已通过',
  rejected: '已退回',
  returned: '已退回',
};

export default function HouseholdDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<HouseholdDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<HouseholdDetail>(`/api/households/${id}`)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-slate-400">加载中...</div>;
  if (!detail) return <div className="text-center py-16 text-slate-400">未找到该农户档案</div>;

  const h = detail.household;
  const sc = statusConfig[h.eligibility_status] || statusConfig.pending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/households" className="text-slate-400 hover:text-teal-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">农户档案详情</h1>
        <span className={`ml-2 px-2.5 py-0.5 text-xs rounded-full border ${sc.className}`}>
          {sc.label}
        </span>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-teal-700" />
          <h2 className="text-base font-semibold text-slate-800">基本信息</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><span className="text-sm text-slate-500">户主姓名</span><div className="text-sm font-medium text-slate-800 mt-0.5">{h.head_name}</div></div>
          <div><span className="text-sm text-slate-500">身份证号</span><div className="text-sm font-medium text-slate-800 mt-0.5">{h.id_card}</div></div>
          <div><span className="text-sm text-slate-500">地址</span><div className="text-sm font-medium text-slate-800 mt-0.5">{h.address}</div></div>
          <div><span className="text-sm text-slate-500">联系电话</span><div className="text-sm font-medium text-slate-800 mt-0.5">{h.phone}</div></div>
          <div><span className="text-sm text-slate-500">创建时间</span><div className="text-sm font-medium text-slate-800 mt-0.5">{h.created_at}</div></div>
          <div><span className="text-sm text-slate-500">更新时间</span><div className="text-sm font-medium text-slate-800 mt-0.5">{h.updated_at}</div></div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-teal-700" />
          <h2 className="text-base font-semibold text-slate-800">家庭成员</h2>
        </div>
        {detail.members.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">暂无家庭成员</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2.5 px-3 font-medium text-slate-500">姓名</th>
                <th className="text-left py-2.5 px-3 font-medium text-slate-500">关系</th>
                <th className="text-left py-2.5 px-3 font-medium text-slate-500">身份证号</th>
                <th className="text-left py-2.5 px-3 font-medium text-slate-500">户籍</th>
              </tr>
            </thead>
            <tbody>
              {detail.members.map((m, idx) => (
                <tr key={m.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-teal-50/40`}>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{m.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{m.relationship}</td>
                  <td className="py-2.5 px-3 text-slate-600">{m.id_card}</td>
                  <td className="py-2.5 px-3 text-slate-600">{m.household_registration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-teal-700" />
          <h2 className="text-base font-semibold text-slate-800">关联地块</h2>
        </div>
        {detail.parcels.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">暂无关联地块</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {detail.parcels.map((p) => (
              <Link
                key={p.id}
                to={`/parcels/${p.id}`}
                className="p-4 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/40 transition-colors"
              >
                <div className="text-sm font-medium text-slate-800">{p.parcel_code}</div>
                <div className="text-xs text-slate-500 mt-1">
                  面积: {p.area}㎡ · 用途: {usageLabels[p.usage] || p.usage} · 权属: {ownershipLabels[p.ownership_status] || p.ownership_status}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-teal-700" />
          <h2 className="text-base font-semibold text-slate-800">历史申请</h2>
        </div>
        {detail.applications.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">暂无申请记录</p>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />
            {detail.applications.map((app) => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className="relative flex items-start gap-3 mb-4 last:mb-0 group"
              >
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-white group-hover:bg-teal-700" />
                <div className="flex-1 p-3 rounded-lg border border-slate-100 hover:border-teal-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">{app.app_code}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{appStatusLabels[app.status] || app.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {typeLabels[app.type] || app.type} · {app.created_at}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Link
          to={`/households/${h.id}/edit`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
        >
          <FileText size={16} />
          编辑档案
        </Link>
      </div>
    </div>
  );
}
