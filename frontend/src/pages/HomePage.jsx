import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { chartsApi } from '../api/index'
import useChartStore from '../store/chartStore'

const CHART_TYPES = {
  bar: '柱状图',
  line: '折线图',
  area: '面积图',
  pie: '饼图'
}

const HomePage = () => {
  const navigate = useNavigate()
  const { charts, setCharts, loading, setLoading, error, setError } = useChartStore()
  const [swipedId, setSwipedId] = useState(null)

  const fetchCharts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await chartsApi.getList()
      setCharts(res.data || [])
    } catch (err) {
      setError(err.message || '获取图表列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCharts()
  }, [])

  const handleCreateChart = async () => {
    try {
      const res = await chartsApi.create({ title: '未命名图表', type: 'bar' })
      toast.success('创建成功')
      navigate(`/chart/${res.data.id}`)
    } catch (err) {
      toast.error('创建失败')
    }
  }

  const handleChartClick = (id) => {
    if (swipedId) {
      setSwipedId(null)
      return
    }
    navigate(`/chart/${id}`)
  }

  const handleCopy = async (e, id) => {
    e.stopPropagation()
    try {
      const res = await chartsApi.copy(id)
      toast.success('复制成功')
      navigate(`/chart/${res.data.id}`)
      fetchCharts()
    } catch (err) {
      toast.error('复制失败')
    }
  }

  const handleExport = (e, id) => {
    e.stopPropagation()
    toast.success('导出功能开发中')
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await chartsApi.delete(id)
      toast.success('删除成功')
      fetchCharts()
    } catch (err) {
      toast.error('删除失败')
    }
  }

  const handleSwipeStart = (id) => {
    return (e) => {
      const touch = e.touches?.[0] || e
      startX = touch.clientX
      setSwipedId(null)
    }
  }

  let startX = 0

  const handleSwipeMove = (id) => {
    return (e) => {
      const touch = e.touches?.[0] || e
      const diff = startX - touch.clientX
      if (diff > 50) {
        setSwipedId(id)
      } else if (diff < -30) {
        setSwipedId(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading-state">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <div className="error-text">{error}</div>
          <button className="retry-btn" onClick={fetchCharts}>重试</button>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-title">我的图表</div>
        <div className="home-subtitle">共 {charts.length} 个图表</div>
      </div>

      <div className="chart-list">
        {!charts || charts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-text">还没有图表，点击右下角创建</div>
          </div>
        ) : (
          charts.map((chart) => (
            <div
              key={chart.id}
              className={`chart-item ${swipedId === chart.id ? 'swiped' : ''}`}
              onClick={() => handleChartClick(chart.id)}
              onMouseDown={handleSwipeStart(chart.id)}
              onMouseMove={handleSwipeMove(chart.id)}
              onTouchStart={handleSwipeStart(chart.id)}
              onTouchMove={handleSwipeMove(chart.id)}
            >
              <div className="chart-item-header">
                <div className="chart-item-title">{chart.title || '未命名图表'}</div>
                <div className="chart-item-type">{CHART_TYPES[chart.type] || '柱状图'}</div>
              </div>
              <div className="chart-item-meta">
                {chart.data_count || 0} 组数据 · {new Date(chart.updated_at).toLocaleDateString()}
              </div>
              <div className="chart-item-preview">
                {(chart.data_points || []).slice(0, 8).map((dp, i) => (
                  <div
                    key={i}
                    className="chart-item-bar"
                    style={{
                      backgroundColor: dp.color || '#667eea',
                      height: `${Math.min((dp.value / 100) * 100, 100)}%`
                    }}
                  />
                ))}
              </div>
              <div className="chart-actions">
                <button className="chart-action-btn copy" onClick={(e) => handleCopy(e, chart.id)}>
                  <span>📋</span>
                  <span>复制</span>
                </button>
                <button className="chart-action-btn export" onClick={(e) => handleExport(e, chart.id)}>
                  <span>📤</span>
                  <span>导出</span>
                </button>
                <button className="chart-action-btn delete" onClick={(e) => handleDelete(e, chart.id)}>
                  <span>🗑️</span>
                  <span>删除</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="new-chart-btn" onClick={handleCreateChart}>
        +
      </button>
    </div>
  )
}

export default HomePage
