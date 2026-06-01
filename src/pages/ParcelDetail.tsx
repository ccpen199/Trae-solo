import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, FileText, Clock, Image, Edit } from 'lucide-react';
import api from '@/utils/api';

interface ParcelChange {
  id: number;
  change_type: string;
  description: string;
  changed_by: string;
  changed_at: string;
}

interface ParcelDetail {
  parcel: {
    id: number;
    parcel_code: string;
    coordinates: string;
    area: number;
    usage: string;
    ownership_cert: string;
    ownership_status: string;
    boundary_east: string;
    boundary_west: string;
    boundary_south: string;
    boundary_north: string;
    photos: string;
    created_at: string;
    updated_at: string;
  };
  changes: ParcelChange[];
}

const usageLabels: Record<string, string> = { residence: '住宅', production: '生产', business: '经营', other: '其他' };
const ownershipLabels: Record<string, string> = { confirmed: '已确权', unconfirmed: '未确权', transferring: '流转中', exited: '已退出' };

export default function ParcelDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ParcelDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<ParcelDetail>(`/api/parcels/${id}`)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-slate-400">加载中...</div>;
  if (!detail) return <div className="text-center py-16 text-slate-400">未找到该地块</div>;

  const p = detail.parcel;
  const photos: string[] = (() => { try { return JSON.parse(p.photos || '[]'); } catch { return []; } })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/parcels" className="text-slate-400 hover:text-teal-700"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-slate-800">地块详情</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={18} className="text-teal-700" />
              <h2 className="text-base font-semibold text-slate-800">基本信息</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-sm text-slate-500">地块编号</span><div className="text-sm font-medium text-slate-800 mt-0.5">{p.parcel_code}</div></div>
              <div><span className="text-sm text-slate-500">面积</span><div className="text-sm font-medium text-slate-800 mt-0.5">{p.area} ㎡</div></div>
              <div><span className="text-sm text-slate-500">用途</span><div className="text-sm font-medium text-slate-800 mt-0.5">{usageLabels[p.usage] || p.usage}</div></div>
              <div><span className="text-sm text-slate-500">权属状态</span><div className="text-sm font-medium text-slate-800 mt-0.5">{ownershipLabels[p.ownership_status] || p.ownership_status}</div></div>
              <div><span className="text-sm text-slate-500">权属证书</span><div className="text-sm font-medium text-slate-800 mt-0.5">{p.ownership_cert || '-'}</div></div>
              <div><span className="text-sm text-slate-500">坐标</span><div className="text-sm font-medium text-slate-800 mt-0.5">{p.coordinates || '-'}</div></div>
              <div><span className="text-sm text-slate-500">创建时间</span><div className="text-sm font-medium text-slate-800 mt-0.5">{p.created_at}</div></div>
              <div><span className="text-sm text-slate-500">更新时间</span><div className="text-sm font-medium text-slate-800 mt-0.5">{p.updated_at}</div></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={18} className="text-teal-700" />
              <h2 className="text-base font-semibold text-slate-800">四至信息</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-sm text-slate-500">东至</span><div className="text-sm font-medium text-slate-800 mt-0.5">{p.boundary_east || '-'}</div></div>
              <div><span className="text-sm text-slate-500">西至</span><div className="text-sm font-medium text-slate-800 mt-0.5">{p.boundary_west || '-'}</div></div>
              <div><span className="text-sm text-slate-500">南至</span><div className="text-sm font-medium text-slate-800 mt-0.5">{p.boundary_south || '-'}</div></div>
              <div><span className="text-sm text-slate-500">北至</span><div className="text-sm font-medium text-slate-800 mt-0.5">{p.boundary_north || '-'}</div></div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Image size={18} className="text-teal-700" />
              <h2 className="text-base font-semibold text-slate-800">现场照片</h2>
            </div>
            {photos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">暂无照片</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                    <img src={photo} alt={`照片${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-teal-700" />
              <h2 className="text-base font-semibold text-slate-800">变更历史</h2>
            </div>
            {detail.changes.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无变更记录</p>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />
                {detail.changes.map((c) => (
                  <div key={c.id} className="relative flex items-start gap-3 mb-4 last:mb-0">
                    <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">{c.change_type}</span>
                        <span className="text-xs text-slate-400">{c.changed_at}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>
                      <div className="text-xs text-slate-400 mt-0.5">操作人: {c.changed_by}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Link to={`/parcels/${p.id}/edit`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors">
          <Edit size={16} />
          编辑地块
        </Link>
      </div>
    </div>
  );
}
