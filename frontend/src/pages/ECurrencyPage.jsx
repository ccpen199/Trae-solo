import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { eCurrencyApi } from '../api'

function ECurrencyPage() {
  const [balance, setBalance] = useState(null)
  const [records, setRecords] = useState([])
  const [operators, setOperators] = useState([])
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)

  const [filters, setFilters] = useState({
    operator_id: '',
    hotel_id: '',
    start_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD')
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [filters])

  const fetchInitialData = async () => {
    try {
      const [balanceRes, operatorsRes, hotelsRes] = await Promise.all([
        eCurrencyApi.getBalance(),
        eCurrencyApi.getOperatorsWithRecords(),
        eCurrencyApi.getHotelsWithRecords()
      ])

      setBalance(balanceRes.data)
      setOperators(operatorsRes.data)
      setHotels(hotelsRes.data)
    } catch (error) {
      console.error('获取E币数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecords = async () => {
    setRecordsLoading(true)
    try {
      const params = {}
      if (filters.operator_id) params.operator_id = filters.operator_id
      if (filters.hotel_id) params.hotel_id = filters.hotel_id
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date

      const res = await eCurrencyApi.getRecords(params)
      setRecords(res.data)
    } catch (error) {
      console.error('获取E币明细失败:', error)
    } finally {
      setRecordsLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFilters({
      operator_id: '',
      hotel_id: '',
      start_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
      end_date: dayjs().format('YYYY-MM-DD')
    })
  }

  const handleSearch = () => {
    fetchRecords()
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h2 className="page-title">E币明细</h2>

      <div className="balance-summary">
        <span className="balance-label">E币余额：</span>
        <span className="balance-value">{balance?.balance?.toFixed(2) || '0.00'}</span>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label className="filter-label">操作人</label>
            <select
              className="filter-select"
              value={filters.operator_id}
              onChange={(e) => handleFilterChange('operator_id', e.target.value)}
            >
              <option value="">全部</option>
              {operators.map(op => (
                <option key={op.id} value={op.id}>{op.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">分店</label>
            <select
              className="filter-select"
              value={filters.hotel_id}
              onChange={(e) => handleFilterChange('hotel_id', e.target.value)}
            >
              <option value="">全部</option>
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">开始日期</label>
            <input
              type="date"
              className="filter-input"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">结束日期</label>
            <input
              type="date"
              className="filter-input"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <button className="btn btn-primary" onClick={handleSearch}>
              搜索
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>
              重置
            </button>
          </div>
        </div>
      </div>

      {recordsLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <span>加载明细中...</span>
        </div>
      ) : records.length > 0 ? (
        <table className="records-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>客栈</th>
              <th>操作人</th>
              <th>订单号</th>
              <th>渠道</th>
              <th>订单类型</th>
              <th>E币奖励</th>
              <th>奖励说明</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id}>
                <td>{dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</td>
                <td>{record.hotel_name || '-'}</td>
                <td>{record.operator_name || '-'}</td>
                <td>{record.order_no || '-'}</td>
                <td>{record.channel || '-'}</td>
                <td>{record.order_type || '-'}</td>
                <td>
                  <span className="amount-positive">+{record.amount?.toFixed(2)}</span>
                </td>
                <td className="reason-cell">{record.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="no-data">暂无E币明细记录</div>
      )}
    </div>
  )
}

export default ECurrencyPage
