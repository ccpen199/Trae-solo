import { useState } from 'react'
import axios from 'axios'

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [testProgress, setTestProgress] = useState([])
  const [testCompleted, setTestCompleted] = useState(false)

  const downloadFile = (url, filename) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportComparison = (format) => {
    const url = `/api/reports/comparison/export?checkin_date=${selectedDate}&format=${format}`
    const filename = `comparison_${selectedDate}.${format}`
    downloadFile(url, filename)
  }

  const exportCollection = (format) => {
    const endDate = new Date(selectedDate)
    endDate.setDate(endDate.getDate() + 7)
    const endDateStr = endDate.toISOString().split('T')[0]
    const url = `/api/reports/collection/export?start_date=${selectedDate}&end_date=${endDateStr}&format=${format}`
    const filename = `collection_${selectedDate}_${endDateStr}.${format}`
    downloadFile(url, filename)
  }

  const testScenarios = [
    { id: 'hotel', label: '酒店和房型基础数据' },
    { id: 'mapping', label: '多渠道映射关系（携程/美团/飞猪/去哪儿/自有平台）' },
    { id: 'price', label: '各渠道价格采集（含不同税费口径）' },
    { id: 'inverted', label: '价格倒挂（我方价格高于竞品）' },
    { id: 'inventory', label: '库存异常（竞品零库存或高库存差异）' },
    { id: 'retry', label: '采集失败记录和重试机制' },
    { id: 'promotion', label: '促销活动和折扣记录' }
  ]

  const generateTestData = async () => {
    if (!confirm('确定生成测试数据？这将创建酒店、房型、映射和价格采集记录。')) return
    
    setLoading(true)
    setTestProgress([])
    setTestCompleted(false)
    
    try {
      setTestProgress(['hotel', 'mapping', 'price', 'retry', 'promotion'])
      const res = await axios.post('/api/reports/testdata/generate', { checkin_date: selectedDate })
      setTestCompleted(true)
      setMessage(`✅ 测试数据生成成功！酒店ID: ${res.data.hotel_id}, 房型ID: ${res.data.room_id}`)
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      setMessage('❌ 生成失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const runFullTest = async () => {
    if (!confirm('运行完整自测流程？这将生成测试数据并运行比价分析。')) return
    
    setLoading(true)
    setTestProgress([])
    setTestCompleted(false)
    
    try {
      setMessage('1/3 生成测试数据...')
      setTestProgress(['hotel', 'mapping', 'price', 'retry', 'promotion'])
      await axios.post('/api/reports/testdata/generate', { checkin_date: selectedDate })
      
      setMessage('2/3 运行比价分析...')
      setTestProgress(prev => [...prev, 'inverted', 'inventory'])
      await axios.post('/api/comparison/run', { checkin_date: selectedDate })
      
      setMessage('3/3 生成调价任务...')
      await axios.post('/api/strategies/tasks/generate', { checkin_date: selectedDate })
      
      setTestCompleted(true)
      setMessage('🎉 自测完成！请切换到各功能页面查看结果')
    } catch (err) {
      setMessage('❌ 自测失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="header">
        <h1>📋 报表中心</h1>
      </div>

      {message && (
        <div className="card" style={{background: '#e3f2fd', borderLeft: '4px solid #2d5a87'}}>
          <div className="card-body">{message}</div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>🧪 自测工具</h2></div>
        <div className="card-body">
          <div className="form-group">
            <label>选择测试日期</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{maxWidth: 200}} />
          </div>
          <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
            <button className="btn btn-warning" onClick={generateTestData} disabled={loading}>
              {loading ? '处理中...' : '生成测试数据'}
            </button>
            <button className="btn btn-primary" onClick={runFullTest} disabled={loading}>
              一键完整自测
            </button>
          </div>
          <div className="detail-panel" style={{marginTop: 16}}>
            <h4>自测覆盖场景：{testCompleted && <span style={{color: '#28a745', marginLeft: 8}}>✓ 全部完成</span>}</h4>
            <ul style={{marginLeft: 20, lineHeight: 2.2, listStyle: 'none', padding: 0}}>
              {testScenarios.map(scenario => {
                const isDone = testProgress.includes(scenario.id)
                const isRunning = loading && !isDone
                return (
                  <li key={scenario.id} style={{
                    opacity: isDone ? 1 : (loading ? 0.6 : 1),
                    transition: 'all 0.3s'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: 24,
                      color: isDone ? '#28a745' : (isRunning ? '#ffc107' : '#ccc')
                    }}>
                      {isDone ? '✅' : (isRunning ? '⏳' : '○')}
                    </span>
                    {scenario.label}
                  </li>
                )
              })}
            </ul>
            {testCompleted && (
              <div style={{marginTop: 16, padding: 12, background: '#d4edda', borderRadius: 4, color: '#155724'}}>
                💡 提示：数据已生成，请点击左侧菜单查看各模块数据
                <ul style={{marginTop: 8, marginLeft: 20}}>
                  <li>「酒店房型」查看创建的酒店和房型</li>
                  <li>「映射管理」查看渠道映射关系</li>
                  <li>「价格采集」查看各渠道价格记录</li>
                  <li>「比价分析」查看价差和价格倒挂分析</li>
                  <li>「价格策略」查看调价任务</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>📊 比价分析报表</h2></div>
        <div className="card-body">
          <p style={{marginBottom: 12, color: '#666'}}>导出指定日期的比价分析结果，包含价格倒挂、库存异常等监控指标</p>
          <div style={{display: 'flex', gap: 8}}>
            <button className="btn btn-primary" onClick={() => exportComparison('csv')}>导出 CSV</button>
            <button className="btn btn-primary" onClick={() => exportComparison('json')}>导出 JSON</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>📡 价格采集报表</h2></div>
        <div className="card-body">
          <p style={{marginBottom: 12, color: '#666'}}>导出最近7天的价格采集记录，可追溯原始采集数据</p>
          <div style={{display: 'flex', gap: 8}}>
            <button className="btn btn-primary" onClick={() => exportCollection('csv')}>导出 CSV</button>
            <button className="btn btn-primary" onClick={() => exportCollection('json')}>导出 JSON</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>📝 功能说明</h2></div>
        <div className="card-body">
          <div className="form-row">
            <div>
              <h4 style={{marginBottom: 8}}>核心功能模块：</h4>
              <ul style={{marginLeft: 20, lineHeight: 2}}>
                <li><strong>酒店房型：</strong>维护酒店和房型基础信息</li>
                <li><strong>映射管理：</strong>维护渠道与内部酒店/房型映射，不确定时人工确认</li>
                <li><strong>价格采集：</strong>记录渠道价格、税费、库存、促销，失败可重试</li>
                <li><strong>比价分析：</strong>计算价差、检测价格倒挂、下钻原始数据</li>
                <li><strong>价格策略：</strong>配置目标价差、告警阈值、人工确认调价任务</li>
              </ul>
            </div>
            <div>
              <h4 style={{marginBottom: 8}}>数据流向说明：</h4>
              <ol style={{marginLeft: 20, lineHeight: 2}}>
                <li>渠道价格采集 → price_collections 表</li>
                <li>比价计算 → comparison_results 表（价差后端预计算，非前端临时计算）</li>
                <li>异常检测 → 标记价格倒挂和库存异常</li>
                <li>策略匹配 → 生成调价任务待人工确认</li>
                <li>人工确认 → 执行调价并记录操作</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
