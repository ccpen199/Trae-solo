import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Download, Filter, ChevronRight } from 'lucide-react';
import { auditLogs } from '@/mock/data';
import type { AuditLog } from '@/types';

const actionTypes = ['全部', '登录系统', '查询服务', '提交申请', '亮证核验', '查看进度', '身份核验', '审批操作'];
const resultTypes = ['全部', 'success', 'failure'];

export default function Audit() {
  const [actionFilter, setActionFilter] = useState('全部');
  const [resultFilter, setResultFilter] = useState('全部');
  const [dateFrom] = useState('2026-06-01');
  const [dateTo] = useState('2026-06-09');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = auditLogs.filter((log) => {
    if (actionFilter !== '全部' && log.action !== actionFilter) return false;
    if (resultFilter !== '全部' && log.result !== resultFilter) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="gov-section-title">
          <ShieldAlert className="w-5 h-5 text-gov-blue" />
          访问审计
        </h2>
        <button className="gov-btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" />
          导出日志
        </button>
      </div>

      <div className="gov-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gov-text-secondary" />
            <span className="text-sm text-gov-text-secondary">筛选：</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gov-text-secondary">日期</label>
            <input type="date" className="gov-input w-36 text-sm" value={dateFrom} readOnly />
            <span className="text-gov-text-secondary">~</span>
            <input type="date" className="gov-input w-36 text-sm" value={dateTo} readOnly />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gov-text-secondary">操作类型</label>
            <select
              className="gov-input w-32 text-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {actionTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gov-text-secondary">结果</label>
            <select
              className="gov-input w-28 text-sm"
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
            >
              {resultTypes.map((t) => (
                <option key={t} value={t}>{t === '全部' ? '全部' : t === 'success' ? '成功' : '失败'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gov-border text-gov-text-secondary bg-gov-bg">
                <th className="text-left py-3 px-4 font-medium">时间</th>
                <th className="text-left py-3 px-4 font-medium">用户</th>
                <th className="text-left py-3 px-4 font-medium">操作</th>
                <th className="text-left py-3 px-4 font-medium">资源</th>
                <th className="text-left py-3 px-4 font-medium">IP</th>
                <th className="text-center py-3 px-4 font-medium">结果</th>
                <th className="text-center py-3 px-4 font-medium">详情</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log: AuditLog) => {
                const expanded = expandedId === log.id;
                return (
                  <tr
                    key={log.id}
                    className="border-b border-gov-border hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : log.id)}
                  >
                    <td className="py-3 px-4 text-gov-text-secondary whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-4 text-gov-text font-medium">{log.userName}</td>
                    <td className="py-3 px-4 text-gov-text">{log.action}</td>
                    <td className="py-3 px-4 text-gov-text-secondary">{log.resource}</td>
                    <td className="py-3 px-4 text-gov-text-secondary font-mono text-xs">{log.ip}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`gov-badge ${
                          log.result === 'success'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {log.result === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <ChevronRight
                          className={`w-4 h-4 text-gov-text-secondary transition-transform ${
                            expanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {expandedId && (
          <div className="px-6 py-4 bg-blue-50/50 border-t border-gov-border">
            <p className="text-sm text-gov-text">
              <span className="font-medium">详情：</span>
              {auditLogs.find((l) => l.id === expandedId)?.details}
            </p>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gov-border text-sm text-gov-text-secondary">
          共 {filtered.length} 条审计记录
        </div>
      </div>
    </motion.div>
  );
}
