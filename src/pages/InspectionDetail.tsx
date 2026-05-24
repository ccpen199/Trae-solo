import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Car,
  ClipboardCheck,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Droplets,
  Flame,
  Wrench,
  Paintbrush,
  Car as CarIcon,
  Edit,
  Send,
  CheckCircle2,
  XCircle as XCircleIcon,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getInspection, submitInspection, auditInspection } from '@/api/modules/inspections';
import type { Inspection, InspectionItem, MaintenanceRecord, PaintworkItem } from '@/types';
import { formatPrice, formatDate } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import ConfirmModal from '@/components/ConfirmModal';

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, checkRole } = useAuthStore();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'submit' | 'approve' | 'reject';
  }>({ open: false, type: 'submit' });

  useEffect(() => {
    if (id) {
      loadInspectionData(Number(id));
    }
  }, [id]);

  const loadInspectionData = async (inspectionId: number) => {
    try {
      setLoading(true);
      const data = await getInspection(inspectionId);
      setInspection(data);
    } catch (error) {
      console.error('加载检测报告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'normal':
        return <CheckCircle className="w-6 h-6 text-success-500" />;
      case 'abnormal':
        return <XCircle className="w-6 h-6 text-danger-500" />;
      case 'suspicious':
        return <AlertTriangle className="w-6 h-6 text-warning-500" />;
      default:
        return <Clock className="w-6 h-6 text-neutral-500" />;
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'normal':
        return '正常';
      case 'abnormal':
        return '异常';
      case 'suspicious':
        return '可疑';
      default:
        return '未检测';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'normal':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'abnormal':
        return 'text-danger-600 bg-danger-50 border-danger-300';
      case 'suspicious':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      default:
        return 'text-neutral-600 bg-neutral-50 border-neutral-200';
    }
  };

  const isAbnormal = (item: InspectionItem) => {
    return item.result === 'abnormal' || item.result === 'suspicious';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600';
    if (score >= 70) return 'text-primary-600';
    if (score >= 60) return 'text-warning-600';
    return 'text-danger-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'from-success-500 to-success-700';
    if (score >= 70) return 'from-primary-500 to-primary-700';
    if (score >= 60) return 'from-warning-500 to-warning-700';
    return 'from-danger-500 to-danger-700';
  };

  const canEdit = () => {
    if (!inspection || !user) return false;
    return (
      inspection.status === 'draft' &&
      (checkRole(['admin']) || (checkRole(['inspector']) && inspection.inspectorId === user.id))
    );
  };

  const canSubmit = () => {
    if (!inspection || !user) return false;
    return (
      inspection.status === 'draft' &&
      (checkRole(['admin']) || (checkRole(['inspector']) && inspection.inspectorId === user.id))
    );
  };

  const canAudit = () => {
    if (!inspection) return false;
    return checkRole(['admin']) && inspection.status === 'submitted';
  };

  const handleSubmit = async () => {
    if (!inspection) return;
    try {
      await submitInspection(inspection.id);
      loadInspectionData(inspection.id);
      setConfirmModal({ open: false, type: 'submit' });
    } catch (error) {
      console.error('提交检测报告失败:', error);
      alert('提交失败，请重试');
    }
  };

  const handleAudit = async (approved: boolean) => {
    if (!inspection) return;
    try {
      await auditInspection(inspection.id, approved, approved ? '' : '检测报告不符合要求');
      loadInspectionData(inspection.id);
      setConfirmModal({ open: false, type: 'submit' });
    } catch (error) {
      console.error('审核检测报告失败:', error);
      alert('审核失败，请重试');
    }
  };

  const renderInspectionCard = (
    title: string,
    icon: React.ElementType,
    item: InspectionItem,
    images?: string[]
  ) => {
    const Icon = icon;
    return (
      <div className={`card p-6 border-2 ${isAbnormal(item) ? 'border-danger-300 bg-danger-50/50' : 'border-neutral-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isAbnormal(item) ? 'bg-danger-100' : 'bg-primary-100'
            }`}>
              <Icon className={`w-6 h-6 ${isAbnormal(item) ? 'text-danger-600' : 'text-primary-600'}`} />
            </div>
            <h3 className="font-semibold text-lg text-neutral-800">{title}</h3>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getResultColor(item.result)}`}>
            {getResultIcon(item.result)}
            <span className="ml-2">{getResultLabel(item.result)}</span>
          </div>
        </div>
        <p className="text-neutral-600 mb-4">{item.description}</p>
        {images && images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${title}图片 ${index + 1}`}
                className="w-full aspect-square rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
        <Empty message="检测报告不存在或已被删除" icon={ClipboardCheck} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/inspections')}
            className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-noto-serif-sc text-2xl font-bold text-neutral-800">
                检测报告详情
              </h1>
              <StatusBadge status={inspection.status} type="inspection" />
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              报告编号：{inspection.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit() && (
              <button
                onClick={() => navigate(`/inspections/create/${inspection.carId}?id=${inspection.id}`)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                编辑报告
              </button>
            )}
            {canSubmit() && (
              <button
                onClick={() => setConfirmModal({ open: true, type: 'submit' })}
                className="btn-secondary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                提交审核
              </button>
            )}
            {canAudit() && (
              <>
                <button
                  onClick={() => setConfirmModal({ open: true, type: 'approve' })}
                  className="btn-secondary flex items-center gap-2 text-success-700 border-success-700 hover:bg-success-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  审核通过
                </button>
                <button
                  onClick={() => setConfirmModal({ open: true, type: 'reject' })}
                  className="btn-primary flex items-center gap-2 bg-danger-600 hover:bg-danger-700"
                >
                  <XCircleIcon className="w-4 h-4" />
                  审核驳回
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            {inspection.car && (
              <div className="card p-6">
                <h2 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary-700" />
                  车辆信息
                </h2>
                <div className="flex items-start gap-6">
                  {inspection.car.images && inspection.car.images[0] ? (
                    <img
                      src={inspection.car.images[0]}
                      alt=""
                      className="w-32 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-32 h-24 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <CarIcon className="w-12 h-12 text-neutral-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-neutral-800 mb-2">
                      {inspection.car.brand} {inspection.car.model}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-500">VIN码</p>
                        <p className="font-mono font-medium text-neutral-700">{inspection.car.vin}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">出厂日期</p>
                        <p className="font-medium text-neutral-700">{inspection.car.year}年{inspection.car.month}月</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">表显里程</p>
                        <p className="font-medium text-neutral-700">{(inspection.car.mileage / 10000).toFixed(1)}万公里</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">售价</p>
                        <p className="font-medium text-primary-700">{formatPrice(inspection.car.price)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={`card p-8 bg-gradient-to-r ${getScoreBgColor(inspection.overallScore)} text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-2xl mb-2">综合评分</h2>
                  <p className="text-white/80 text-lg">{inspection.overallComment}</p>
                </div>
                <div className="text-right">
                  <div className={`text-7xl font-bold ${getScoreColor(inspection.overallScore)} bg-white rounded-2xl px-6 py-3`}>
                    {inspection.overallScore}
                  </div>
                  <p className="text-white/60 text-sm mt-2">满分 100 分</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {renderInspectionCard('事故检测', CarIcon, inspection.accident, inspection.accident.images)}
              {renderInspectionCard('水泡检测', Droplets, inspection.waterDamage, inspection.waterDamage.images)}
              {renderInspectionCard('火烧检测', Flame, inspection.fireDamage, inspection.fireDamage.images)}
            </div>

            <div className="card p-6">
              <h2 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary-700" />
                维保记录
              </h2>
              {inspection.maintenance && inspection.maintenance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">日期</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">里程(公里)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">保养项目</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">费用(元)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">门店</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {inspection.maintenance.map((record: MaintenanceRecord, index: number) => (
                        <tr key={index} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-sm text-neutral-700">{record.date}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{record.mileage.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{record.item}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{record.cost.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{record.shop}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty message="暂无维保记录" icon={Wrench} />
              )}
            </div>

            <div className="card p-6">
              <h2 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-primary-700" />
                漆面检测
              </h2>
              {inspection.paintwork && inspection.paintwork.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inspection.paintwork.map((item: PaintworkItem, index: number) => (
                    <div key={index} className={`p-4 rounded-lg border-2 ${
                      !item.originalPaint || item.repainted || item.sheetMetal
                        ? 'border-danger-300 bg-danger-50/50'
                        : 'border-neutral-200 bg-neutral-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-neutral-800">{item.position}</h4>
                        <div className="flex items-center gap-2">
                          {!item.originalPaint && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-danger-100 text-danger-700 rounded">
                              非原漆
                            </span>
                          )}
                          {item.repainted && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-warning-100 text-warning-700 rounded">
                              补漆
                            </span>
                          )}
                          {item.sheetMetal && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-danger-100 text-danger-700 rounded">
                              钣金
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty message="暂无漆面检测记录" icon={Paintbrush} />
              )}
            </div>

            <div className="card p-6">
              <h2 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                <CarIcon className="w-5 h-5 text-primary-700" />
                路试结果
              </h2>
              {inspection.roadTest ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-500 mb-1">发动机</p>
                    <p className="font-medium text-neutral-800">{inspection.roadTest.engine}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-500 mb-1">变速箱</p>
                    <p className="font-medium text-neutral-800">{inspection.roadTest.transmission}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-500 mb-1">刹车系统</p>
                    <p className="font-medium text-neutral-800">{inspection.roadTest.brake}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-500 mb-1">转向系统</p>
                    <p className="font-medium text-neutral-800">{inspection.roadTest.steering}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-500 mb-1">悬挂系统</p>
                    <p className="font-medium text-neutral-800">{inspection.roadTest.suspension}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-500 mb-1">综合评价</p>
                    <p className="font-medium text-neutral-800">{inspection.roadTest.overall}</p>
                  </div>
                </div>
              ) : (
                <Empty message="暂无路试结果" icon={CarIcon} />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-700" />
                检测师信息
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {inspection.inspector?.name?.charAt(0) || '检'}
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">{inspection.inspector?.name || '-'}</p>
                  <p className="text-sm text-neutral-500">检测师</p>
                </div>
              </div>
            </div>

            {inspection.auditor && (
              <div className="card p-6">
                <h2 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary-700" />
                  审核信息
                </h2>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-700 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {inspection.auditor.name?.charAt(0) || '审'}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800">{inspection.auditor.name}</p>
                    <p className="text-sm text-neutral-500">审核员</p>
                  </div>
                </div>
                {inspection.auditComment && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-600">{inspection.auditComment}</p>
                  </div>
                )}
                {inspection.auditedAt && (
                  <p className="text-xs text-neutral-500 mt-3">
                    审核时间：{formatDate(inspection.auditedAt)}
                  </p>
                )}
              </div>
            )}

            <div className="card p-6">
              <h2 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-700" />
                报告时间线
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200" />
                <div className="space-y-4">
                  <div className="relative flex gap-4">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center z-10">
                      <ClipboardCheck className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-medium text-neutral-800">创建报告</p>
                      <p className="text-sm text-neutral-500">{formatDate(inspection.createdAt)}</p>
                    </div>
                  </div>
                  {inspection.auditedAt && (
                    <div className="relative flex gap-4">
                      <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center z-10">
                        <CheckCircle className="w-4 h-4 text-success-600" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-medium text-neutral-800">
                          {inspection.status === 'approved' ? '审核通过' : '审核驳回'}
                        </p>
                        <p className="text-sm text-neutral-500">{formatDate(inspection.auditedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {inspection.car && (
              <div className="card p-6">
                <Link
                  to={`/cars/${inspection.carId}`}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Car className="w-4 h-4" />
                  查看车源详情
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        title={
          confirmModal.type === 'submit' ? '提交审核' :
          confirmModal.type === 'approve' ? '审核通过' : '审核驳回'
        }
        message={
          confirmModal.type === 'submit' ? '确定要提交该检测报告进行审核吗？提交后将无法修改。' :
          confirmModal.type === 'approve' ? '确定要通过该检测报告吗？' : '确定要驳回该检测报告吗？'
        }
        confirmText={
          confirmModal.type === 'submit' ? '提交' :
          confirmModal.type === 'approve' ? '通过' : '驳回'
        }
        confirmButtonClass={confirmModal.type === 'reject' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-primary-700 hover:bg-primary-800'}
        onConfirm={() => {
          if (confirmModal.type === 'submit') {
            handleSubmit();
          } else {
            handleAudit(confirmModal.type === 'approve');
          }
        }}
        onCancel={() => setConfirmModal({ open: false, type: 'submit' })}
      />
    </div>
  );
}
