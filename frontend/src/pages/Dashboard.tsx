import { useEffect, useState } from 'react'
import { reportsAPI } from '../api'

interface OverviewData {
  warehouses: {
    total: number
    available: number
    rented: number
    maintenance: number
    total_area: number
  }
  contracts: {
    total: number
    draft: number
    approved: number
    terminated: number
  }
  bills: {
    total: number
    unpaid: number
    partial: number
    paid: number
    total_amount: number
    paid_amount: number
  }
  overdue_bills: {
    count: number
  }
}

export default function Dashboard() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOverview()
  }, [])

  const loadOverview = async () => {
    try {
      const res = await reportsAPI.getOverview()
      setData(res.data)
    } catch (error) {
      console.error('加载概览数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>
  if (!data) return <div>数据加载失败</div>

  return (
    <div>
      <div className="page-header">
        <h1>数据概览</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>仓库总数</h4>
          <div className="value">{data.warehouses.total}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#595959' }}>
            <span style={{ color: '#52c41a' }}>可租 {data.warehouses.available}</span>
            <span style={{ margin: '0 8px' }}>|</span>
            <span style={{ color: '#1890ff' }}>已租 {data.warehouses.rented}</span>
          </div>
        </div>
        <div className="stat-card">
          <h4>在租面积</h4>
          <div className="value">{data.warehouses.total_area?.toLocaleString() || 0} ㎡</div>
        </div>
        <div className="stat-card">
          <h4>生效合同</h4>
          <div className="value">{data.contracts.approved}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#595959' }}>
            待审批 {data.contracts.draft} 份
          </div>
        </div>
        <div className="stat-card">
          <h4>待收租金</h4>
          <div className="value">¥{(data.bills.total_amount - data.bills.paid_amount)?.toLocaleString() || 0}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#ff4d4f' }}>
            逾期账单 {data.overdue_bills.count} 笔
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>租金账单统计</h3>
        </div>
        <div className="card-body">
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div>
              <div style={{ fontSize: '14px', color: '#595959', marginBottom: '8px' }}>账单总数</div>
              <div style={{ fontSize: '24px', fontWeight: 600 }}>{data.bills.total}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#595959', marginBottom: '8px' }}>未支付</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#ff4d4f' }}>{data.bills.unpaid}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#595959', marginBottom: '8px' }}>部分支付</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#faad14' }}>{data.bills.partial}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#595959', marginBottom: '8px' }}>已结清</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#52c41a' }}>{data.bills.paid}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
