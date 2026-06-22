import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import type { Tenant } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import { useAppStore } from '@/store';
import { ShieldCheck, ShieldAlert, ShieldX, Eye, Building2 } from 'lucide-react';
import dayjs from 'dayjs';
import { maskIdNo } from '@/utils/calculator';

const verifyIcons = {
  verified: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
  face_done: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
  ocr_done: <ShieldAlert className="w-4 h-4 text-amber-500" />,
  unverified: <ShieldX className="w-4 h-4 text-slate-300" />,
  failed: <ShieldX className="w-4 h-4 text-rose-500" />,
};

const verifyLabel = {
  verified: '已实名',
  face_done: '活体通过',
  ocr_done: 'OCR完成',
  unverified: '未核验',
  failed: '核验失败',
};

const verifyColor = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  face_done: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  ocr_done: 'bg-amber-50 text-amber-700 border-amber-200',
  unverified: 'bg-slate-50 text-slate-500 border-slate-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function TenantTable({ tenants }: { tenants: Tenant[] }) {
  const navigate = useNavigate();
  const properties = useAppStore((s) => s.properties);

  return (
    <div className="card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px]">
          <thead>
            <tr>
              <th className="table-th w-[220px]">租客</th>
              <th className="table-th">联系电话</th>
              <th className="table-th">身份证号</th>
              <th className="table-th">租住房源</th>
              <th className="table-th w-[110px]">入住时间</th>
              <th className="table-th w-[100px]">租住状态</th>
              <th className="table-th w-[110px]">身份核验</th>
              <th className="table-th w-[60px] text-right pr-5">操作</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t, i) => {
              const prop = properties.find((p) => p.id === t.propertyId);
              return (
                <tr
                  key={t.id}
                  className="hover:bg-brand-50/20 cursor-pointer animate-staggerIn"
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => navigate(`/tenants/${t.id}`)}
                >
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white flex items-center justify-center font-semibold shadow-sm shrink-0">
                        {t.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {t.idCard.gender} · {t.idCard.nation}族 ·{' '}
                          {dayjs(t.idCard.birth).format('YYYY年生')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-td font-mono text-sm">{t.phone}</td>
                  <td className="table-td font-mono text-xs text-slate-500">
                    {maskIdNo(t.idCard.idNo)}
                  </td>
                  <td className="table-td">
                    {prop ? (
                      <Link
                        to={`/properties/${prop.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="max-w-[180px] truncate">{prop.title}</span>
                      </Link>
                    ) : (
                      <span className="text-slate-400 text-xs">— 未绑定 —</span>
                    )}
                  </td>
                  <td className="table-td text-xs text-slate-600">
                    {t.moveInDate ? dayjs(t.moveInDate).format('YYYY/MM/DD') : '—'}
                  </td>
                  <td className="table-td">
                    <StatusBadge variant="tenant" status={t.status} />
                  </td>
                  <td className="table-td">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${verifyColor[t.verifyStatus]}`}
                    >
                      {verifyIcons[t.verifyStatus]}
                      {verifyLabel[t.verifyStatus]}
                      {t.faceVerify.passed && t.verifyStatus === 'verified' && (
                        <span className="text-[9px] font-bold ml-0.5 opacity-80">
                          {Math.round(t.faceVerify.score * 100)}分
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="table-td text-right pr-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tenants/${t.id}`);
                      }}
                      className="p-1.5 rounded-lg hover:bg-brand-100 text-slate-500 hover:text-brand-700 transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
