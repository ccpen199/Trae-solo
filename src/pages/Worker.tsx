import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { workers } from '@/data/workers';
import { orders } from '@/data/orders';
import { skillCategories, faultTypes } from '@/data/faults';
import type { SkillCert } from '@/types';
import {
  User, Award, Camera, MapPin, Clock, Star, FileCheck,
  Upload, Check, AlertCircle, ScanFace, Navigation, Image,
  Wrench, ChevronRight, ChevronDown, Zap, Snowflake, Droplets, Lock,
  Tv, Flame, Bug, Eye, Clock3, Shield, UserCheck,
} from 'lucide-react';
import * as Icons from 'lucide-react';

function getIcon(name: string) {
  const iconMap: Record<string, React.ElementType> = {
    Snowflake: Icons.Snowflake,
    Zap: Icons.Zap,
    Droplets: Icons.Droplets,
    Lock: Icons.Lock,
    Tv: Icons.Tv,
    Flame: Icons.Flame,
    Wrench: Icons.Wrench,
    Bug: Icons.Bug,
  };
  return iconMap[name] || Icons.Wrench;
}

function SkillRadar({ skills }: { skills: { name: string; value: number; status: string }[] }) {
  const size = 280;
  const center = size / 2;
  const maxRadius = 100;
  const levels = 5;
  const angleStep = (Math.PI * 2) / skills.length;

  const points = skills.map((s, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (s.value / 100) * maxRadius;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      labelX: center + Math.cos(angle) * (maxRadius + 25),
      labelY: center + Math.sin(angle) * (maxRadius + 25),
      name: s.name,
      value: s.value,
      status: s.status,
      angle,
    };
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {Array.from({ length: levels }).map((_, i) => {
        const r = (maxRadius / levels) * (i + 1);
        return (
          <polygon
            key={i}
            points={skills.map((_, idx) => {
              const angle = angleStep * idx - Math.PI / 2;
              return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
            }).join(' ')}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      {skills.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + Math.cos(angle) * maxRadius}
            y2={center + Math.sin(angle) * maxRadius}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      <polygon
        points={polygonPoints}
        fill="url(#radarGradient)"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#f97316" strokeWidth="2" />
          <text
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs"
            fill="#475569"
            fontSize="11"
            fontWeight="500"
          >
            {p.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

function getStatusInfo(status: string) {
  const map: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    verified: { label: '已认证', color: 'text-green-600', bgColor: 'bg-green-100', icon: Check },
    under_review: { label: '人工复核中', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: UserCheck },
    ocr_recognized: { label: 'OCR已识别', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: ScanFace },
    pending: { label: '待提交', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
    expired: { label: '已过期', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle },
  };
  return map[status] || map.pending;
}

function SkillCertCard({ skill }: { skill: SkillCert }) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = getStatusInfo(skill.status);
  const StatusIcon = statusInfo.icon;
  const cat = skillCategories.find(c => c.id === skill.categoryId);
  const Icon = cat ? getIcon(cat.icon) : Wrench;

  const certSteps = [
    { key: 'upload', label: '证件上传', done: !!skill.uploadedAt, time: skill.uploadedAt, icon: Upload },
    { key: 'ocr', label: 'OCR识别', done: !!skill.ocrResult, time: skill.uploadedAt, icon: ScanFace },
    { key: 'review', label: '人工复核', done: skill.status === 'verified' || skill.status === 'under_review', time: skill.reviewedAt, icon: UserCheck },
    { key: 'cert', label: '认证通过', done: skill.status === 'verified', time: skill.reviewedAt, icon: Shield },
  ];

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div
        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${statusInfo.bgColor} ${statusInfo.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 truncate">{skill.categoryName}</p>
            <StatusIcon className={`w-4 h-4 ${statusInfo.color} flex-shrink-0`} />
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{skill.certName}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500">证件编号</p>
              <p className="text-sm font-medium text-slate-700 mt-1 font-mono">{skill.certNo}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500">有效期至</p>
              <p className="text-sm font-medium text-slate-700 mt-1">{skill.expiryDate}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500">发证日期</p>
              <p className="text-sm font-medium text-slate-700 mt-1">{skill.issueDate}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500">上传时间</p>
              <p className="text-sm font-medium text-slate-700 mt-1">{skill.uploadedAt || '—'}</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-slate-100">
            <p className="text-sm font-semibold text-slate-800 mb-3">认证流程</p>
            <div className="relative pl-2">
              {certSteps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0 relative">
                    {idx < certSteps.length - 1 && (
                      <div className={`absolute left-[13px] top-6 w-0.5 h-full ${
                        step.done ? 'bg-green-300' : 'bg-slate-200'
                      }`} style={{ height: 'calc(100% - 24px)' }} />
                    )}
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.done
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <StepIcon className="w-3 h-3" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        {step.time && step.done && (
                          <span className="text-xs text-slate-400">{step.time}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {skill.ocrResult && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                  <ScanFace className="w-4 h-4" />
                  OCR识别结果
                </p>
                <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  置信度 {(skill.ocrResult.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-purple-600">持证人：</span><span className="text-purple-800">{skill.ocrResult.name}</span></div>
                <div><span className="text-purple-600">发证机关：</span><span className="text-purple-800">{skill.ocrResult.issueOrg}</span></div>
              </div>
            </div>
          )}

          {skill.reviewer && skill.reviewNote && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                复核记录
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>复核人：<span className="font-medium">{skill.reviewer}</span></p>
                <p>复核意见：{skill.reviewNote}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SkillMapSection() {
  const { currentWorkerId } = useAppStore();
  const worker = workers.find(w => w.id === currentWorkerId) || workers[0];

  const radarData = skillCategories.map(cat => {
    const skill = worker.skills.find(s => s.categoryId === cat.id);
    let value = 0;
    if (skill) {
      if (skill.status === 'verified') value = 90 + Math.floor(Math.random() * 10);
      else if (skill.status === 'under_review') value = 75;
      else if (skill.status === 'ocr_recognized') value = 60;
      else value = 40;
    }
    return { name: cat.name, value, status: skill?.status || 'none' };
  });

  const stats = {
    verified: worker.skills.filter(s => s.status === 'verified').length,
    reviewing: worker.skills.filter(s => s.status === 'under_review' || s.status === 'ocr_recognized').length,
    total: skillCategories.length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-md">
          <p className="text-green-100 text-xs">已认证技能</p>
          <p className="text-3xl font-bold mt-1">{stats.verified}<span className="text-base font-normal text-green-200"> / {stats.total}</span></p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-md">
          <p className="text-blue-100 text-xs">审核中</p>
          <p className="text-3xl font-bold mt-1">{stats.reviewing}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-md">
          <p className="text-amber-100 text-xs">综合评分</p>
          <p className="text-3xl font-bold mt-1">{worker.rating}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-1">技能能力雷达</h3>
        <p className="text-sm text-slate-500 mb-4">技能覆盖越全面，匹配订单越多</p>
        <div className="flex items-center justify-center">
          <SkillRadar skills={radarData} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800">资质证书列表</h3>
            <p className="text-xs text-slate-500 mt-0.5">点击卡片查看完整认证链路</p>
          </div>
          <button className="text-xs text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            添加证书
          </button>
        </div>
        <div className="space-y-3">
          {worker.skills.map(skill => (
            <SkillCertCard key={skill.categoryId} skill={skill} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CertUploadSection() {
  const [uploading, setUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<null | {
    name: string;
    certType: string;
    certNo: string;
    issueOrg: string;
    issueDate: string;
    expiryDate: string;
    confidence: number;
  }>(null);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setOcrResult({
        name: '张师傅',
        certType: '低压电工作业操作证',
        certNo: 'T3101151985********',
        issueOrg: '上海市应急管理局',
        issueDate: '2022-03-15',
        expiryDate: '2028-03-14',
        confidence: 0.96,
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-1">证件上传与OCR识别</h3>
        <p className="text-sm text-slate-500 mb-4">上传技能证件，系统自动识别并填充信息</p>

        {!ocrResult && (
          <div
            onClick={handleUpload}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              uploading
                ? 'border-orange-300 bg-orange-50'
                : 'border-slate-300 hover:border-orange-400 hover:bg-orange-50/50'
            }`}
          >
            {uploading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 rounded-full border-3 border-orange-500 border-t-transparent mb-3"
                />
                <p className="text-sm font-medium text-orange-600">OCR识别中...</p>
                <p className="text-xs text-orange-400 mt-1">正在识别证件信息，请稍候</p>
              </motion.div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">点击上传证件照片</p>
                <p className="text-xs text-slate-400 mt-1">支持 JPG、PNG 格式，自动识别证件信息</p>
              </>
            )}
          </div>
        )}

        {ocrResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">OCR识别成功</span>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                置信度 {(ocrResult.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '持证人', value: ocrResult.name },
                { label: '证件类型', value: ocrResult.certType },
                { label: '证件编号', value: ocrResult.certNo },
                { label: '发证机关', value: ocrResult.issueOrg },
                { label: '发证日期', value: ocrResult.issueDate },
                { label: '有效期至', value: ocrResult.expiryDate },
              ].map(field => (
                <div key={field.label} className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">{field.label}</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">{field.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                请仔细核对识别结果，如有错误请手动修改后提交。提交后将进入人工复核流程，通常 24 小时内完成审核。
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setOcrResult(null); }}
                className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                重新上传
              </button>
              <button className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all">
                提交审核
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function OrderCenterSection() {
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'matched');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">附近可接订单</h3>
        <div className="flex gap-2 text-xs">
          <button className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-full font-medium">
            全部
          </button>
          <button className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
            我的技能
          </button>
          <button className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
            最近
          </button>
        </div>
      </div>

      {pendingOrders.map((order, idx) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5 hover:border-orange-300 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">{order.faultTypeName}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {order.homeownerAddress.slice(0, 15)}...
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {order.createdAt.split(' ')[1]?.slice(0, 5)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-1">{order.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">距离</div>
              <div className="text-base font-bold text-orange-500">{(Math.random() * 3 + 0.5).toFixed(1)} km</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {order.faultCategory.map(cat => (
                <span key={cat} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {cat}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">预计收入</span>
              <span className="text-lg font-bold text-green-600">¥{Math.floor(80 + Math.random() * 300)}</span>
              <button className="ml-2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-lg shadow-md shadow-orange-500/20 hover:shadow-lg transition-all">
                抢单
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CheckInSection() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(5);

  const handleCheckIn = () => {
    setShowFaceModal(true);
    setTimeout(() => {
      setFaceVerified(true);
      setTimeout(() => {
        setShowFaceModal(false);
        setCheckedIn(true);
      }, 1000);
    }, 2000);
  };

  const steps = [
    { id: 1, name: '上门签到', icon: MapPin, done: checkedIn, required: true },
    { id: 2, name: '人脸验证', icon: ScanFace, done: faceVerified && checkedIn, required: true },
    { id: 3, name: '故障检测', icon: Wrench, done: false, required: true },
    { id: 4, name: '维修施工', icon: Zap, done: false, required: true },
    { id: 5, name: '完工验收', icon: Check, done: false, required: true },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">当前订单</p>
            <h3 className="text-xl font-bold mt-1">空调不制冷维修</h3>
            <p className="text-blue-100 text-sm mt-1">ORD20240614001 · 张先生</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-xs">服务状态</p>
            <span className="inline-block mt-1 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {checkedIn ? '服务中' : '待上门'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
        <h4 className="font-semibold text-slate-800 mb-4">服务工序</h4>
        <div className="relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-start gap-4 pb-5 last:pb-0 relative">
                {idx < steps.length - 1 && (
                  <div className={`absolute left-5 top-10 w-0.5 h-10 ${
                    step.done ? 'bg-green-400' : 'bg-slate-200'
                  }`} />
                )}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.name}
                    </p>
                    {step.required && (
                      <span className="text-xs text-red-500">*必做</span>
                    )}
                  </div>
                  {step.done && (
                    <p className="text-xs text-green-600 mt-0.5">已完成</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
        <h4 className="font-semibold text-slate-800 mb-4">GPS定位签到</h4>

        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
              checkedIn ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                checkedIn ? 'bg-green-200' : 'bg-blue-200'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  checkedIn ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  <Navigation className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md border border-slate-200">
              <span className="text-xs font-medium text-slate-600">精度 {gpsAccuracy}m</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mb-4">
          {checkedIn ? '已成功签到' : '已定位到业主地址附近，请确认签到'}
        </p>

        {!checkedIn && (
          <button
            onClick={handleCheckIn}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all active:scale-98"
          >
            立即签到
          </button>
        )}

        {checkedIn && !faceVerified && (
          <button
            onClick={() => setShowFaceModal(true)}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
          >
            人脸识别验证
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFaceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-80 text-center"
            >
              <h3 className="font-bold text-slate-800 text-lg mb-2">人脸识别验证</h3>
              <p className="text-sm text-slate-500 mb-4">请将面部对准摄像头</p>

              <div className="w-48 h-48 mx-auto rounded-full bg-slate-900 relative overflow-hidden mb-4">
                {!faceVerified ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanFace className="w-20 h-20 text-blue-400" />
                    </div>
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-blue-400"
                      initial={{ top: 0 }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>
                )}
              </div>

              <p className={`text-sm font-medium ${faceVerified ? 'text-green-600' : 'text-slate-500'}`}>
                {faceVerified ? '验证成功！本人身份已确认' : '正在识别中...'}
              </p>

              {faceVerified && (
                <button
                  onClick={() => setShowFaceModal(false)}
                  className="mt-4 w-full py-2.5 bg-green-500 text-white rounded-lg font-medium"
                >
                  确定
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkerPage() {
  const [activeTab, setActiveTab] = useState<'skills' | 'cert' | 'orders' | 'checkin'>('skills');
  const { currentWorkerId } = useAppStore();
  const worker = workers.find(w => w.id === currentWorkerId) || workers[0];

  const tabs = [
    { id: 'skills', label: '技能图谱', icon: Award },
    { id: 'cert', label: '证件上传', icon: FileCheck },
    { id: 'orders', label: '接单中心', icon: Wrench },
    { id: 'checkin', label: '服务打卡', icon: MapPin },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">师傅工作台</h2>
        <p className="text-sm text-slate-500 mt-1">管理技能认证、接收订单、服务打卡</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5 mb-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <img
                  src={worker.avatar}
                  alt={worker.name}
                  className="w-20 h-20 rounded-full bg-slate-100"
                />
                <span className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${
                  worker.status === 'online' ? 'bg-green-500' :
                  worker.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{worker.name}</h3>
              <p className="text-sm text-slate-500">{worker.phone}</p>

              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="text-center">
                  <p className="font-bold text-amber-500">{worker.rating}</p>
                  <p className="text-xs text-slate-400">评分</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <p className="font-bold text-blue-500">{worker.orderCount}</p>
                  <p className="text-xs text-slate-400">订单</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <p className="font-bold text-green-500">{worker.skills.filter(s => s.status === 'verified').length}</p>
                  <p className="text-xs text-slate-400">认证</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm overflow-hidden">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${
                    isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'skills' && <SkillMapSection />}
              {activeTab === 'cert' && <CertUploadSection />}
              {activeTab === 'orders' && <OrderCenterSection />}
              {activeTab === 'checkin' && <CheckInSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
