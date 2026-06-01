import { useEffect, useState } from 'react'
import { billsAPI, contractsAPI } from '../api'

interface Bill {
  id: number
  contract_id: number
  contract_code: string
  customer_name: string
  warehouse_name: string
  bill_no: string
  period: string
  amount: number
  rent_amount: number
  property_amount: number
  due_date: string
  status: string
  late_fee: number
  discount: number
  invoice_no: string
  invoice_date: string
  paid_amount: number
  paid_date: string
  created_at: string
}

export default function Bills() {
  const [bills, setBills] = useState<Bill[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [showPayModal, setShowPayModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('bank')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    loadBills()
  }, [filterStatus])

  const loadBills = async () => {
    try {
      const res = await billsAPI.getAll(filterStatus ? { status: filterStatus } : {})
      setBills(res.data)
    } catch (error) {
      console.error('加载账单列表失败:', error)
    }
  }

  const loadPayments = async (id: number) => {
    try {
      const res = await billsAPI.getPayments(id)
      setPayments(res.data)
    } catch (error) {
      console.error('加载付款记录失败:', error)
    }
  }

  const handlePay = (bill: Bill) => {
    setSelectedBill(bill)
    setPayAmount(bill.amount - bill.paid_amount)
    setShowPayModal(true)
  }

  const submitPay = async () => {
    if (!selectedBill || payAmount <= 0) return
    try {
      await billsAPI.pay(selectedBill.id, { amount: payAmount, payment_method: payMethod })
      setShowPayModal(false)
      loadBills()
    } catch (error: any) {
      alert(error.response?.data?.error || '付款失败')
    }
  }

  const handleInvoice = (bill: Bill) => {
    setSelectedBill(bill)
    setInvoiceNo(bill.invoice_no || '')
    setShowInvoiceModal(true)
  }

  const submitInvoice = async () => {
    if (!selectedBill || !invoiceNo) return
    try {
      await billsAPI.invoice(selectedBill.id, { invoice_no: invoiceNo })
      setShowInvoiceModal(false)
      loadBills()
    } catch (error: any) {
      alert(error.response?.data?.error || '开票失败')
    }
  }

  const handleDiscount = async (bill: Bill) => {
    const amount = prompt('请输入减免金额：')
    if (!amount) return
    try {
      await billsAPI.discount(bill.id, { discount: Number(amount), reason: '手动减免' })
      loadBills()
    } catch (error: any) {
      alert(error.response?.data?.error || '减免失败')
    }
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      unpaid: '未支付',
      partial: '部分支付',
      paid: '已结清',
    }
    return map[status] || status
  }

  return (
    <div>
      <div className="page-header">
        <h1>租金账单管理</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="btn btn-default"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="unpaid">未支付</option>
            <option value="partial">部分支付</option>
            <option value="paid">已结清</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>账单编号</th>
                <th>合同</th>
                <th>客户</th>
                <th>仓库</th>
                <th>账期</th>
                <th>应收金额</th>
                <th>已收金额</th>
                <th>到期日</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id}>
                  <td>{b.bill_no}</td>
                  <td>{b.contract_code}</td>
                  <td>{b.customer_name}</td>
                  <td>{b.warehouse_name}</td>
                  <td>{b.period}</td>
                  <td>¥{b.amount?.toLocaleString()}</td>
                  <td>¥{b.paid_amount?.toLocaleString()}</td>
                  <td>{b.due_date}</td>
                  <td>
                    <span className={`status-badge status-${b.status}`}>
                      {getStatusText(b.status)}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      {b.status !== 'paid' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handlePay(b)}>
                            收款
                          </button>
                          <button className="btn btn-warning btn-sm" onClick={() => handleDiscount(b)}>
                            减免
                          </button>
                        </>
                      )}
                      {!b.invoice_no && (
                        <button className="btn btn-default btn-sm" onClick={() => handleInvoice(b)}>
                          开票
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPayModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>登记收款</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid" style={{ marginBottom: '20px' }}>
                <div className="detail-item">
                  <label>账单编号</label>
                  <div className="value">{selectedBill.bill_no}</div>
                </div>
                <div className="detail-item">
                  <label>账单金额</label>
                  <div className="value">¥{selectedBill.amount?.toLocaleString()}</div>
                </div>
                <div className="detail-item">
                  <label>已收金额</label>
                  <div className="value">¥{selectedBill.paid_amount?.toLocaleString()}</div>
                </div>
                <div className="detail-item">
                  <label>待收金额</label>
                  <div className="value" style={{ color: '#ff4d4f' }}>
                    ¥{(selectedBill.amount - selectedBill.paid_amount).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>收款金额</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>收款方式</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                    <option value="bank">银行转账</option>
                    <option value="cash">现金</option>
                    <option value="alipay">支付宝</option>
                    <option value="wechat">微信</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" onClick={() => setShowPayModal(false)}>
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={submitPay}>
                确认收款
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>登记开票</h3>
              <button className="modal-close" onClick={() => setShowInvoiceModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>发票号码</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="请输入发票号码"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" onClick={() => setShowInvoiceModal(false)}>
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={submitInvoice}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
