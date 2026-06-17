import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles, Baby, ChefHat, MapPin, Clock, Phone, User,
  ArrowLeft, AlertTriangle, MessageCircle, ShieldCheck,
  FileText, Receipt, ChevronDown, ChevronUp, ChevronRight, Star, Zap, Award,
  Shield, FileCheck, Users, Timer, TrendingUp,
  CheckCircle, CircleDollarSign, Gift, UserCheck,
  Mic, BarChart3, Navigation, Eye, ThumbsUp, ThumbsDown,
  Play, XCircle, AlertCircle, ScanLine, History,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAppStore } from '@/store';
import { useWorkerStore } from '@/store/useWorkerStore';
import type { Order, OrderStatus, ServiceNode, CompensationRecord, QARecordDetail, OCRField, ReviewRecord, DispatchRecord } from '@/types';
import { cn } from '@/lib/utils';

const serviceIconMap = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

function getStatusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, { className: string; label: string }> = {
    pending: { className: 'badge-gray', label: '待派单' },
    assigned: { className: 'badge-blue', label: '已派单' },
    accepted: { className: 'badge-blue', label: '已接单' },
    departing: { className: 'badge-orange', label: '已出发' },
    arrived: { className: 'badge-orange', label: '已到达' },
    servicing: { className: 'badge-orange', label: '服务中' },
    completed: { className: 'badge-green', label: '已完成' },
    cancelled: { className: 'badge-gray', label: '已取消' },
    compensated: { className: 'badge-red', label: '已赔付' },
  };
  return map[status];
}

const nodeIconMap: Record<string, typeof CheckCircle> = {
  order_created: Zap,
  assigned: Navigation,
  accepted: UserCheck,
  departing: MapPin,
  arrived: Navigation,
  servicing: Sparkles,
  completed: CheckCircle,
};

const certConfig = [
  { key: 'id_card' as const, label: '身份证', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'health_cert' as const, label: '健康证', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'crime_record' as const, label: '无犯罪记录', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
];

function ConfidenceTag({ confidence }: { confidence: number }) {
  const cls = confidence >= 98 ? 'bg-green-100 text-green-700' : confidence >= 95 ? 'bg-yellow-100 text-yellow-700' : confidence >= 70 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
  return <span className={cn('text-[9px] px-1 py-0.5 rounded-full font-medium', cls)}>{confidence}%</span>;
}

function WorkerCertSection({ order }: { order: Order }) {
  const getCertByWorkerId = useWorkerStore((s) => s.getCertByWorkerId);
  const getScoreByWorkerId = useWorkerStore((s) => s.getScoreByWorkerId);
  const cert = order.worker_id ? getCertByWorkerId(order.worker_id) : undefined;
  const score = order.worker_id ? getScoreByWorkerId(order.worker_id) : undefined;
  const [showCertDetail, setShowCertDetail] = useState(false);

  const distanceWeight = 0.4;
  const satisfactionWeight = 0.5;
  const complaintWeight = 0.1;
  const weightedScore = score ? Math.round((score.punctuality_rate * distanceWeight + score.satisfaction_rate * satisfactionWeight + (100 - score.complaint_rate * 10) * complaintWeight) / 10) / 10 : null;

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-secondary-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          服务阿姨 · 三证强管控
        </h2>
        <button
          onClick={() => setShowCertDetail(!showCertDetail)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all',
            showCertDetail
              ? 'bg-secondary-100 text-secondary-600'
              : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm hover:shadow-md hover:-translate-y-px'
          )}
        >
          {showCertDetail ? (
            <><ChevronUp className="w-3 h-3" />收起详情</>
          ) : (
            <><ScanLine className="w-3 h-3" />查看三证详情</>
          )}
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <User className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <p className="font-bold text-secondary-800 text-lg">{order.worker_name}</p>
            {order.worker_score && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-secondary-700">{order.worker_score}</span>
              </div>
            )}
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
              三证齐全
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-secondary-500">{order.worker_phone}</span>
            {order.distance_km && (
              <span className="flex items-center gap-1 text-blue-600">
                <MapPin className="w-3 h-3" />{order.distance_km}km
              </span>
            )}
            <span className="flex items-center gap-1 text-primary-500">
              <Navigation className="w-3 h-3" />1km优先派单
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${order.worker_phone}`} className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors">
            <Phone className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {certConfig.map((item) => {
          const certData = cert?.ocr_detail?.[item.key];
          const Icon = item.icon;
          const status = cert?.verify_status === 'approved' ? 'verified' : 'pending';
          return (
            <button
              key={item.key}
              onClick={() => setShowCertDetail(true)}
              className={cn('rounded-xl p-2.5 text-center transition-all hover:scale-105 cursor-pointer', item.bg)}
            >
              <Icon className={cn('w-5 h-5 mx-auto mb-1', item.color)} />
              <p className="text-xs font-bold text-secondary-800">{item.label}</p>
              {certData && <ConfidenceTag confidence={certData.confidence} />}
              <p className={cn('text-[9px] mt-0.5', status === 'verified' ? 'text-green-600' : 'text-yellow-600')}>
                {status === 'verified' ? '✓ 已核验' : '⏳ 待复核'}
              </p>
            </button>
          );
        })}
      </div>

      {!showCertDetail && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-3 mb-4 border border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-medium text-primary-700">OCR自动识别 + 人工复核双校验</span>
            </div>
            <button
              onClick={() => setShowCertDetail(true)}
              className="text-[10px] text-primary-600 font-medium flex items-center gap-0.5 hover:text-primary-700"
            >
              查看详情
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-[9px]">
            <div className="text-center">
              <p className="text-secondary-600 font-bold text-[11px]">21项</p>
              <p className="text-secondary-400">识别字段</p>
            </div>
            <div className="text-center">
              <p className="text-secondary-600 font-bold text-[11px]">2-4轮</p>
              <p className="text-secondary-400">人工复核</p>
            </div>
            <div className="text-center">
              <p className="text-secondary-600 font-bold text-[11px]">100%</p>
              <p className="text-secondary-400">留痕可追溯</p>
            </div>
          </div>
        </div>
      )}

      {score && (
        <div className="rounded-xl bg-cream-100 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-secondary-800">动态加权评分</span>
            <span className="text-xs text-orange-600 font-bold">{weightedScore}分</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div className="text-center px-2 py-1.5 rounded-lg bg-blue-50">
              <p className="text-blue-600 font-bold text-[11px]">{score.punctuality_rate}%</p>
              <p className="text-secondary-500">准时率 · 40%</p>
            </div>
            <div className="text-center px-2 py-1.5 rounded-lg bg-green-50">
              <p className="text-green-600 font-bold text-[11px]">{score.satisfaction_rate}%</p>
              <p className="text-secondary-500">好评率 · 50%</p>
            </div>
            <div className="text-center px-2 py-1.5 rounded-lg bg-red-50">
              <p className="text-red-600 font-bold text-[11px]">{score.complaint_rate}%</p>
              <p className="text-secondary-500">投诉率 · 10%</p>
            </div>
          </div>
        </div>
      )}

      {showCertDetail && cert && (
        <div className="animate-fade-up space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <ScanLine className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-bold text-secondary-800">① 三证逐证OCR识别结果</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600">
              21项字段 · 置信度标注
            </span>
          </div>

          <div className="space-y-3">
            {certConfig.map((item) => {
              const certData = cert.ocr_detail?.[item.key];
              if (!certData) return null;
              const Icon = item.icon;
              const lowFields = certData.fields.filter(f => f.confidence !== undefined && f.confidence < 80);
              const overallOk = certData.confidence >= 95;
              return (
                <div key={item.key} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className={cn('px-3 py-2.5 flex items-center justify-between', item.bg)}>
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn('w-4 h-4', item.color)} />
                      <span className="text-xs font-bold text-secondary-800">{item.label}</span>
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                        overallOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {overallOk ? '识别完整' : '存在低置信字段'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-secondary-500">置信度</span>
                      <ConfidenceTag confidence={certData.confidence} />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {certData.fields.map((field, fi) => (
                        <div key={fi} className={cn(
                          'flex items-center justify-between text-[10px] py-1 px-2 rounded-md',
                          field.confidence !== undefined && field.confidence < 80
                            ? 'bg-red-50 border border-red-100'
                            : 'bg-secondary-50'
                        )}>
                          <span className="text-secondary-500 flex-shrink-0 mr-2">{field.label}</span>
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-secondary-800 font-medium truncate">{field.value}</span>
                            {field.confidence !== undefined && <ConfidenceTag confidence={field.confidence} />}
                          </div>
                        </div>
                      ))}
                    </div>
                    {lowFields.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-[9px] text-red-700 font-medium">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          低置信字段需人工复核：{lowFields.map(f => f.label).join('、')}
                        </p>
                      </div>
                    )}
                    <p className="text-[8px] text-secondary-300 mt-2 text-right">OCR识别时间：{new Date(certData.ocr_time).toLocaleString('zh-CN')}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-secondary-800">② 复核结论与留痕时间线</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                审核通过 · 留痕{cert.review_history?.length || 0}条
              </span>
            </div>

            <div className={cn(
              'rounded-xl p-3 border-2 mb-3',
              cert.verify_status === 'approved' ? 'bg-green-50 border-green-200' : cert.verify_status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4" />
                <span className="text-xs font-bold text-secondary-800">复核结论</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-[10px]">
                  <span className="text-secondary-500">当前状态：</span>
                  <span className={cn(
                    'font-bold',
                    cert.verify_status === 'approved' ? 'text-green-700' : cert.verify_status === 'rejected' ? 'text-red-700' : 'text-yellow-700'
                  )}>
                    {cert.verify_status === 'approved' ? '✓ 审核通过' : cert.verify_status === 'rejected' ? '✗ 审核驳回' : '⏳ 待复核'}
                  </span>
                </div>
                <div className="text-[10px]">
                  <span className="text-secondary-500">复核人：</span>
                  <span className="text-secondary-700 font-medium">
                    {cert.review_history?.find(r => r.type === 'recheck')?.reviewer || '初审专员-刘芳'}
                  </span>
                </div>
                <div className="text-[10px]">
                  <span className="text-secondary-500">OCR完成：</span>
                  <span className="text-secondary-700">{cert.ocr_completed_at ? new Date(cert.ocr_completed_at).toLocaleString('zh-CN') : '—'}</span>
                </div>
                <div className="text-[10px]">
                  <span className="text-secondary-500">留痕完成：</span>
                  <span className="text-secondary-700">{cert.review_completed_at ? new Date(cert.review_completed_at).toLocaleString('zh-CN') : '—'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-0">
              {cert.review_history?.map((record, ri) => {
                const isLast = ri === cert.review_history!.length - 1;
                const certTypeLabel: Record<string, string> = { ocr: 'OCR自动识别', manual: '人工复核', recheck: '季度复查' };
                const isReject = record.result === 'reject';
                return (
                  <div key={record.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', isReject ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')}>
                        {isReject ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </div>
                      {!isLast && <div className={cn('w-0.5 h-8 mt-0.5', isReject ? 'bg-red-200' : 'bg-green-200')} />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-secondary-800">{record.reviewer}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary-100 text-secondary-600">{certTypeLabel[record.type] || record.type}</span>
                        <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full font-bold', isReject ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                          {isReject ? '✗ 驳回' : '✓ 通过'}
                        </span>
                      </div>
                      <p className="text-[9px] text-secondary-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        留痕时间：{new Date(record.review_time).toLocaleString('zh-CN')}
                      </p>
                      <p className="text-[10px] mt-1 text-secondary-600 leading-relaxed bg-cream-100 rounded-lg p-2">{record.remark}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-secondary-800">③ 异常处置与派单资格拦截</h3>
            </div>

            {cert.review_history?.some(r => r.result === 'reject') ? (
              <div className="space-y-2">
                {cert.review_history?.filter(r => r.result === 'reject').map((record, ri) => (
                  <div key={ri} className="bg-red-50 rounded-lg p-3 border border-red-100">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-red-700">驳回记录 #{ri + 1}</span>
                      <span className="text-[9px] text-red-500">{new Date(record.review_time).toLocaleString('zh-CN')}</span>
                    </div>
                    <p className="text-xs text-red-600 mb-1.5">驳回人：{record.reviewer}</p>
                    <p className="text-xs text-red-600 mb-1.5">驳回原因：{record.remark}</p>
                    <div className="flex items-center gap-1.5 bg-white rounded p-2 border border-red-200">
                      <AlertCircle className="w-3 h-3 text-orange-500" />
                      <span className="text-[10px] text-orange-700 font-medium">处置：证件驳回，要求重新提交完整材料，暂停派单资格直至复核通过</span>
                    </div>
                  </div>
                ))}

                {cert.verify_status === 'approved' && cert.review_history?.some(r => r.type === 'recheck' && r.result === 'pass') && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-bold text-green-700">复核改判</span>
                    </div>
                    <p className="text-xs text-green-600">
                      经复查后改判通过，恢复派单资格。改判人：{cert.review_history?.find(r => r.type === 'recheck' && r.result === 'pass')?.reviewer || '—'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-green-700">三证均无异常，派单资格正常</span>
                </div>
              </div>
            )}

            <div className="mt-3 bg-yellow-50 rounded-lg p-3 border border-yellow-100">
              <div className="flex items-center gap-1.5 mb-2">
                <History className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-800">证件有效期与重审规则</span>
              </div>
              <div className="space-y-1.5 text-[10px] text-yellow-700">
                <p>• 身份证：长期有效，信息变更需重新提交OCR识别</p>
                <p>• 健康证：有效期1年，到期前30天自动触发重审，超期暂停派单</p>
                <p>• 无犯罪记录：有效期6个月，到期前15天提醒更新，超期暂停派单</p>
                <p>• 季度复查：每90天执行一次全量复核，确保信息持续有效</p>
              </div>
              {cert.ocr_completed_at && (
                <p className="text-[9px] text-yellow-500 mt-2 pt-1.5 border-t border-yellow-200">
                  最近OCR识别：{new Date(cert.ocr_completed_at).toLocaleString('zh-CN')} · 下次季度复查：{new Date(new Date(cert.ocr_completed_at).getTime() + 90 * 24 * 3600 * 1000).toLocaleDateString('zh-CN')}
                </p>
              )}
            </div>

            <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-blue-800">派单资格拦截规则</span>
              </div>
              <div className="space-y-1 text-[10px] text-blue-700">
                <p>• 三证任一审核驳回 → 立即暂停派单资格</p>
                <p>• 健康证/无犯罪记录超期 → 自动移出派单队列</p>
                <p>• 季度复查未通过 → 暂停派单直至整改完成</p>
                <p>• 人工改判通过 → 恢复派单资格，全程留痕可追溯</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NodeTimelineSection({ nodes, status }: { nodes: ServiceNode[]; status: OrderStatus }) {
  if (nodes.length === 0) return null;
  const isFinished = status === 'completed' || status === 'compensated' || status === 'cancelled';

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-bold text-secondary-800 mb-5 flex items-center gap-2">
        <Navigation className="w-5 h-5 text-primary-500" />
        履约节点追踪
        <span className="text-xs text-secondary-400 font-normal ml-1">{nodes.length}个节点</span>
      </h2>
      <div className="space-y-0">
        {nodes.map((node, i) => {
          const isDone = i < nodes.length - 1 || isFinished;
          const isCurrent = !isDone;
          const Icon = nodeIconMap[node.node_type] || CheckCircle;
          return (
            <div key={node.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                  isDone
                    ? 'bg-primary-500 text-white shadow-soft'
                    : isCurrent
                      ? 'bg-primary-100 text-primary-600 ring-4 ring-primary-200 animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                {i < nodes.length - 1 && (
                  <div className={cn('w-0.5 h-10', isDone ? 'bg-primary-300' : 'bg-gray-200')} />
                )}
              </div>
              <div className="pb-6 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-bold text-sm',
                      isDone ? 'text-secondary-800' : isCurrent ? 'text-primary-600' : 'text-gray-400'
                    )}>
                      {node.node_label}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 animate-pulse">
                        当前节点
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    isDone ? 'text-primary-600' : isCurrent ? 'text-primary-500' : 'text-gray-400'
                  )}>
                    {node.node_time.slice(11, 16)}
                  </span>
                </div>
                <p className={cn(
                  'text-xs mt-0.5',
                  isDone ? 'text-secondary-500' : 'text-secondary-400'
                )}>
                  {node.node_time.slice(0, 10)}
                </p>
                {node.remark && (
                  <p className={cn(
                    'text-xs mt-1 px-3 py-1.5 rounded-lg inline-block',
                    isDone ? 'bg-secondary-50 text-secondary-600' : 'bg-primary-50 text-primary-600'
                  )}>
                    {node.remark}
                  </p>
                )}
                {isDone && (
                  <div className="mt-1.5 flex items-center gap-2 text-[9px]">
                    <span className="text-secondary-400 flex items-center gap-0.5">
                      <Phone className="w-2.5 h-2.5" />
                      已推送APP通知
                    </span>
                    <span className="text-secondary-400 flex items-center gap-0.5">
                      <MessageCircle className="w-2.5 h-2.5" />
                      已发送短信提醒
                    </span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded font-medium',
                      'bg-green-50 text-green-600'
                    )}>
                      ✓ 用户已收到
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DispatchRecordSection({ records, onReassign }: { records: DispatchRecord[]; onReassign: () => void }) {
  if (!records || records.length === 0) return null;

  const actionConfig = {
    system_assign: { icon: Zap, label: '系统派单', color: 'bg-blue-100 text-blue-600', line: 'bg-blue-200' },
    manual_reassign: { icon: Users, label: '人工改派', color: 'bg-orange-100 text-orange-600', line: 'bg-orange-200' },
    worker_accept: { icon: CheckCircle, label: '阿姨接单', color: 'bg-green-100 text-green-600', line: 'bg-green-200' },
    dispatch_audit: { icon: UserCheck, label: '调度复核', color: 'bg-purple-100 text-purple-600', line: 'bg-purple-200' },
  };

  const hasReassign = records.some(r => r.action === 'manual_reassign');
  const latestRec = records[records.length - 1];

  return (
    <div className="card p-6 mb-6 border-l-4 border-l-blue-400">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-secondary-800 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-500" />
          调度记录 · 1km优先派单 + 动态加权
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
            共{records.length}条记录
          </span>
          {!hasReassign && (
            <button
              onClick={onReassign}
              className="text-[10px] px-2 py-1 rounded-md bg-orange-50 text-orange-600 font-medium hover:bg-orange-100 transition-colors flex items-center gap-1"
            >
              <Users className="w-3 h-3" />改派阿姨
            </button>
          )}
        </div>
      </div>

      <div className="space-y-0">
        {records.map((rec, ri) => {
          const cfg = actionConfig[rec.action] || actionConfig.system_assign;
          const Icon = cfg.icon;
          const isLast = ri === records.length - 1;
          const methodLabel = {
            heatmap_1km: '热力图调度（1km优先）',
            weighted_score: '动态加权评分',
            manual: '人工手动指定',
          };
          return (
            <div key={rec.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', cfg.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                {!isLast && <div className={cn('w-0.5 h-6 mt-0.5', cfg.line)} />}
              </div>
              <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-secondary-800">{cfg.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary-100 text-secondary-600">
                      {methodLabel[rec.dispatch_method] || rec.dispatch_method}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-600">
                      {rec.worker_name}
                    </span>
                  </div>
                  <span className="text-[10px] text-secondary-400">{rec.action_time}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-[9px]">
                  <span className="flex items-center gap-1 text-secondary-500">
                    <UserCheck className="w-3 h-3" />操作人：{rec.operator}
                  </span>
                  {rec.weighted_score !== undefined && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 font-medium">综合{rec.weighted_score.toFixed(1)}</span>
                  )}
                  {rec.distance_km !== undefined && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">距离{rec.distance_km}km</span>
                  )}
                  {rec.satisfaction_rate !== undefined && (
                    <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-600">好评{rec.satisfaction_rate}%</span>
                  )}
                  {rec.complaint_rate !== undefined && (
                    <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600">投诉{rec.complaint_rate}%</span>
                  )}
                </div>
                {rec.reason && (
                  <p className="text-[10px] text-secondary-600 mt-1.5 leading-relaxed bg-cream-100 rounded-lg p-2">
                    {rec.reason}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasReassign && latestRec && (
        <div className="mt-2 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
          <div className="flex items-center gap-1.5 text-[10px] text-orange-700 font-medium mb-1">
            <Users className="w-3 h-3" />
            已完成改派闭环
          </div>
          <div className="text-[9px] text-orange-600">
            原阿姨已释放 → 新阿姨{latestRec.worker_name}已确认接单 → 调度复核已通过 → 订单状态已同步推进
          </div>
        </div>
      )}

      <div className="mt-2 pt-3 border-t border-dashed border-gray-200 grid grid-cols-3 gap-1.5 text-[9px]">
        <div className="text-center px-1.5 py-1 rounded-md bg-purple-50">
          <p className="text-purple-600 font-bold text-[11px]">40%</p>
          <p className="text-secondary-500">准时率权重</p>
        </div>
        <div className="text-center px-1.5 py-1 rounded-md bg-green-50">
          <p className="text-green-600 font-bold text-[11px]">50%</p>
          <p className="text-secondary-500">好评权重</p>
        </div>
        <div className="text-center px-1.5 py-1 rounded-md bg-red-50">
          <p className="text-red-600 font-bold text-[11px]">10%</p>
          <p className="text-secondary-500">投诉权重</p>
        </div>
      </div>
    </div>
  );
}

function ReassignPanel({ order, currentWorkerId, onReassign, onClose, reassignReason, setReassignReason }: {
  order: Order;
  currentWorkerId: number;
  onReassign: (newWorkerId: number, reason: string) => void;
  onClose: () => void;
  reassignReason: string;
  setReassignReason: (v: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const getDispatchQueue = useAppStore((state) => state.getDispatchQueue);
  const workers = getDispatchQueue(order.address?.includes('朝阳') ? 1 : 2, order.service_type).filter(w => w.id !== currentWorkerId);
  const getCertByWorkerId = useWorkerStore((s) => s.getCertByWorkerId);
  const getScoreByWorkerId = useWorkerStore((s) => s.getScoreByWorkerId);

  const handleConfirm = () => {
    if (!selectedId) return;
    setSubmitting(true);
    setTimeout(() => {
      onReassign(selectedId, reassignReason || '用户主动改派');
      setSubmitting(false);
    }, 600);
  };

  return (
    <div className="card p-6 mb-6 border-l-4 border-l-orange-400 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-secondary-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-500" />
          改派阿姨 · 动态加权重排
        </h3>
        <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-3 p-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
        <p className="text-[10px] text-yellow-700">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          当前阿姨：{order.worker_name}（ID:{currentWorkerId}）→ 改派后原阿姨释放，新阿姨按1km优先+动态加权重新匹配
        </p>
      </div>

      <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
        {workers.slice(0, 5).map((w, i) => {
          const cert = getCertByWorkerId(w.id);
          const score = getScoreByWorkerId(w.id);
          const isCurrent = selectedId === w.id;
          const certOk = cert?.verify_status === 'approved';
          return (
            <button
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              className={cn(
                'w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left',
                isCurrent ? 'bg-primary-50 border-2 border-primary-300 ring-2 ring-primary-100' : 'bg-cream-100 border border-transparent hover:border-gray-200'
              )}
            >
              <div className="relative flex-shrink-0">
                <img src={w.avatar} alt={w.real_name} className="w-9 h-9 rounded-full bg-secondary-100" />
                <div className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white',
                  isCurrent ? 'bg-primary-500' : i === 0 ? 'bg-orange-500' : 'bg-gray-400'
                )}>
                  {isCurrent ? '✓' : i + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-secondary-800">{w.real_name}</span>
                  <span className={cn('text-[8px] px-1 py-0 rounded', certOk ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                    {certOk ? '三证齐全' : '审核中'}
                  </span>
                  <span className="text-[9px] text-secondary-400">·{w.experience_years}年</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[9px]">
                  <span className="text-blue-600">{w.distance_km}km</span>
                  <span className="text-secondary-300">|</span>
                  <span className="text-green-600">好评{w.satisfaction_rate}%</span>
                  <span className="text-secondary-300">|</span>
                  <span className="text-red-600">投诉{w.complaint_rate}%</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-orange-600">{(w.weighted_score || 90).toFixed(1)}</p>
                <p className="text-[8px] text-secondary-400">综合分</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-3">
        <label className="text-[10px] text-secondary-500 mb-1 block">改派原因（选填）</label>
        <input
          type="text"
          value={reassignReason}
          onChange={(e) => setReassignReason(e.target.value)}
          placeholder="如：阿姨迟到、服务质量不满意等"
          className="w-full input-field text-xs py-2"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleConfirm}
          disabled={!selectedId || submitting}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-medium transition-colors',
            selectedId && !submitting ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-1">
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              改派中...
            </span>
          ) : '确认改派并推进状态'}
        </button>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs text-secondary-600 bg-secondary-50 hover:bg-secondary-100 transition-colors">
          取消
        </button>
      </div>
    </div>
  );
}

function CompensationRecordSection({ compensation }: { compensation: CompensationRecord }) {
  return (
    <div className="card p-6 mb-6 border-l-4 border-l-red-400">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
            <Gift className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-secondary-800">赔付记录</h2>
            <p className="text-xs text-secondary-500">
              {compensation.trigger_type === 'auto' ? '系统自动触发' : '人工申请'}
            </p>
          </div>
        </div>
        <span className={cn(
          'px-3 py-1 rounded-full text-xs font-medium',
          compensation.status === 'paid' ? 'bg-green-100 text-green-700'
            : compensation.status === 'approved' ? 'bg-blue-100 text-blue-700'
              : 'bg-yellow-100 text-yellow-700'
        )}>
          {compensation.status === 'paid' ? '已到账' : compensation.status === 'approved' ? '审核通过' : '处理中'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <CircleDollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-600">¥{compensation.refund_amount}</p>
          <p className="text-xs text-green-600 mt-0.5">全额退款</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
          <Gift className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-orange-600">¥{compensation.coupon_amount}</p>
          <p className="text-xs text-orange-600 mt-0.5">补偿券</p>
        </div>
      </div>

      <div className="bg-secondary-50 rounded-xl p-4 space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-500">赔付原因</span>
          <span className="text-secondary-800 font-medium">{compensation.reason_category}</span>
        </div>
        <div className="flex items-start justify-between text-sm">
          <span className="text-secondary-500 flex-shrink-0">详细说明</span>
          <span className="text-secondary-700 text-right max-w-[65%]">{compensation.reason}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-500">补偿券码</span>
          <span className="text-primary-600 font-mono font-bold">{compensation.coupon_code}</span>
        </div>
        {compensation.auditor && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-500">审核人</span>
            <span className="text-secondary-700">{compensation.auditor}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-secondary-700 mb-1">赔付进度</p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-secondary-600">申请提交</span>
            </div>
            <p className="text-xs text-secondary-400 pl-6">{compensation.created_at}</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {compensation.approved_at ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Timer className="w-4 h-4 text-yellow-500" />}
              <span className="text-xs text-secondary-600">审核通过</span>
            </div>
            {compensation.approved_at && <p className="text-xs text-secondary-400 pl-6">{compensation.approved_at}</p>}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {compensation.paid_at ? <CircleDollarSign className="w-4 h-4 text-green-500" /> : <Timer className="w-4 h-4 text-yellow-500" />}
              <span className="text-xs text-secondary-600">到账完成</span>
            </div>
            {compensation.paid_at && <p className="text-xs text-green-600 font-medium pl-6">{compensation.paid_at} · 24小时内极速到账</p>}
          </div>
        </div>
      </div>

      {compensation.description && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <p className="text-xs text-yellow-800 leading-relaxed">{compensation.description}</p>
        </div>
      )}
    </div>
  );
}

function QARecordSection({ qa }: { qa: QARecordDetail }) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div id="qa-record" className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Mic className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-secondary-800">服务质检与回溯</h2>
            <p className="text-xs text-secondary-500">录音转文字 · 差评根因 · 审计留痕</p>
          </div>
        </div>
        <span className={cn(
          'px-3 py-1 rounded-full text-xs font-medium',
          qa.review_conclusion === 'pass' ? 'bg-green-100 text-green-700'
            : qa.review_conclusion === 'warning' ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
        )}>
          质检{qa.review_conclusion === 'pass' ? '通过' : qa.review_conclusion === 'warning' ? '警告' : '不通过'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
          <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1 fill-yellow-500" />
          <p className="text-xl font-bold text-yellow-700">{qa.rating}</p>
          <p className="text-[10px] text-yellow-600">客户评分</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-700">{qa.compliance_rate}%</p>
          <p className="text-[10px] text-green-600">质检合规率</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <Award className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-blue-700">{qa.complaint_count === 0 ? '0' : qa.complaint_count}</p>
          <p className="text-[10px] text-blue-600">投诉次数</p>
        </div>
      </div>

      <div className="bg-secondary-50 rounded-xl p-4 mb-4 space-y-2">
        <div className="flex items-center gap-1.5 text-sm text-secondary-700 font-medium mb-2">
          <BarChart3 className="w-4 h-4" />
          差评根因分析
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-secondary-500">根因分类</span>
            <span className={cn('font-medium', qa.complaint_count > 0 ? 'text-red-600' : 'text-green-600')}>
              {qa.root_cause_category}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary-500">具体原因</span>
            <span className="text-secondary-700 font-medium text-right max-w-[60%] truncate">{qa.root_cause}</span>
          </div>
        </div>
        <p className="text-xs text-secondary-600 leading-relaxed pt-1 border-t border-secondary-200">
          {qa.root_cause_detail}
        </p>
      </div>

      {qa.keywords && qa.keywords.length > 0 && (
        <div className="bg-primary-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-primary-700 font-medium mb-2">
            <Eye className="w-4 h-4" />
            关键词合规检测
            <span className="text-xs text-primary-500 font-normal">· 命中{qa.keywords.filter(k => k.hit).length}/{qa.keywords.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {qa.keywords.map((kw, i) => (
              <span
                key={i}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-medium',
                  kw.hit
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                )}
              >
                {kw.hit ? '✓' : '○'} {kw.text}
                {kw.count > 0 && <span className="ml-1 opacity-70">({kw.count})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-cream-100 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-sm text-secondary-700 font-medium">
            <Mic className="w-4 h-4" />
            录音转文字
            <span className="text-xs text-secondary-400 font-normal">
              · 时长{Math.floor(qa.audio_duration / 60)}分{qa.audio_duration % 60}秒
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors">
              <Play className="w-3 h-3" />
              播放录音
            </button>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-1 px-3 py-1 bg-secondary-50 text-secondary-600 rounded-lg text-xs font-medium hover:bg-secondary-100 transition-colors"
            >
              <FileText className="w-3 h-3" />
              {showTranscript ? '收起' : '展开原文'}
            </button>
          </div>
        </div>
        <p className="text-sm text-secondary-600 leading-relaxed">{qa.transcript_summary}</p>
        {showTranscript && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-secondary-200 text-xs text-secondary-600 leading-relaxed whitespace-pre-line animate-fade-up">
            {qa.transcript_text}
          </div>
        )}
      </div>

      {qa.qa_status === 'completed' && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-1.5 text-sm text-blue-700 font-medium mb-3">
            <UserCheck className="w-4 h-4" />
            质检审计留痕
          </div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="text-sm">
              <span className="text-secondary-500">复查人：</span>
              <span className="text-secondary-800 font-medium">{qa.reviewer}</span>
            </div>
            <div className="text-sm">
              <span className="text-secondary-500">复查时间：</span>
              <span className="text-secondary-800">{qa.review_time}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm mb-2">
            <span className="text-secondary-500">质检结论：</span>
            <span className={cn(
              'font-medium',
              qa.review_conclusion === 'pass' ? 'text-green-600'
                : qa.review_conclusion === 'warning' ? 'text-yellow-600'
                  : 'text-red-600'
            )}>
              {qa.review_conclusion === 'pass' ? '通过' : qa.review_conclusion === 'warning' ? '警告' : '不通过'}
            </span>
          </div>
          {qa.review_remark && (
            <div className="text-sm bg-white/60 rounded-lg p-3 mt-2">
              <span className="text-secondary-500">复查意见：</span>
              <span className="text-secondary-700">{qa.review_remark}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orders = useAppStore((state) => state.orders);
  const advanceOrderStatus = useAppStore((state) => state.advanceOrderStatus);
  const reassignWorker = useAppStore((state) => state.reassignWorker);
  const order = orders.find((o) => o.id === Number(id)) as Order | undefined;

  const [showCompensation, setShowCompensation] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [compensationDesc, setCompensationDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [reassignReason, setReassignReason] = useState('');

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-secondary-800 mb-4">订单不存在</h1>
          <Link to="/orders" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            返回订单列表
          </Link>
        </div>
      </div>
    );
  }

  const Icon = serviceIconMap[order.service_type];
  const badge = getStatusBadge(order.status);
  const isOngoing = ['pending', 'assigned', 'accepted', 'departing', 'arrived', 'servicing'].includes(order.status);
  const isCompleted = order.status === 'completed' || order.status === 'compensated';
  const canCompensate = isCompleted || order.status === 'cancelled';

  const handleSubmitCompensation = () => {
    if (!selectedReason) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setShowCompensation(false);
      alert('赔付申请已提交，客服将在24小时内与您联系');
    }, 1000);
  };

  const handleAdvance = async () => {
    if (!order) return;
    setAdvancing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    advanceOrderStatus(order.id);
    setAdvancing(false);
  };

  const canAdvance = order && !['completed', 'cancelled', 'compensated'].includes(order.status);

  const statusFlowLabels: Record<Order['status'], { next: string; action: string }> = {
    pending: { next: '待接单', action: '确认派单' },
    assigned: { next: '已接单', action: '模拟阿姨接单' },
    accepted: { next: '已出发', action: '模拟阿姨出发' },
    departing: { next: '已到达', action: '模拟到达地址' },
    arrived: { next: '服务中', action: '开始服务' },
    servicing: { next: '已完成', action: '完成服务' },
    completed: { next: '已完成', action: '已完成' },
    cancelled: { next: '已取消', action: '已取消' },
    compensated: { next: '已赔付', action: '已赔付' },
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回订单列表
        </button>

        <div className="card p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
                <Icon className="w-7 h-7 text-primary-500" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-secondary-900">{order.service_type_label}</h1>
                  <span className={badge.className}>{badge.label}</span>
                </div>
                <p className="text-sm text-secondary-500 mt-1">订单号 #{order.id} · {order.address_name || '自定义地址'}</p>
                {order.dispatch_records && order.dispatch_records.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[9px] text-secondary-400">调度方式：</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">1km内优先派单</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">准时率40%加权</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">好评50%加权</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">投诉10%加权</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-secondary-500">订单金额</p>
              <p className="text-2xl font-bold text-primary-600">¥{order.amount}</p>
            </div>
          </div>

          {order.is_overtime && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-xl border border-red-100 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-700">超时{order.overtime_minutes}分钟 · 已触发自动赔付</p>
                <p className="text-xs text-red-600">根据平台规则，阿姨迟到超30分钟将自动触发爽约赔付</p>
              </div>
            </div>
          )}

          {order.insurance && (
            <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-xl border border-green-100 mb-4">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-green-800">{order.insurance.product_name}</p>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    order.insurance.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                  )}>
                    {order.insurance.status === 'active' ? '保障中' : order.insurance.status === 'claimed' ? '已理赔' : '已过期'}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-0.5">
                  保单号：{order.insurance.policy_no} · 保额¥{(order.insurance.coverage_amount / 10000).toFixed(0)}万 · 保费¥{order.insurance.premium}/单
                </p>
              </div>
            </div>
          )}
        </div>

        {order.nodes && order.nodes.length > 0 && (
          <NodeTimelineSection nodes={order.nodes} status={order.status} />
        )}

        {order.dispatch_records && order.dispatch_records.length > 0 && (
          <DispatchRecordSection records={order.dispatch_records} onReassign={() => setShowReassign(true)} />
        )}

        {canAdvance && (
          <div className="card p-5 mb-6 bg-gradient-to-r from-blue-50 via-green-50 to-yellow-50 border border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Navigation className="w-5.5 h-5.5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-secondary-800">履约状态实时流转</h3>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    当前状态：{badge.label} → 下一状态：{statusFlowLabels[order.status].next}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[9px]">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">1km优先</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">准时率40%</span>
                    <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-600">好评50%</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600">投诉10%</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="px-5 py-2.5 rounded-xl bg-secondary-600 text-white text-sm font-medium hover:bg-secondary-700 transition-colors disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
              >
                {advancing ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                {advancing ? '流转中...' : statusFlowLabels[order.status].action}
              </button>
            </div>
            {order.is_overtime && (
              <div className="mt-3 p-2.5 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-[11px] text-red-600">
                  本次到达超时 {order.overtime_minutes} 分钟，已触发自动赔付流程，将在到达节点后自动计算赔付金额
                </p>
              </div>
            )}
          </div>
        )}

        {isOngoing && !order.is_overtime && (
          <div className="card p-4 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                <Timer className="w-4.5 h-4.5 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-secondary-800">实时履约监控</p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  距离约定开始时间 <span className="font-medium text-orange-600">≤30分钟</span> 均为正常履约
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-secondary-400">超时阈值</p>
                <p className="text-sm font-bold text-orange-600">30分钟</p>
              </div>
            </div>
          </div>
        )}

        {order.worker_name && (
          <WorkerCertSection order={order} />
        )}

        {showReassign && (
          <ReassignPanel
            order={order}
            currentWorkerId={order.worker_id || 0}
            onReassign={(newWorkerId, reason) => {
              reassignWorker(order.id, newWorkerId, reason || reassignReason || '用户主动改派');
              setShowReassign(false);
              setReassignReason('');
            }}
            onClose={() => { setShowReassign(false); setReassignReason(''); }}
            reassignReason={reassignReason}
            setReassignReason={setReassignReason}
          />
        )}

        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold text-secondary-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            服务信息
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-secondary-500">服务地址</p>
                <p className="text-secondary-800">{order.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-secondary-500">服务时间</p>
                <p className="text-secondary-800">{order.start_time}</p>
                <p className="text-secondary-600 text-sm">服务时长 {order.duration_hours} 小时</p>
              </div>
            </div>
            {order.remark && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-secondary-500">服务备注</p>
                  <p className="text-secondary-800">{order.remark}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {order.compensation && (
          <CompensationRecordSection compensation={order.compensation} />
        )}

        {order.qa_record && (
          <QARecordSection qa={order.qa_record} />
        )}

        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold text-secondary-800 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary-500" />
            费用明细
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-secondary-600">
              <span>{order.service_type_label} × {order.duration_hours}小时</span>
              <span>¥{order.amount - (order.insurance ? order.insurance.premium : 0)}</span>
            </div>
            {order.insurance && (
              <div className="flex justify-between text-secondary-600">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-green-500" />
                  {order.insurance.product_name}
                </span>
                <span>¥{order.insurance.premium}</span>
              </div>
            )}
            {order.compensation && order.compensation.status === 'paid' && (
              <div className="flex justify-between text-red-600 font-medium pt-2 border-t border-dashed border-red-200">
                <span className="flex items-center gap-1">
                  <CircleDollarSign className="w-3.5 h-3.5" />
                  赔付退款
                </span>
                <span>-¥{order.compensation.refund_amount}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-gray-100">
              <span className="font-medium text-secondary-800">
                {order.compensation && order.compensation.status === 'paid' ? '实付金额' : '订单金额'}
              </span>
              <span className="text-xl font-bold text-primary-600">
                ¥{order.compensation && order.compensation.status === 'paid'
                  ? order.amount - order.compensation.refund_amount
                  : order.amount}
              </span>
            </div>
          </div>
        </div>

        {canCompensate && !order.compensation && (
          <div className="card p-6 mb-6">
            <button
              onClick={() => setShowCompensation(!showCompensation)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-secondary-800">申请售后赔付</p>
                  <p className="text-sm text-secondary-500">服务不满意？我们为您保障权益</p>
                </div>
              </div>
              <ChevronDown className={cn('w-5 h-5 text-secondary-400 transition-transform', showCompensation && 'rotate-180')} />
            </button>

            {showCompensation && (
              <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-up">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-secondary-700 mb-2 block">赔付原因</label>
                    <div className="space-y-2">
                      {[
                        '阿姨迟到超过30分钟',
                        '服务质量不满意',
                        '阿姨未按约定时间上门',
                        '服务态度问题',
                        '物品损坏',
                      ].map((reason) => (
                        <button
                          key={reason}
                          onClick={() => setSelectedReason(reason)}
                          className={cn(
                            'w-full p-3 rounded-xl border-2 text-left transition-all',
                            selectedReason === reason
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-primary-200 text-secondary-700'
                          )}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary-700 mb-2 block">详细描述（选填）</label>
                    <textarea
                      value={compensationDesc}
                      onChange={(e) => setCompensationDesc(e.target.value)}
                      placeholder="请描述具体情况"
                      rows={3}
                      className="input-field resize-none"
                    />
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">赔付保障说明</p>
                        <p className="text-yellow-700 mt-1">我们将在24小时内审核您的申请，根据情况提供现金退款或服务券补偿。爽约自动赔付无需申请。</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmitCompensation}
                    disabled={!selectedReason || submitting}
                    className={cn(
                      'btn-primary w-full',
                      (!selectedReason || submitting) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        提交中...
                      </span>
                    ) : '提交赔付申请'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isOngoing && (
          <div className="card p-4 mb-6 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-800">实时追踪中</p>
                <p className="text-xs text-primary-600">阿姨每个节点状态变更将实时推送通知，超时30分钟自动触发赔付</p>
              </div>
            </div>
          </div>
        )}

        {isCompleted && !order.qa_record && (
          <div className="card p-4 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Mic className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">质检进行中</p>
                <p className="text-xs text-blue-600">录音转文字与差评根因分析正在处理，完成后将展示详细质检报告</p>
              </div>
              <Link to="/admin/qa" className="text-xs text-blue-600 font-medium hover:text-blue-700">
                质检中心 →
              </Link>
            </div>
          </div>
        )}

        <p className="text-center text-secondary-400 text-sm py-6">
          下单时间：{order.created_at}
        </p>
      </div>
    </div>
  );
}
