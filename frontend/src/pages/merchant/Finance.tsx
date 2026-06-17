import { useState } from 'react'
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'

interface FinanceRecord {
  id: string
  type: 'income' | 'withdraw' | 'refund'
  amount: number
  description: string
  status: 'completed' | 'pending' | 'failed'
  createdAt: string
}

const mockRecords: FinanceRecord[] = [
  { id: '1', type: 'income', amount: 56, description: '订单 ORD001 收入', status: 'completed', createdAt: '2024-01-15 12:30' },
  { id: '2', type: 'income', amount: 18, description: '订单 ORD002 收入', status: 'completed', createdAt: '2024-01-15 11:20' },
  { id: '3', type: 'withdraw', amount: -500, description: '提现至微信', status: 'pending', createdAt: '2024-01-14 16:00' },
  { id: '4', type: 'refund', amount: -35, description: '订单 ORD003 退款', status: 'completed', createdAt: '2024-01-14 14:00' },
  { id: '5', type: 'income', amount: 85, description: '订单 ORD004 收入', status: 'completed', createdAt: '2024-01-14 10:30' },
  { id: '6', type: 'income', amount: 42, description: '订单 ORD005 收入', status: 'completed', createdAt: '2024-01-13 18:00' },
  { id: '7', type: 'withdraw', amount: -1000, description: '提现至银行卡', status: 'completed', createdAt: '2024-01-13 09:00' },
  { id: '8', type: 'income', amount: 128, description: '订单 ORD006 收入', status: 'completed', createdAt: '2024-01-12 20:00' },
]

const statusConfig: Record<FinanceRecord['status'], { label: string; color: 'green' | 'yellow' | 'gray' }> = {
  completed: { label: '已完成', color: 'green' },
  pending: { label: '处理中', color: 'yellow' },
  failed: { label: '失败', color: 'gray' },
}

export default function Finance() {
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const totalIncome = mockRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalWithdraw = mockRecords.filter((r) => r.type === 'withdraw').reduce((s, r) => s + Math.abs(r.amount), 0)
  const balance = totalIncome - totalWithdraw - mockRecords.filter((r) => r.type === 'refund').reduce((s, r) => s + Math.abs(r.amount), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">商户财务</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">账户余额</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">¥{balance.toLocaleString()}</div>
          <div className="mt-3">
            <Button size="sm" icon={<ArrowUpRight className="w-3.5 h-3.5" />} onClick={() => setWithdrawOpen(true)}>
              提现
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">累计收入</span>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">¥{totalIncome.toLocaleString()}</div>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
            <ArrowDownRight className="w-3.5 h-3.5" />
            较上月 +15%
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">累计提现</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">¥{totalWithdraw.toLocaleString()}</div>
          <div className="mt-2 text-xs text-gray-400">含手续费 ¥{Math.round(totalWithdraw * 0.006)}</div>
        </Card>
      </div>

      <Card>
        <h3 className="text-base font-semibold text-gray-900 mb-4">收支明细</h3>
        <div className="space-y-3">
          {mockRecords.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    record.type === 'income'
                      ? 'bg-green-50'
                      : record.type === 'withdraw'
                        ? 'bg-amber-50'
                        : 'bg-red-50'
                  }`}
                >
                  {record.type === 'income' ? (
                    <ArrowDownRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{record.description}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{record.createdAt}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tag color={statusConfig[record.status].color} size="sm">
                  {statusConfig[record.status].label}
                </Tag>
                <span
                  className={`text-base font-semibold ${
                    record.amount > 0 ? 'text-green-600' : 'text-gray-900'
                  }`}
                >
                  {record.amount > 0 ? '+' : ''}¥{Math.abs(record.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="申请提现"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWithdrawOpen(false)}>取消</Button>
            <Button onClick={() => setWithdrawOpen(false)}>确认提现</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">可提现余额</div>
            <div className="text-2xl font-bold text-blue-600">¥{balance.toLocaleString()}</div>
          </div>
          <Input
            label="提现金额"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="请输入提现金额"
            suffix={<span className="text-sm text-gray-400">元</span>}
          />
          <div className="flex gap-2">
            {['100', '500', '1000', '全部'].map((v) => (
              <button
                key={v}
                onClick={() => setWithdrawAmount(v === '全部' ? String(balance) : v)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {v === '全部' ? '全部' : `¥${v}`}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">提现手续费 0.6%，预计1-3个工作日到账</p>
        </div>
      </Modal>
    </div>
  )
}
