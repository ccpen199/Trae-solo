import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserCheck, Activity, AlertTriangle, Clock, CheckCircle, XCircle, Scale, Shield, Lock,
} from 'lucide-react';
import type { Counselor } from '@/types';
import { RISK_LEVEL_CONFIG } from '@/types';

interface CrisisAlert {
  profile_id: string;
  risk_level: string;
  created_at: string;
  handled: boolean;
}

const mockAlerts: CrisisAlert[] = [
  { profile_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', risk_level: 'critical', created_at: new Date().toISOString(), handled: false },
  { profile_id: 'f9e8d7c6-b5a4-3210-fedc-ba0987654321', risk_level: 'high', created_at: new Date(Date.now() - 3600000).toISOString(), handled: false },
  { profile_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890', risk_level: 'critical', created_at: new Date(Date.now() - 7200000).toISOString(), handled: false },
];

const ocrLabel: Record<string, string> = { pending: '待核验', verified: '已通过', rejected: '已拒绝' };
const dbLabel: Record<string, string> = { pending: '待核验', matched: '已匹配', mismatched: '未匹配' };

function StatCard({ icon: Icon, label, value, color, bg }: { icon: typeof Users; label: string; value: number | string; color: string; bg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-soft"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon size={22} className={color} />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-dark-800">{value}</div>
          <div className="text-sm text-slate-dark-400">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Admin() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [pending, setPending] = useState<Counselor[]>([]);
  const [alerts, setAlerts] = useState<CrisisAlert[]>(mockAlerts);
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/counselors')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCounselors(json.data);
      })
      .catch(() => {});

    fetch('/api/admin/pending-verifications')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPending(json.data);
      })
      .catch(() => {});

    fetch('/api/admin/crisis-alerts')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const allItems = [...(json.data.high_risk_profiles || []), ...(json.data.high_risk_vents || [])];
          if (allItems.length > 0) {
            setAlerts(allItems.map((item: Record<string, string>) => ({
              profile_id: item.profile_id || item.id,
              risk_level: item.risk_level || 'high',
              created_at: item.created_at || new Date().toISOString(),
              handled: false,
            })));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleVerify = async (id: string, ocr: 'verified' | 'rejected', db: 'matched' | 'mismatched') => {
    try {
      const res = await fetch(`/api/counselors/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocr_status: ocr, db_match_status: db }),
      });
      const json = await res.json();
      if (json.success) {
        setPending((prev) => prev.filter((c) => c.id !== id));
        setCounselors((prev) => prev.map((c) => c.id === id ? json.data : c));
      }
    } catch { /* noop */ }
  };

  const handleMarkHandled = (profileId: string) => {
    setHandledIds((prev) => new Set(prev).add(profileId));
  };

  const activeCounselors = counselors.filter(
    (c) => c.ocr_status === 'verified' && c.db_match_status === 'matched'
  ).length;

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-lavender-600">管理后台</h1>
          <p className="text-slate-dark-400 text-sm mt-1">平台运营与安全监管</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="注册用户" value="1,247" color="text-lavender-500" bg="bg-lavender-50" />
          <StatCard icon={UserCheck} label="活跃咨询师" value={activeCounselors || counselors.length} color="text-mint-500" bg="bg-mint-50" />
          <StatCard icon={Activity} label="进行中咨询" value="23" color="text-sky-500" bg="bg-sky-50" />
          <StatCard icon={AlertTriangle} label="危机预警" value={alerts.filter((a) => !handledIds.has(a.profile_id)).length} color="text-coral-500" bg="bg-coral-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-coral-500" />
              <h2 className="font-serif text-2xl text-lavender-600">危机预警</h2>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
              {alerts.length === 0 || alerts.every((a) => handledIds.has(a.profile_id)) ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-mint-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={28} className="text-mint-500" />
                  </div>
                  <p className="text-mint-500 font-medium">暂无危机预警</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  if (handledIds.has(alert.profile_id)) return null;
                  const riskConf = RISK_LEVEL_CONFIG[alert.risk_level] || RISK_LEVEL_CONFIG.high;
                  const truncatedId = alert.profile_id.slice(0, 8) + '...';
                  const time = new Date(alert.created_at);
                  return (
                    <motion.div
                      key={alert.profile_id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between gap-3 p-4 bg-coral-50 rounded-xl"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-slate-dark-700">{truncatedId}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${riskConf.bg} ${riskConf.color}`}>
                            {riskConf.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-dark-400">
                          <Clock size={11} />
                          {time.toLocaleString('zh-CN')}
                          <span className="px-1.5 py-0.5 rounded bg-coral-100 text-coral-500 text-[10px]">待处理</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkHandled(alert.profile_id)}
                        className="shrink-0 px-3 py-1.5 bg-white text-coral-500 rounded-lg text-xs font-medium hover:bg-coral-100 transition-colors border border-coral-200"
                      >
                        标记已处理
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-yellow-500" />
              <h2 className="font-serif text-2xl text-lavender-600">待审核资质</h2>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
              {pending.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-mint-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={28} className="text-mint-500" />
                  </div>
                  <p className="text-mint-500 font-medium">所有资质已审核</p>
                </div>
              ) : (
                pending.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 border border-slate-dark-100 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-lavender-100 text-lavender-600 flex items-center justify-center text-sm font-serif">
                          {c.anonymous_name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-dark-800">{c.anonymous_name}</div>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${c.credential_type === '二级' ? 'bg-mint-100 text-mint-500' : 'bg-sky-100 text-sky-500'}`}>
                            {c.credential_type}咨询师
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        {c.ocr_status === 'verified' ? <CheckCircle size={14} className="text-mint-500" /> : c.ocr_status === 'rejected' ? <XCircle size={14} className="text-coral-500" /> : <Clock size={14} className="text-yellow-500" />}
                        OCR: {ocrLabel[c.ocr_status]}
                      </span>
                      <span className="flex items-center gap-1">
                        {c.db_match_status === 'matched' ? <CheckCircle size={14} className="text-mint-500" /> : c.db_match_status === 'mismatched' ? <XCircle size={14} className="text-coral-500" /> : <Clock size={14} className="text-yellow-500" />}
                        DB: {dbLabel[c.db_match_status]}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(c.id, 'verified', 'matched')}
                        className="flex-1 py-2 bg-mint-500 text-white rounded-lg text-xs font-medium hover:bg-mint-400 transition-colors"
                      >
                        通过审核
                      </button>
                      <button
                        onClick={() => handleVerify(c.id, 'rejected', 'mismatched')}
                        className="flex-1 py-2 bg-coral-500 text-white rounded-lg text-xs font-medium hover:bg-coral-400 transition-colors"
                      >
                        拒绝
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <h2 className="font-serif text-2xl text-lavender-600 mb-4">合规信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-lavender-50 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center mb-3">
                <Scale size={20} className="text-lavender-600" />
              </div>
              <h3 className="font-serif text-base text-lavender-700 mb-2">精神卫生法合规</h3>
              <p className="text-sm text-slate-dark-500 leading-relaxed">平台服务符合《中华人民共和国精神卫生法》相关条款</p>
            </div>
            <div className="bg-lavender-50 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center mb-3">
                <Shield size={20} className="text-lavender-600" />
              </div>
              <h3 className="font-serif text-base text-lavender-700 mb-2">个人信息保护</h3>
              <p className="text-sm text-slate-dark-500 leading-relaxed">严格遵守《个人信息保护法》，用户数据加密存储</p>
            </div>
            <div className="bg-lavender-50 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center mb-3">
                <Lock size={20} className="text-lavender-600" />
              </div>
              <h3 className="font-serif text-base text-lavender-700 mb-2">数据安全</h3>
              <p className="text-sm text-slate-dark-500 leading-relaxed">端到端加密传输，咨询记录脱敏存储</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
