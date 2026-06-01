import { useEffect, useRef, useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
import toast from 'react-hot-toast'
import { chartsApi } from '../api/index'
import useChartStore from '../store/chartStore'

const CHART_TYPES = [
  { key: 'bar', label: '柱状图' },
  { key: 'line', label: '折线图' },
  { key: 'area', label: '面积图' },
  { key: 'pie', label: '饼图' }
]

const ChartEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const svgRef = useRef(null)
  const saveTimerRef = useRef(null)
  const [localTitle, setLocalTitle] = useState('')
  const {
    currentChart, setCurrentChart,
    loading, setLoading,
    error, setError,
    currentPanel, setCurrentPanel,
    COLORS,
    colorPicker, showColorPicker, hideColorPicker,
    updateDataPoint, updateAxisSettings, validateValue
  } = useChartStore()

  const fetchChart = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await chartsApi.getDetail(id)
      setCurrentChart(res.data)
      setLocalTitle(res.data.title || '')
    } catch (err) {
      setError(err.message || '获取图表失败')
    } finally {
      setLoading(false)
    }
  }, [id, setLoading, setError, setCurrentChart])

  useEffect(() => {
    fetchChart()
  }, [fetchChart])

  useEffect(() => {
    if (!svgRef.current || !currentChart?.data_points?.length) return

    const data = currentChart.data_points
    const container = svgRef.current.parentElement
    const width = container.clientWidth - 40
    const height = container.clientHeight - 40
    const { y_min = 0, y_max = 100 } = currentChart.axis_settings || {}

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'chart-svg')

    if (currentChart.type === 'pie') {
      renderPieChart(svg, data, width, height)
    } else {
      renderCartesianChart(svg, data, width, height, y_min, y_max)
    }
  }, [currentChart])

  const renderPieChart = (svg, data, width, height) => {
    const radius = Math.min(width, height) / 2 - 20
    const centerX = width / 2
    const centerY = height / 2

    const pie = d3.pie().value(d => d.value)
    const arc = d3.arc().innerRadius(0).outerRadius(radius)

    const arcs = svg.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .attr('transform', `translate(${centerX}, ${centerY})`)

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .style('cursor', 'pointer')
  }

  const renderCartesianChart = (svg, data, width, height, yMin, yMax) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const x = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, chartWidth])
      .padding(0.2)

    const y = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([chartHeight, 0])

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '12px')

    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '12px')

    if (currentChart.type === 'bar') {
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.label))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => chartHeight - y(d.value))
        .attr('fill', d => d.color)
        .attr('rx', 4)
        .style('cursor', 'pointer')
    } else if (currentChart.type === 'line' || currentChart.type === 'area') {
      const line = d3.line()
        .x(d => x(d.label) + x.bandwidth() / 2)
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX)

      if (currentChart.type === 'area') {
        const area = d3.area()
          .x(d => x(d.label) + x.bandwidth() / 2)
          .y0(chartHeight)
          .y1(d => y(d.value))
          .curve(d3.curveMonotoneX)

        g.append('path')
          .datum(data)
          .attr('fill', data[0]?.color + '40')
          .attr('d', area)
      }

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', data[0]?.color)
        .attr('stroke-width', 3)
        .attr('d', line)

      g.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.label) + x.bandwidth() / 2)
        .attr('cy', d => y(d.value))
        .attr('r', 6)
        .attr('fill', d => d.color)
        .style('cursor', 'pointer')
    }
  }

  const handleTitleChange = (e) => {
    const value = e.target.value
    setLocalTitle(value)
    setCurrentChart(prev => prev ? { ...prev, title: value } : prev)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      chartsApi.updateSilent(id, { title: value }).catch(() => {})
    }, 800)
  }

  const handleTypeChange = (type) => {
    if (!currentChart) return
    setCurrentChart({ ...currentChart, type })
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      chartsApi.updateSilent(id, { type }).catch(() => {})
    }, 800)
  }

  const saveChartData = useCallback(() => {
    if (!currentChart || !id) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      chartsApi.updateSilent(id, {
        data_points: currentChart.data_points,
        axis_settings: currentChart.axis_settings
      }).catch(() => {})
    }, 800)
  }, [currentChart, id])

  const handleValueChange = (index, value) => {
    const { y_min = 0, y_max = 100 } = currentChart?.axis_settings || {}
    const validation = validateValue(value, y_min, y_max)
    if (!validation.valid) {
      toast.error(validation.message)
      return
    }
    updateDataPoint(index, { value: validation.value })
    saveChartData()
  }

  const handleColorSelect = (color) => {
    if (colorPicker.index >= 0) {
      updateDataPoint(colorPicker.index, { color })
      saveChartData()
    }
    hideColorPicker()
  }

  const handleAxisChange = (key, value) => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      toast.error('请输入有效数字')
      return
    }
    updateAxisSettings({ [key]: num })
    saveChartData()
  }

  const handleToggleChange = (key) => {
    const current = currentChart?.axis_settings?.[key]
    updateAxisSettings({ [key]: !current })
    saveChartData()
  }

  if (loading) {
    return (
      <div className="editor-page">
        <div className="loading-state">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="editor-page">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <div className="error-text">{error}</div>
          <button className="retry-btn" onClick={fetchChart}>重试</button>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-page">
      <div className="editor-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <input
          className="editor-title"
          value={localTitle}
          onChange={handleTitleChange}
          placeholder="图表标题"
        />
        <button className="settings-btn" onClick={() => navigate(`/chart/${id}/settings`)}>⚙️</button>
      </div>

      <div className="chart-type-tabs">
        {CHART_TYPES.map(type => (
          <button
            key={type.key}
            className={`chart-type-tab ${currentChart?.type === type.key ? 'active' : ''}`}
            onClick={() => handleTypeChange(type.key)}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="chart-canvas-container">
        <svg ref={svgRef} />
      </div>

      <div className="chart-panel">
        <div className="panel-tabs">
          <button
            className={`panel-tab ${currentPanel === 'data' ? 'active' : ''}`}
            onClick={() => setCurrentPanel('data')}
          >
            数据
          </button>
          <button
            className={`panel-tab ${currentPanel === 'axis' ? 'active' : ''}`}
            onClick={() => setCurrentPanel('axis')}
          >
            坐标轴
          </button>
          <button
            className={`panel-tab ${currentPanel === 'style' ? 'active' : ''}`}
            onClick={() => setCurrentPanel('style')}
          >
            样式
          </button>
        </div>

        <div className="panel-content">
          {currentPanel === 'data' && (
            <div className="data-point-list">
              {(currentChart?.data_points || []).map((dp, i) => (
                <div key={i} className="data-point-item">
                  <button
                    className="data-point-color"
                    style={{ backgroundColor: dp.color }}
                    onClick={() => showColorPicker(i)}
                  />
                  <div className="data-point-label">{dp.label}</div>
                  <input
                    className="data-point-value"
                    type="number"
                    value={dp.value}
                    onChange={(e) => handleValueChange(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {currentPanel === 'axis' && (
            <div className="axis-settings">
              <div className="setting-row">
                <span className="setting-label">Y轴最小值</span>
                <input
                  className="setting-input"
                  type="number"
                  value={currentChart?.axis_settings?.y_min || 0}
                  onChange={(e) => handleAxisChange('y_min', e.target.value)}
                />
              </div>
              <div className="setting-row">
                <span className="setting-label">Y轴最大值</span>
                <input
                  className="setting-input"
                  type="number"
                  value={currentChart?.axis_settings?.y_max || 100}
                  onChange={(e) => handleAxisChange('y_max', e.target.value)}
                />
              </div>
              <div className="setting-row">
                <span className="setting-label">显示网格</span>
                <button
                  className={`setting-toggle ${currentChart?.axis_settings?.show_grid ? 'active' : ''}`}
                  onClick={() => handleToggleChange('show_grid')}
                />
              </div>
              <div className="setting-row">
                <span className="setting-label">显示对齐线</span>
                <button
                  className={`setting-toggle ${currentChart?.axis_settings?.show_align_line ? 'active' : ''}`}
                  onClick={() => handleToggleChange('show_align_line')}
                />
              </div>
            </div>
          )}

          {currentPanel === 'style' && (
            <div className="style-settings">
              <div className="empty-state">
                <div className="empty-text">更多样式功能开发中...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {colorPicker.visible && (
        <div
          className="color-picker-popup"
          style={{ bottom: '60%', left: '50%', transform: 'translateX(-50%)' }}
        >
          {COLORS.map((color, i) => (
            <button
              key={i}
              className="color-option"
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ChartEditor
