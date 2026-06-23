import { useState, useEffect } from 'react';
import {
  RefreshCw,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  Clock,
  Info,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn, formatCurrency, formatDateTime } from '../../utils';
import type { FinanceLedger } from '../../types';

interface RetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: FinanceLedger | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function RetryModal({ isOpen, onClose, ledger, onConfirm, loading }: RetryModalProps) {
  if (!ledger) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="重试打款确认" size="md">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-2.5">
            <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-800 mb-0.5">确认重新发起打款？</div>
              <div className="text-xs text-blue-700">系统将重新调用支付通道，约 2-5 秒返回结果</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-gray-50">
            <div className="text-[11px] text-gray-500 mb-1">流水号</div>
            <div className="font-mono text-sm font-semibold text-gray-900">{ledger.id.slice(-12)}</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50">
            <div className="text-[11px] text-gray-500 mb-1">类型</div>
            <div className="text-sm font-semibold text-gray-900">
              {ledger.type === 'pay' ? '支付' : ledger.type === 'payout' ? '打款' : ledger.type === 'refund' ? '退款' : '其他'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50">
            <div className="text-[11px] text-gray-500 mb-1">失败原因</div>
            <div className="text-sm font-semibold text-gray-900 truncate" title={ledger.failureReason}>
              {ledger.failureReason || '-'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="text-[11px] text-gray-500 mb-1">重试金额</div>
            <div className="text-lg font-bold text-primary">¥{ledger.amount.toFixed(2)}</div>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button variant="primary" className="flex-1" onClick={onConfirm} loading={loading}>
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1', loading && 'animate-spin')} />
            确认重试
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface CompensateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: FinanceLedger | null;
  onConfirm: (amount: number, reason: string, account: string) => void;
}

const COMPENSATE_REASONS = [
  '通道异常补偿',
  '用户投诉补偿',
  '系统故障补偿',
  '操作失误补偿',
  '其他原因',
];

export function CompensateModal({ isOpen, onClose, ledger, onConfirm }: CompensateModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [account, setAccount] = useState('');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    if (ledger && isOpen) {
      setAmount(ledger.amount.toString());
      setReason('');
      setAccount('');
      setCustomReason('');
    }
  }, [ledger, isOpen]);

  if (!ledger) return null;

  const handleConfirm = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    const finalReason = reason === '其他原因' ? customReason : reason;
    if (!finalReason.trim()) return;
    onConfirm(amt, finalReason, account);
  };

  const isValid = parseFloat(amount) > 0 && (reason && reason !== '其他原因' ? true : customReason.trim().length > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="手动补偿" size="md">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
          <div className="flex items-start gap-2.5">
            <HeartPulse className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-800 mb-0.5">补偿后将生成新的补偿流水</div>
              <div className="text-xs text-rose-700">原流水状态变更为"已补偿"，并记录复核信息</div>
            </div>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-gray-50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">原流水号:</span>
              <span className="font-mono text-gray-800 ml-1">{ledger.id.slice(-12)}</span>
            </div>
            <div>
              <span className="text-gray-500">类型:</span>
              <span className="text-gray-800 ml-1">
                {ledger.type === 'pay' ? '支付' : ledger.type === 'payout' ? '打款' : ledger.type === 'refund' ? '退款' : '其他'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">原金额:</span>
              <span className="font-semibold text-danger ml-1">-{formatCurrency(ledger.amount)}</span>
            </div>
            <div>
              <span className="text-gray-500">失败原因:</span>
              <span className="text-gray-800 ml-1">{ledger.failureReason || '-'}</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">补偿金额 (CNY)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-lg font-semibold focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex gap-1.5 mt-2">
            {[ledger.amount, ledger.amount * 0.5, ledger.amount * 1.5].map((v, i) => (
              <button
                key={i}
                onClick={() => setAmount(v.toFixed(2))}
                className="flex-1 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 font-medium transition-colors"
              >
                {i === 0 ? '等额' : i === 1 ? '50%' : '150%'} ¥{v.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">补偿原因</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {COMPENSATE_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs border transition-colors',
                  reason === r
                    ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {r}
              </button>
            ))}
          </div>
          {reason === '其他原因' && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="请输入其他补偿原因..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">补偿账户</label>
          <input
            type="text"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="请输入收款账户（选填）"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
            onClick={onClose}
          >
            取消
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleConfirm} disabled={!isValid}>
            <HeartPulse className="w-3.5 h-3.5 mr-1" />
            确认补偿
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface CloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: FinanceLedger | null;
  onConfirm: (remark: string) => void;
}

export function CloseModal({ isOpen, onClose, ledger, onConfirm }: CloseModalProps) {
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRemark('');
    }
  }, [isOpen]);

  if (!ledger) return null;

  const handleConfirm = () => {
    if (!remark.trim()) return;
    onConfirm(remark);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="标记已处理" size="md">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-violet-800 mb-0.5">标记后流水进入终态</div>
              <div className="text-xs text-violet-700">将添加"已人工处理"标签，请填写处理说明</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
          <div>
            <div className="text-[11px] text-gray-500 mb-0.5">流水号</div>
            <div className="font-mono text-sm font-semibold text-gray-900">{ledger.id.slice(-12)}</div>
          </div>
          <div className="text-xl font-bold text-danger">-¥{ledger.amount.toFixed(2)}</div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">处理备注 *</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            placeholder="请详细描述人工处理说明..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
            onClick={onClose}
          >
            取消
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleConfirm} disabled={!remark.trim()}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            确认标记
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface TimelineNode {
  key: string;
  label: string;
  time: Date | string;
  operator?: string;
  content?: string;
  status: 'done' | 'current' | 'pending';
  icon?: typeof Clock;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: FinanceLedger | null;
  onRetry?: () => void;
  onCompensate?: () => void;
  onCloseManual?: () => void;
  retryLoading?: boolean;
}

const channelText: Record<string, string> = {
  wechat: '微信',
  alipay: '支付宝',
  unionpay: '银联',
  balance: '余额',
};

const typeText: Record<string, string> = {
  pay: '支付',
  refund: '退款',
  payout: '打款',
  commission: '佣金',
  fee: '手续费',
  recharge: '充值',
  compensation: '补偿',
  retry: '重试',
};

const statusConfig: Record<string, { variant: string; label: string }> = {
  pending: { variant: 'warning', label: '处理中' },
  success: { variant: 'success', label: '成功' },
  failed: { variant: 'danger', label: '失败' },
  retrying: { variant: 'warning', label: '重试中' },
  reviewing: { variant: 'info', label: '复核中' },
  compensated: { variant: 'success', label: '已补偿' },
  reversed: { variant: 'danger', label: '已冲正' },
  manual_closed: { variant: 'info', label: '人工关闭' },
};

export function DetailModal({ isOpen, onClose, ledger, onRetry, onCompensate, onCloseManual, retryLoading }: DetailModalProps) {
  if (!ledger) return null;

  const isFailed = ledger.status === 'failed';

  const timeline: TimelineNode[] = [
    {
      key: 'init',
      label: '交易发起',
      time: ledger.createdAt,
      operator: '系统',
      content: `${typeText[ledger.type]}交易发起，金额 ¥${ledger.amount.toFixed(2)}`,
      status: 'done',
    },
    {
      key: 'channel',
      label: '通道受理',
      time: ledger.createdAt,
      operator: channelText[ledger.channel] || ledger.channel,
      content: `${channelText[ledger.channel]}通道已受理`,
      status: ledger.status !== 'pending' ? 'done' : 'current',
    },
    {
      key: 'result',
      label: ledger.status === 'failed' ? '失败回执' : '交易结果',
      time: ledger.settledAt || ledger.createdAt,
      operator: '系统',
      content: ledger.failureReason || statusConfig[ledger.status]?.label || '处理中',
      status: ['success', 'failed', 'compensated', 'reversed', 'manual_closed'].includes(ledger.status) ? 'done' : 'pending',
    },
    ...(ledger.reviewedBy || ledger.handlerName
      ? [
          {
            key: 'manual',
            label: '人工介入',
            time: ledger.reviewedAt || ledger.handledAt || new Date(),
            operator: ledger.reviewedBy || ledger.handlerName || '财务管理员',
            content: ledger.reviewNote || ledger.remark || '人工处理',
            status: 'done' as const,
          },
        ]
      : []),
    ...(['compensated', 'reversed', 'manual_closed'].includes(ledger.status)
      ? [
          {
            key: 'complete',
            label: '处置完成',
            time: ledger.settledAt || ledger.reviewedAt || ledger.handledAt || new Date(),
            operator: '系统',
            content: statusConfig[ledger.status]?.label || '处置完成',
            status: 'done' as const,
          },
        ]
      : []),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="交易详情" size="lg">
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">流水号</div>
              <div className="font-mono text-base font-bold text-gray-900">{ledger.id}</div>
            </div>
            <Badge variant={statusConfig[ledger.status]?.variant as any}>
              {statusConfig[ledger.status]?.label}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">类型</div>
              <div className="font-medium text-gray-900">{typeText[ledger.type]}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">通道</div>
              <div className="font-medium text-gray-900">{channelText[ledger.channel]}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">金额</div>
              <div className={cn('font-bold', ledger.direction === 'debit' ? 'text-success' : 'text-danger')}>
                {ledger.direction === 'debit' ? '+' : '-'}¥{ledger.amount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {ledger.orderId && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600">关联订单</span>
              <span className="font-mono text-blue-800">{ledger.orderId}</span>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            处理记录时间线
          </h4>
          <div className="relative">
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
            {timeline.map((node, idx) => {
              const isLast = idx === timeline.length - 1;
              return (
                <div key={node.key} className={cn('relative flex gap-4', isLast ? 'pb-0' : 'pb-5')}>
                  <div className={cn(
                    'relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    node.status === 'done' ? 'bg-success text-white' :
                    node.status === 'current' ? 'bg-primary text-white animate-pulse' :
                    'bg-gray-200 text-gray-400'
                  )}>
                    {node.status === 'done' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : node.status === 'current' ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        'text-sm font-semibold',
                        node.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                      )}>
                        {node.label}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono">
                        {typeof node.time === 'string' ? node.time : formatDateTime(node.time)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-0.5">
                      操作人: <span className="text-gray-800">{node.operator || '-'}</span>
                    </div>
                    {node.content && (
                      <div className="text-xs text-gray-500">{node.content}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isFailed && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={onRetry}
              loading={retryLoading}
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1', retryLoading && 'animate-spin')} />
              重试打款
            </Button>
            <Button
              variant="accent"
              size="sm"
              className="flex-1"
              onClick={onCompensate}
            >
              <HeartPulse className="w-3.5 h-3.5 mr-1" />
              手动补偿
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
              onClick={onCloseManual}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              标记已处理
            </Button>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
            onClick={onClose}
          >
            关闭
          </Button>
        </div>
      </div>
    </Modal>
  );
}
