import { useState } from 'react';
import { Receipt, Clock, CheckCircle2, FileText, CreditCard, X, Download, AlertTriangle } from 'lucide-react';
import EnterpriseNavbar from '@/components/EnterpriseNavbar';
import BillCard from '@/components/BillCard';
import { useEnterpriseStore } from '@/store/useEnterpriseStore';
import type { Bill } from '@/types';
import { cn } from '@/lib/utils';

type BillTab = 'unpaid' | 'paid';

export default function EnterpriseBilling() {
  const enterprise = useEnterpriseStore((state) => state.enterprise);
  const bills = useEnterpriseStore((state) => state.bills);
  const payBill = useEnterpriseStore((state) => state.payBill);

  const [activeTab, setActiveTab] = useState<BillTab>('unpaid');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceBill, setInvoiceBill] = useState<Bill | null>(null);

  const enterpriseBills = enterprise
    ? bills.filter((b) => b.enterprise_id === enterprise.id)
    : [];

  const unpaidBills = enterpriseBills.filter((b) => b.status === 'unpaid');
  const paidBills = enterpriseBills.filter((b) => b.status === 'paid');

  const filteredBills = activeTab === 'unpaid' ? unpaidBills : paidBills;

  const totalUnpaid = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = paidBills.reduce((sum, b) => sum + b.amount, 0);

  const handlePay = (bill: Bill) => {
    setSelectedBill(bill);
    setShowPayModal(true);
  };

  const confirmPay = () => {
    if (selectedBill) {
      payBill(selectedBill.id);
      setShowPayModal(false);
      setSelectedBill(null);
    }
  };

  const handleApplyInvoice = (bill: Bill) => {
    setInvoiceBill(bill);
    setShowInvoiceModal(true);
  };

  const tabs: { key: BillTab; label: string; icon: typeof Receipt; count: number }[] = [
    { key: 'unpaid', label: '待支付', icon: Clock, count: unpaidBills.length },
    { key: 'paid', label: '已支付', icon: CheckCircle2, count: paidBills.length },
  ];

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <EnterpriseNavbar />

      <section className="relative overflow-hidden gradient-mesh">
        <div className="container mx-auto px-4 py-10">
          <div className="animate-fade-up">
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-2">账单管理</h1>
            <p className="text-secondary-500">查看和支付您的企业账单，申请发票</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="card p-5 bg-gradient-to-br from-primary-500 to-primary-600 text-white animate-fade-up stagger-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 opacity-90 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">待支付金额</span>
                  </div>
                  <p className="text-3xl font-bold">¥{totalUnpaid.toLocaleString()}</p>
                  <p className="text-sm opacity-80 mt-1">{unpaidBills.length} 笔账单待处理</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              </div>
            </div>

            <div className="card p-5 bg-gradient-to-br from-secondary-500 to-secondary-600 text-white animate-fade-up stagger-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 opacity-90 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">累计已支付</span>
                  </div>
                  <p className="text-3xl font-bold">¥{totalPaid.toLocaleString()}</p>
                  <p className="text-sm opacity-80 mt-1">{paidBills.length} 笔账单已结清</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Receipt className="w-7 h-7" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="card overflow-hidden animate-fade-up">
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative',
                    isActive
                      ? 'text-primary-600'
                      : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs',
                    isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {tab.count}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-5 md:p-6">
            {filteredBills.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-10 h-10 text-secondary-300" />
                </div>
                <p className="text-secondary-500">
                  {activeTab === 'unpaid' ? '暂无待支付账单' : '暂无已支付账单'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    onPay={handlePay}
                    onViewDetail={setSelectedBill}
                    onApplyInvoice={handleApplyInvoice}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedBill && !showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-secondary-800">账单详情</h3>
                  <p className="text-xs text-secondary-500">账单号 #{selectedBill.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="p-2 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
              <div className="flex items-center justify-between">
                <span className="text-secondary-500">账期</span>
                <span className="font-medium text-secondary-800">{selectedBill.period}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-500">状态</span>
                <span className={selectedBill.status === 'unpaid' ? 'badge-orange' : 'badge-green'}>
                  {selectedBill.status === 'unpaid' ? '待支付' : '已支付'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-500">出账日期</span>
                <span className="font-medium text-secondary-800">{formatDate(selectedBill.issued_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-500">截止日期</span>
                <span className="font-medium text-secondary-800">{formatDate(selectedBill.due_date)}</span>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-secondary-500 mb-3">账单明细</p>
                <div className="space-y-2">
                  {selectedBill.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 bg-cream-100 rounded-lg px-3">
                      <span className="text-secondary-600">{item.description}</span>
                      <span className="font-medium text-secondary-800">¥{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-secondary-700 font-medium">应付金额</span>
                  <span className="text-2xl font-bold text-primary-600">¥{selectedBill.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setSelectedBill(null)}
                className="btn-secondary !py-2.5 !px-5"
              >
                关闭
              </button>
              {selectedBill.status === 'unpaid' && (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="btn-primary !py-2.5 !px-5 flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  立即支付
                </button>
              )}
              {selectedBill.status === 'paid' && (
                <button
                  onClick={() => {
                    handleApplyInvoice(selectedBill);
                    setSelectedBill(null);
                  }}
                  className="btn-primary !py-2.5 !px-5 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  申请发票
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPayModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-secondary-800">确认支付</h3>
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setSelectedBill(null);
                }}
                className="p-2 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="text-center py-4">
                <p className="text-secondary-500 mb-2">支付金额</p>
                <p className="text-4xl font-bold text-primary-600">¥{selectedBill.amount.toLocaleString()}</p>
                <p className="text-sm text-secondary-500 mt-2">{selectedBill.period} 账单</p>
              </div>

              <div className="bg-cream-100 rounded-xl p-4">
                <p className="text-sm text-secondary-600 mb-3">选择支付方式</p>
                <div className="space-y-2">
                  {[
                    { label: '企业对公转账', desc: '支持银行对公账户转账', recommended: true },
                    { label: '企业支付宝', desc: '使用企业支付宝账户支付', recommended: false },
                    { label: '企业微信支付', desc: '使用企业微信账户支付', recommended: false },
                  ].map((method, idx) => (
                    <label
                      key={method.label}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                        idx === 0
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-secondary-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          idx === 0 ? 'border-primary-500' : 'border-gray-300'
                        )}>
                          {idx === 0 && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-800 flex items-center gap-2">
                            {method.label}
                            {method.recommended && (
                              <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">推荐</span>
                            )}
                          </p>
                          <p className="text-xs text-secondary-500">{method.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setSelectedBill(null);
                }}
                className="btn-secondary !py-2.5 !px-5"
              >
                取消
              </button>
              <button
                onClick={confirmPay}
                className="btn-primary !py-2.5 !px-5 flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                确认支付
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && invoiceBill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-secondary-800">申请发票</h3>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceBill(null);
                }}
                className="p-2 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-cream-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-secondary-500">关联账单</span>
                  <span className="font-medium text-secondary-800">{invoiceBill.period}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-500">开票金额</span>
                  <span className="text-xl font-bold text-primary-600">¥{invoiceBill.amount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">发票类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {['增值税专用发票', '增值税普通发票'].map((type, idx) => (
                    <button
                      key={type}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-sm font-medium transition-all border',
                        idx === 0
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-secondary-600 hover:border-secondary-300'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">发票抬头</label>
                <input
                  type="text"
                  defaultValue={enterprise?.name}
                  className="input-field"
                  placeholder="请输入企业全称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">纳税人识别号</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="请输入纳税人识别号"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">接收邮箱</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="请输入接收发票的邮箱"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceBill(null);
                }}
                className="btn-secondary !py-2.5 !px-5"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceBill(null);
                }}
                className="btn-primary !py-2.5 !px-5 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-secondary-800 text-white py-10 mt-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-secondary-400 text-sm">
            © 2025 暖心到家 版权所有
          </div>
        </div>
      </footer>
    </div>
  );
}
