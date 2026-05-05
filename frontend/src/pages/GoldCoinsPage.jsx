import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { goldCoinsApi } from '../api'

function GoldCoinsPage() {
  const [goldHotels, setGoldHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [balance, setBalance] = useState(null)
  const [records, setRecords] = useState([])
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)

  const [filters, setFilters] = useState({
    operator_id: '',
    start_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD')
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const res = await goldCoinsApi.getHotelsWithGold()
      setGoldHotels(res.data)
      
      if (res.data.length > 0) {
        const firstHotel = res.data[0]
        setSelectedHotel(firstHotel)
        fetchHotelData(firstHotel.id)
      }
    } catch (error) {
      console.error('获取金币数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHotelData = async (hotelId) => {
    try {
      const [balanceRes, operatorsRes] = await Promise.all([
        goldCoinsApi.getBalance(hotelId),
        goldCoinsApi.getOperatorsWithRecords(hotelId)
      ])

      setBalance(balanceRes.data)
      setOperators(operatorsRes.data)
      
      const defaultOperatorId = operatorsRes.data.length > 0 
        ? operatorsRes.data[0].id.toString() 
        : ''
      
      setFilters({
        operator_id: defaultOperatorId,
        start_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().format('YYYY-MM-DD')
      })
    } catch (error) {
      console.error('获取客栈金币数据失败:', error)
    }
  }

  const fetchRecords = async () => {
    if (!selectedHotel) return
    
    setRecordsLoading(true)
    try {
      const params = { hotel_id: selectedHotel.id }
      if (filters.operator_id) params.operator_id = filters.operator_id
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date

      const res = await goldCoinsApi.getRecords(params)
      setRecords(res.data)
    } catch (error) {
      console.error('获取金币明细失败:', error)
    } finally {
      setRecordsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedHotel) {
      fetchRecords()
    }
  }, [selectedHotel, filters])

  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel)
    fetchHotelData(hotel.id)
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFilters({
      operator_id: '',
      start_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
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
      <h2 className="page-title">金币明细</h2>

      <div className="hotel-selector">
        <div className="hotel-selector-label">选择客栈</div>
        <div className="hotel-tabs">
          {goldHotels.map(hotel => (
            <button
              key={hotel.id}
              className={`hotel-tab ${selectedHotel?.id === hotel.id ? 'active' : ''}`}
              onClick={() => handleHotelSelect(hotel)}
            >
              {hotel.name}
            </button>
          ))}
        </div>
      </div>

      {selectedHotel && (
        <>
          <div className="balance-summary">
            <span className="balance-label">{selectedHotel.name} - 金币余额：</span>
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
                  <th>渠道</th>
                  <th>订单号</th>
                  <th>金币奖励</th>
                  <th>奖励说明</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td>{dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</td>
                    <td>{record.hotel_name || '-'}</td>
                    <td>{record.operator_name || '-'}</td>
                    <td>{record.channel || '-'}</td>
                    <td>{record.order_no || '-'}</td>
                    <td>
                      <span className="amount-positive">+{record.amount?.toFixed(2)}</span>
                    </td>
                    <td className="reason-cell">{record.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">暂无金币明细记录</div>
          )}
        </>
      )}

      {!selectedHotel && goldHotels.length === 0 && (
        <div className="no-data">暂无客栈金币数据</div>
      )}
    </div>
  )
}

export default GoldCoinsPage
