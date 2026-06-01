import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { chartsApi } from '../api/index'
import useChartStore from '../store/chartStore'

const COLORS = [
  '#ffffff', '#f5f5f5', '#f0f9ff', '#f0fdf4', '#fffbeb',
  '#fef2f2', '#faf5ff', '#fdf2f8', '#18181b', '#27272a'
]

const FONT_SIZES = [12, 14, 16, 18, 20, 24]

const SettingsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setCurrentChart, loading, setLoading, error, setError } = useChartStore()
  const [localTitle, setLocalTitle] = useState('')
  const [localSettings, setLocalSettings] = useState({
    backgroundColor: '#ffffff',
    fontSize: 14,
    showLegend: true,
    showDataLabel: false,
    animation: true,
    borderRadius: 4,
    gridColor: '#e5e7eb',
    axisColor: '#6b7280',
    titleColor: '#111827'
  })
  const saveTimerRef = useRef(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    chartsApi.getDetail(id)
      .then(res => {
        setCurrentChart(res.data)
        setLocalTitle(res.data.title || '')
        if (res.data.settings) {
          setLocalSettings(prev => ({ ...prev, ...res.data.settings }))
        }
      })
      .catch(err => {
        setError(err.message || '获取图表失败')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id, setLoading, setError, setCurrentChart])

  const saveData = (data) => {
    if (!id) return
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      chartsApi.updateSilent(id, data).catch(() => {})
    }, 800)
  }

  const handleTitleChange = (e) => {
    const value = e.target.value
    setLocalTitle(value)
    setCurrentChart(prev => prev ? { ...prev, title: value } : prev)
    saveData({ title: value })
  }

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    setCurrentChart(prev => prev ? { ...prev, settings: newSettings } : prev)
    saveData({ settings: newSettings })
    toast.success('设置已保存')
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-state">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="settings-page">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <div className="error-text">{error}</div>
          <button className="retry-btn" onClick={() => window.location.reload()}>重试</button>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate(`/chart/${id}`)}>←</button>
        <h1 className="settings-title">图表设置</h1>
        <div className="settings-spacer" />
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2 className="settings-section-title">基本设置</h2>
          
          <div className="setting-row">
            <label className="setting-label">图表名称</label>
            <input
              className="setting-input"
              type="text"
              value={localTitle}
              onChange={handleTitleChange}
              placeholder="输入图表名称"
            />
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">外观设置</h2>
          
          <div className="setting-row">
            <label className="setting-label">背景颜色</label>
            <div className="color-picker-inline">
              {COLORS.map((color, i) => (
                <button
                  key={i}
                  className={`color-option-small ${localSettings.backgroundColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleSettingChange('backgroundColor', color)}
                />
              ))}
            </div>
          </div>

          <div className="setting-row">
            <label className="setting-label">字体大小</label>
            <select
              className="setting-select"
              value={localSettings.fontSize}
              onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </div>

          <div className="setting-row">
            <label className="setting-label">圆角大小</label>
            <input
              className="setting-input"
              type="number"
              min="0"
              max="20"
              value={localSettings.borderRadius}
              onChange={(e) => handleSettingChange('borderRadius', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">显示选项</h2>
          
          <div className="setting-row">
            <label className="setting-label">显示图例</label>
            <button
              className={`setting-toggle ${localSettings.showLegend ? 'active' : ''}`}
              onClick={() => handleSettingChange('showLegend', !localSettings.showLegend)}
            />
          </div>

          <div className="setting-row">
            <label className="setting-label">显示数据标签</label>
            <button
              className={`setting-toggle ${localSettings.showDataLabel ? 'active' : ''}`}
              onClick={() => handleSettingChange('showDataLabel', !localSettings.showDataLabel)}
            />
          </div>

          <div className="setting-row">
            <label className="setting-label">开启动画</label>
            <button
              className={`setting-toggle ${localSettings.animation ? 'active' : ''}`}
              onClick={() => handleSettingChange('animation', !localSettings.animation)}
            />
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">颜色设置</h2>
          
          <div className="setting-row">
            <label className="setting-label">网格颜色</label>
            <div className="color-picker-inline">
              {['#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563'].map((color, i) => (
                <button
                  key={i}
                  className={`color-option-small ${localSettings.gridColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleSettingChange('gridColor', color)}
                />
              ))}
            </div>
          </div>

          <div className="setting-row">
            <label className="setting-label">坐标轴颜色</label>
            <div className="color-picker-inline">
              {['#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'].map((color, i) => (
                <button
                  key={i}
                  className={`color-option-small ${localSettings.axisColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleSettingChange('axisColor', color)}
                />
              ))}
            </div>
          </div>

          <div className="setting-row">
            <label className="setting-label">标题颜色</label>
            <div className="color-picker-inline">
              {['#111827', '#1f2937', '#374151', '#4b5563', '#6b7280'].map((color, i) => (
                <button
                  key={i}
                  className={`color-option-small ${localSettings.titleColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleSettingChange('titleColor', color)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
