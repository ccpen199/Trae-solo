import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  ShieldCheck,
  Phone,
  Building2,
  CalendarClock,
  FileCheck,
  IdCard,
  Camera,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmModal from '@/components/common/ConfirmModal';
import EmptyState from '@/components/common/EmptyState';
import VerifyFlow from '@/components/tenant/VerifyFlow';
import NotFound from './NotFound';
import { formatCurrency, maskIdNo } from '@/utils/calculator';
import dayjs from 'dayjs';
import type { Tenant } from '@/types';
import type { VerifyFlowResult } from '@/components/tenant/VerifyFlow';
import { validatePhone } from '@/utils/formatters';

const EMPTY_ID_CARD = {
  name: '',
  gender: '男',
  nation: '汉',
  birth: dayjs().subtract(30, 'year').format('YYYY-MM-DD'),
  address: '',
  idNo: '',
  issuingAuthority: '',
  validPeriod: '',
};

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tenants = useAppStore((s) => s.tenants);
  const properties = useAppStore((s) => s.properties);
  const bills = useAppStore((s) => s.bills);
  const updateTenant = useAppStore((s) => s.updateTenant);
  const deleteTenant = useAppStore((s) => s.deleteTenant);
  if (!id) return <NotFound />;
  const tenant = tenants.find((t) => t.id === id);
  if (!tenant) return <NotFound />;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  const prop = properties.find((p) => p.id === tenant.propertyId);
  const relatedBills = useMemo(
    () =>
      bills
        .filter((b) => b.tenantId === tenant.id)
        .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
    [bills, tenant.id]
  );
  const totalPaid = relatedBills.reduce((s, b) => s + b.paidAmount, 0);

  function handleVerifyComplete(r: VerifyFlowResult) {
    const tn = tenant!;
    updateTenant(tn.id, {
      idCard: r.idCard,
      faceVerify: r.faceVerify,
      verifyStatus: r.verifyStatus,
      name: r.idCard.name || tn.name,
    });
    setShowVerify(false);
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-ghost -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <StatusBadge variant="tenant" status={tenant.status} />
              <div
                className={
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ' +
                  (tenant.verifyStatus === 'verified'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : tenant.verifyStatus === 'unverified'
                      ? 'bg-slate-50 text-slate-500 border-slate-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200')
                }
              >
                <ShieldCheck className="w-3 h-3" />
                {tenant.verifyStatus === 'verified'
                  ? `已实名 · 活体${Math.round(tenant.faceVerify.score * 100)}分`
                  : tenant.verifyStatus === 'ocr_done'
                    ? 'OCR已采集 · 待活体'
                    : tenant.verifyStatus === 'face_done'
                      ? '活体已通过'
                      : '未核验身份'}
              </div>
            </div>
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900">
              {tenant.name}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tenant.verifyStatus !== 'verified' && (
            <button className="btn-secondary" onClick={() => setShowVerify(true)}>
              <ShieldCheck className="w-4 h-4" />
              完成身份核验
            </button>
          )}
          <Link to="/tenants/new" className="btn-secondary" state={{ duplicate: tenant }}>
            <UserPlus className="w-4 h-4" />
            复制
          </Link>
          <button className="btn-secondary" onClick={() => navigate(`/tenants/${tenant.id}/edit`)}>
            <Edit3 className="w-4 h-4" />
            编辑
          </button>
          <button className="btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-3.5 h-3.5" />
            删除
          </button>
        </div>
      </div>

      {showVerify && (
        <div className="card p-6 rounded-2xl border-brand-200 border-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-700" />
              身份核验流程
            </h3>
            <button
              className="btn-ghost btn-sm text-slate-400"
              onClick={() => setShowVerify(false)}
            >
              收起
            </button>
          </div>
          <VerifyFlow
            defaultIdCard={tenant.idCard}
            defaultVerify={tenant.verifyStatus}
            defaultFace={tenant.faceVerify}
            onComplete={handleVerifyComplete}
            onCancel={() => setShowVerify(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <section className="card p-6 rounded-2xl">
            <h3 className="section-title">
              <IdCard className="w-4.5 h-4.5 text-brand-700" />
              基础信息
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoCell label="联系电话" icon={<Phone className="w-3.5 h-3.5" />}>
                <span className="font-mono">{tenant.phone}</span>
                {!validatePhone(tenant.phone) && (
                  <span className="ml-2 text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> 格式异常
                  </span>
                )}
              </InfoCell>
              <InfoCell label="紧急联系人" icon={<Phone className="w-3.5 h-3.5" />}>
                {tenant.emergencyContact || <span className="text-slate-400">未设置</span>}
              </InfoCell>
              <InfoCell label="入住日期" icon={<CalendarClock className="w-3.5 h-3.5" />}>
                {tenant.moveInDate ? dayjs(tenant.moveInDate).format('YYYY-MM-DD') : '—'}
                {tenant.moveInDate && (
                  <span className="text-xs text-slate-400 ml-2">
                    已入住 {dayjs().diff(tenant.moveInDate, 'day')} 天
                  </span>
                )}
              </InfoCell>
              <InfoCell label="退租日期" icon={<CalendarClock className="w-3.5 h-3.5" />}>
                {tenant.moveOutDate ? dayjs(tenant.moveOutDate).format('YYYY-MM-DD') : '—'}
              </InfoCell>
              <InfoCell label="租住房间" icon={<Building2 className="w-3.5 h-3.5" />}>
                {prop ? (
                  <Link
                    to={`/properties/${prop.id}`}
                    className="text-brand-700 hover:underline font-medium"
                  >
                    {prop.title}
                  </Link>
                ) : (
                  <span className="text-slate-400">未绑定房源</span>
                )}
              </InfoCell>
              <InfoCell label="累计支付" icon={<FileCheck className="w-3.5 h-3.5" />}>
                <span className="font-serif font-bold text-emerald-600">
                  {formatCurrency(totalPaid)}
                </span>
                <span className="text-xs text-slate-400 ml-1">/ {relatedBills.length} 单</span>
              </InfoCell>
              <div className="col-span-full">
                <div className="label">备注</div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 min-h-[48px]">
                  {tenant.remark || '暂无备注'}
                </div>
              </div>
            </div>
          </section>

          <section className="card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title mb-0">
                <FileCheck className="w-4.5 h-4.5 text-brand-700" />
                历史账单
              </h3>
              <Link to="/bills" className="text-xs text-brand-700 hover:underline">
                查看全部 →
              </Link>
            </div>
            {relatedBills.length === 0 ? (
              <EmptyState title="暂无账单" description="为该租客生成首期账单或进入集中抄表" />
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr>
                      <th className="table-th">账期</th>
                      <th className="table-th">账单号</th>
                      <th className="table-th text-right">应收</th>
                      <th className="table-th text-right">实收</th>
                      <th className="table-th">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedBills.slice(0, 8).map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/60 cursor-pointer"
                        onClick={() => navigate(`/bills/${b.id}`)}
                      >
                        <td className="table-td">
                          {dayjs(b.periodStart).format('YYYY/MM')}
                        </td>
                        <td className="table-td font-mono text-xs text-slate-500">{b.billNo}</td>
                        <td className="table-td text-right font-medium">
                          {formatCurrency(b.totalAmount)}
                        </td>
                        <td className="table-td text-right">
                          <span
                            className={
                              b.paidAmount >= b.totalAmount ? 'text-emerald-600' : 'text-slate-700'
                            }
                          >
                            {formatCurrency(b.paidAmount)}
                          </span>
                        </td>
                        <td className="table-td">
                          <StatusBadge variant="bill" status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-6 rounded-2xl">
            <h3 className="section-title">
              <Camera className="w-4.5 h-4.5 text-brand-700" />
              证件与认证
            </h3>
            {tenant.idCard.frontImage ? (
              <img
                src={tenant.idCard.frontImage}
                alt="身份证"
                className="w-full rounded-xl shadow-md mb-4 border border-slate-100"
              />
            ) : (
              <div className="w-full aspect-[16/10] rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm mb-4">
                未上传身份证照片
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <InfoCell2 label="姓名" value={tenant.idCard.name} />
              <InfoCell2 label="性别/民族" value={`${tenant.idCard.gender} / ${tenant.idCard.nation}`} />
              <InfoCell2 label="出生日期" value={tenant.idCard.birth} />
              <InfoCell2 label="身份证号" value={maskIdNo(tenant.idCard.idNo)} mono />
              <div className="col-span-2">
                <div className="label mb-1">户籍地址</div>
                <div className="p-2 rounded-lg bg-slate-50 text-[12px] text-slate-600 border border-slate-100">
                  {tenant.idCard.address || '—'}
                </div>
              </div>
              <InfoCell2 label="签发机关" value={tenant.idCard.issuingAuthority} />
              <InfoCell2 label="有效期" value={tenant.idCard.validPeriod} />
            </div>
          </section>

          <section className="card p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-rose-50 border-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚖️</span>
              <h3 className="font-serif font-semibold text-slate-900">民法典提示</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              第716条：承租人未经出租人同意转租的，出租人可以解除合同。租客信息变更（转租、退租）请及时更新，避免法律风险。
            </p>
            <div className="text-[11px] text-slate-400 border-t border-amber-100/60 pt-3">
              所有核验流程均已加密留痕，操作日志可审计追溯
            </div>
          </section>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        variant="danger"
        title={`删除租客「${tenant.name}」？`}
        description="删除后历史账单保留但关联解除。推荐使用「退租」流程处理。"
        confirmText="确认删除"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteTenant(tenant.id);
          navigate('/tenants');
        }}
      />
    </div>
  );
}

function InfoCell({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-slate-800 flex items-center">{children}</div>
    </div>
  );
}

function InfoCell2({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 mb-0.5">{label}</div>
      <div className={'text-slate-700 ' + (mono ? 'font-mono text-[11px]' : 'text-xs')}>
        {value || '—'}
      </div>
    </div>
  );
}
