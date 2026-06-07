import React, { useState, useEffect } from 'react'
import { getAdminStats, getOutages, getPVContracts, getPolicies, getSatisfaction, getWarnings } from '../services/api'

const mockStats = {
  total_users: 20,
  total_meters: 30,
  total_bills: 25,
  pending_bills: 8,
  active_outages: 5,
  total_stations: 20,
  available_stations: 15,
  total_pv_contracts: 10,
  average_satisfaction: 3.8
}

const mockOutages = [
  { order_id: 'OUT001', meter_id: 'M001', outage_type: '计划停电', reason: '线路检修', start_time: '2024-01-15T08:00:00Z', status: 'reported', priority: '高' },
  { order_id: 'OUT002', meter_id: 'M002', outage_type: '故障停电', reason: '变压器故障', start_time: '2024-01-15T10:30:00Z', status: 'processing', priority: '高' },
  { order_id: 'OUT003', meter_id: 'M003', outage_type: '临时停电', reason: '设备更换', start_time: '2024-01-14T14:00:00Z', status: 'resolved', priority: '中' },
  { order_id: 'OUT004', meter_id: 'M004', outage_type: '故障停电', reason: '电缆断裂', start_time: '2024-01-14T09:15:00Z', status: 'reported', priority: '高' },
  { order_id: 'OUT005', meter_id: 'M005', outage_type: '计划停电', reason: '设备升级', start_time: '2024-01-13T16:00:00Z', status: 'processing', priority: '低' }
]

const mockApplications = [
  { contract_id: 'PV001', user_id: 'USER001', capacity: 10, status: 'applying' },
  { contract_id: 'PV002', user_id: 'USER002', capacity: 15, status: 'approved' },
  { contract_id: 'PV003', user_id: 'USER003', capacity: 8, status: 'rejected' },
  { contract_id: 'PV004', user_id: 'USER004', capacity: 20, status: 'applying' },
  { contract_id: 'PV005', user_id: 'USER005', capacity: 12, status: 'approved' }
]

const mockPolicies = [
  { doc_id: 'DOC001', title: '光伏并网补贴政策', category: '补贴政策', summary: '关于分布式光伏发电并网补贴的实施方案', published_date: '2024-01-10' },
  { doc_id: 'DOC002', title: '电价调整通知', category: '电价政策', summary: '2024年居民用电价格调整方案', published_date: '2024-01-08' },
  { doc_id: 'DOC003', title: '充电桩建设规范', category: '建设标准', summary: '电动汽车充电桩建设技术规范及审批流程', published_date: '2024-01-05' },
  { doc_id: 'DOC004', title: '停电应急管理办法', category: '应急管理', summary: '突发停电事件应急响应及处置管理办法', published_date: '2024-01-03' },
  { doc_id: 'DOC005', title: '用电安全宣传手册', category: '安全规范', summary: '居民及企业安全用电指导手册', published_date: '2024-01-01' }
]

const mockSatisfactions = [
  { evaluation_id: 'E001', user_id: 'USER001', service_type: '报修服务', score: 5, comment: '响应迅速，处理及时', created_at: '2024-01-15T10:00:00Z' },
  { evaluation_id: 'E002', user_id: 'USER002', service_type: '咨询解答', score: 4, comment: '解答详细，态度好', created_at: '2024-01-14T15:30:00Z' },
  { evaluation_id: 'E003', user_id: 'USER003', service_type: '停电处理', score: 3, comment: '处理时间较长', created_at: '2024-01-13T09:00:00Z' },
  { evaluation_id: 'E004', user_id: 'USER004', service_type: '安装服务', score: 5, comment: '安装规范，服务周到', created_at: '2024-01-12T14:00:00Z' },
  { evaluation_id: 'E005', user_id: 'USER005', service_type: '投诉处理', score: 2, comment: '投诉处理不满意', created_at: '2024-01-11T11:00:00Z' }
]

const mockWarnings = [
  { time: '2024-01-15 14:30', type: '设备故障', level: '高', desc: '变电站A变压器温度异常', status: 'pending' },
  { time: '2024-01-15 12:15', type: '负载过高', level: '中', desc: '线路负载率达到85%', status: 'pending' },
  { time: '2024-01-15 10:00', type: '电压波动', level: '低', desc: '台区电压偏低', status: 'resolved' }
]

function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(mockStats)
  const [outages, setOutages] = useState(mockOutages)
  const [applications, setApplications] = useState(mockApplications)
  const [policies, setPolicies] = useState(mockPolicies)
  const [satisfactions, setSatisfactions] = useState(mockSatisfactions)
  const [warnings, setWarnings] = useState(mockWarnings)
  const [loading, setLoading] = useState(true)
  const [selectedOutage, setSelectedOutage] = useState(null)
  const [selectedWarning, setSelectedWarning] = useState(null)
  const [selectedSatisfaction, setSelectedSatisfaction] = useState(null)
  const [selectedPolicy, setSelectedPolicy] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const statsRes = await getAdminStats()
      setStats(statsRes.data)
    } catch (err) {
      setStats(mockStats)
    }
    try {
      const outagesRes = await getOutages()
      setOutages(outagesRes.data)
    } catch (err) {
      setOutages(mockOutages)
    }
    try {
      const pvRes = await getPVContracts()
      setApplications(pvRes.data)
    } catch (err) {
      setApplications(mockApplications)
    }
    try {
      const policiesRes = await getPolicies()
      setPolicies(policiesRes.data)
    } catch (err) {
      setPolicies(mockPolicies)
    }
    try {
      const satRes = await getSatisfaction()
      setSatisfactions(satRes.data)
    } catch (err) {
      setSatisfactions(mockSatisfactions)
    }
    try {
      const warnRes = await getWarnings()
      setWarnings(warnRes.data)
    } catch (err) {
      setWarnings(mockWarnings)
    }
    setLoading(false)
  }

  const handleUpdateOutage = (id, status) => {
    alert(`工单 ${id} 状态已更新为 ${status === 'resolved' ? '已解决' : '处理中'}`)
    setOutages(outages.map(out =>
      out.order_id === id ? { ...out, status } : out
    ))
  }

  const handleResolveWarning = (index) => {
    alert('预警已标记为处理')
    setWarnings(warnings.map((w, i) => 
      i === index ? { ...w, status: 'resolved' } : w
    ))
  }

  const handleReplySatisfaction = (id) => {
    alert(`满意度 ${id} 已标记为已回复并闭环处理`)
    setSatisfactions(satisfactions.map(s =>
      s.evaluation_id === id ? { ...s, replied: true } : s
    ))
  }

  const tabs = [
    { id: 'overview', name: '🏢 运营概览' },
    { id: 'outages', name: '⚡ 停电管理' },
    { id: 'warnings', name: '⚠️ 预警中心' },
    { id: 'satisfaction', name: '⭐ 服务评价' },
    { id: 'policies', name: '📜 政策文件' },
    { id: 'shortcuts', name: '🔧 快捷操作' }
  ]

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div>
      <h2 className="page-title">⚙️ 后台管理</h2>

      <nav className="nav-tabs mb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-4 mb-2">
            <div className="card stat-card">
              <div className="stat-value">{stats?.total_users || 0}</div>
              <div className="stat-label">用户总数</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats?.active_outages || 0}</div>
              <div className="stat-label">活跃停电</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats?.total_pv_contracts || 0}</div>
              <div className="stat-label">光伏合同</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats?.average_satisfaction || 0}</div>
              <div className="stat-label">平均满意度</div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 className="card-title">📊 最近申请</h3>
              <div className="scroll-y" style={{ maxHeight: '300px' }}>
                {applications.slice(0, 5).map(app => (
                  <div key={app.contract_id} className="card" style={{ marginBottom: '0.75rem' }}>
                    <div className="flex flex-between">
                      <div>
                        <strong>光伏并网 - {app.capacity}kW</strong>
                        <div className="text-secondary text-sm">{app.user_id}</div>
                      </div>
                      <div>
                        <span className={`badge ${
                          app.status === 'applying' ? 'badge-warning' :
                          app.status === 'approved' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {app.status === 'applying' ? '待处理' :
                           app.status === 'approved' ? '已批准' : '已拒绝'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">🔔 系统状态</h3>
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <strong>✅ 系统运行正常</strong>
              </div>
              <div className="grid grid-2">
                <div className="card">
                  <div className="text-secondary">在线用户</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {Math.floor((stats?.total_users || 0) * 0.6)}
                  </div>
                </div>
                <div className="card">
                  <div className="text-secondary">可用充电站</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {stats?.available_stations || 0}/{stats?.total_stations || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'outages' && (
        <div className="card">
          <h3 className="card-title">⚡ 停电管理</h3>

          <div className="flex gap-1 mb-2 flex-wrap">
            <button className="btn btn-primary" onClick={() => alert('新建工单功能已触发')}>
              🔧 新建工单
            </button>
            <button className="btn btn-outline" onClick={loadData}>
              🔄 刷新数据
            </button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>工单ID</th>
                <th>停电类型</th>
                <th>电表ID</th>
                <th>原因</th>
                <th>开始时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {outages.map(outage => (
                <tr key={outage.order_id}>
                  <td>{outage.order_id}</td>
                  <td>{outage.outage_type}</td>
                  <td>{outage.meter_id}</td>
                  <td>{outage.reason}</td>
                  <td>{new Date(outage.start_time).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${
                      outage.status === 'reported' ? 'badge-danger' :
                      outage.status === 'processing' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {outage.status === 'reported' ? '已上报' :
                       outage.status === 'processing' ? '处理中' : '已解决'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button
                        className="btn btn-success"
                        onClick={() => handleUpdateOutage(outage.order_id, 'resolved')}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        解决
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => setSelectedOutage(outage)}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        复查
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'warnings' && (
        <div className="card">
          <h3 className="card-title">⚠️ 预警中心</h3>

          <div className="grid grid-3 mb-2">
            <div className="card">
              <div className="text-secondary">设备预警</div>
              <div className="text-danger" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {warnings.filter(w => w.type === '设备故障' && w.status === 'pending').length}
              </div>
            </div>
            <div className="card">
              <div className="text-secondary">负载预警</div>
              <div className="text-warning" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {warnings.filter(w => w.type === '负载过高' && w.status === 'pending').length}
              </div>
            </div>
            <div className="card">
              <div className="text-secondary">已处理</div>
              <div className="text-success" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {warnings.filter(w => w.status === 'resolved').length}
              </div>
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>时间</th>
                <th>类型</th>
                <th>级别</th>
                <th>描述</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {warnings.map((warning, index) => (
                <tr key={index}>
                  <td>{warning.time}</td>
                  <td>{warning.type}</td>
                  <td>
                    <span className={`badge ${
                      warning.level === '高' ? 'badge-danger' :
                      warning.level === '中' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {warning.level}
                    </span>
                  </td>
                  <td>{warning.desc}</td>
                  <td>
                    <span className={`badge ${warning.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                      {warning.status === 'pending' ? '待处理' : '已处理'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button 
                        className="btn btn-primary" 
                        onClick={() => setSelectedWarning({...warning, index})}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        处理
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => handleResolveWarning(index)}
                        disabled={warning.status === 'resolved'}
                      >
                        标记完成
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'satisfaction' && (
        <div className="card">
          <h3 className="card-title">⭐ 服务评价</h3>

          <div className="grid grid-4 mb-2">
            <div className="card stat-card">
              <div className="stat-value">{satisfactions.filter(s => s.score === 5).length}</div>
              <div className="stat-label">5星</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{satisfactions.filter(s => s.score === 4).length}</div>
              <div className="stat-label">4星</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{satisfactions.filter(s => s.score === 3).length}</div>
              <div className="stat-label">3星</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{satisfactions.filter(s => s.score <= 2).length}</div>
              <div className="stat-label">1-2星</div>
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>评价ID</th>
                <th>用户</th>
                <th>服务类型</th>
                <th>评分</th>
                <th>评价内容</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {satisfactions.map(sat => (
                <tr key={sat.evaluation_id}>
                  <td>{sat.evaluation_id}</td>
                  <td>{sat.user_id}</td>
                  <td>{sat.service_type}</td>
                  <td>
                    <span style={{ color: '#ffc107' }}>
                      {'⭐'.repeat(sat.score)}{'☆'.repeat(5 - sat.score)}
                    </span>
                  </td>
                  <td>{sat.comment || '暂无评价'}</td>
                  <td>{new Date(sat.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button 
                        className="btn btn-primary" 
                        onClick={() => setSelectedSatisfaction(sat)}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        复查
                      </button>
                      <button 
                        className={`btn ${sat.replied ? 'btn-outline' : 'btn-success'}`}
                        onClick={() => handleReplySatisfaction(sat.evaluation_id)}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        disabled={sat.replied}
                      >
                        {sat.replied ? '已闭环' : '闭环处理'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="card">
          <h3 className="card-title">📜 政策文件</h3>

          <div className="flex gap-1 mb-2 flex-wrap">
            <button className="btn btn-primary" onClick={() => alert('新建政策功能已触发')}>
              ➕ 新建政策
            </button>
            <button className="btn btn-outline" onClick={loadData}>
              🔄 刷新
            </button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>文档ID</th>
                <th>标题</th>
                <th>分类</th>
                <th>摘要</th>
                <th>发布日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {policies.map(policy => (
                <tr key={policy.doc_id}>
                  <td>{policy.doc_id}</td>
                  <td><strong>{policy.title}</strong></td>
                  <td>{policy.category}</td>
                  <td>{policy.summary}</td>
                  <td>{policy.published_date}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        查看
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        编辑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'shortcuts' && (
        <div className="grid grid-3">
          <div className="card">
            <h3 className="card-title">👤 用户管理</h3>
            <div className="flex flex-col gap-1">
              <button className="btn btn-outline">用户列表</button>
              <button className="btn btn-outline">新建用户</button>
              <button className="btn btn-outline">批量导入</button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">📊 数据报表</h3>
            <div className="flex flex-col gap-1">
              <button className="btn btn-outline">用电报表</button>
              <button className="btn btn-outline">营收统计</button>
              <button className="btn btn-outline">运维报表</button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">⚙️ 系统设置</h3>
            <div className="flex flex-col gap-1">
              <button className="btn btn-outline">参数配置</button>
              <button className="btn btn-outline">权限管理</button>
              <button className="btn btn-outline">日志查看</button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">📞 工单管理</h3>
            <div className="flex flex-col gap-1">
              <button className="btn btn-outline">报修处理</button>
              <button className="btn btn-outline">投诉处理</button>
              <button className="btn btn-outline">建议处理</button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">📈 分析工具</h3>
            <div className="flex flex-col gap-1">
              <button className="btn btn-outline">负载预测</button>
              <button className="btn btn-outline">故障分析</button>
              <button className="btn btn-outline">满意度分析</button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">🔔 通知管理</h3>
            <div className="flex flex-col gap-1">
              <button className="btn btn-outline">推送通知</button>
              <button className="btn btn-outline">短信发送</button>
              <button className="btn btn-outline">消息模板</button>
            </div>
          </div>
        </div>
      )}

      {selectedOutage && (
        <div className="card mt-2" style={{ border: '2px solid #ff9800' }}>
          <div className="flex flex-between mb-1">
            <h3 className="card-title" style={{ margin: 0 }}>⚡ 停电工单复查 - {selectedOutage.order_id}</h3>
            <button className="btn btn-outline" onClick={() => setSelectedOutage(null)}>关闭</button>
          </div>
          <div className="grid grid-2">
            <div>
              <div className="form-group">
                <label className="form-label">工单编号</label>
                <div style={{ fontWeight: 700 }}>{selectedOutage.order_id}</div>
              </div>
              <div className="form-group">
                <label className="form-label">停电类型</label>
                <div>{selectedOutage.outage_type}</div>
              </div>
              <div className="form-group">
                <label className="form-label">电表编号</label>
                <div>{selectedOutage.meter_id}</div>
              </div>
              <div className="form-group">
                <label className="form-label">优先级</label>
                <span className={`badge ${selectedOutage.priority === '高' ? 'badge-danger' : selectedOutage.priority === '中' ? 'badge-warning' : 'badge-success'}`}>
                  {selectedOutage.priority}
                </span>
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">停电原因</label>
                <div>{selectedOutage.reason}</div>
              </div>
              <div className="form-group">
                <label className="form-label">开始时间</label>
                <div>{new Date(selectedOutage.start_time).toLocaleString()}</div>
              </div>
              <div className="form-group">
                <label className="form-label">当前状态</label>
                <span className={`badge ${
                  selectedOutage.status === 'reported' ? 'badge-danger' :
                  selectedOutage.status === 'processing' ? 'badge-warning' : 'badge-success'
                }`}>
                  {selectedOutage.status === 'reported' ? '已上报' :
                   selectedOutage.status === 'processing' ? '处理中' : '已解决'}
                </span>
              </div>
            </div>
          </div>
          <div className="card mt-1">
            <h4>📝 处理记录</h4>
            <div className="text-secondary">• 工单已创建，正在安排维修人员</div>
            <div className="text-secondary">• 预计处理时间: 2小时内</div>
          </div>
          <div className="flex gap-1 mt-2">
            <button className="btn btn-success" onClick={() => {
              handleUpdateOutage(selectedOutage.order_id, 'resolved')
              setSelectedOutage(null)
            }}>
              标记已解决
            </button>
            <button className="btn btn-outline" onClick={() => setSelectedOutage(null)}>
              返回
            </button>
          </div>
        </div>
      )}

      {selectedWarning && (
        <div className="card mt-2" style={{ border: '2px solid #f44336' }}>
          <div className="flex flex-between mb-1">
            <h3 className="card-title" style={{ margin: 0 }}>⚠️ 预警处理 - {selectedWarning.type}</h3>
            <button className="btn btn-outline" onClick={() => setSelectedWarning(null)}>关闭</button>
          </div>
          <div className="grid grid-2">
            <div>
              <div className="form-group">
                <label className="form-label">预警时间</label>
                <div>{selectedWarning.time}</div>
              </div>
              <div className="form-group">
                <label className="form-label">预警类型</label>
                <div>{selectedWarning.type}</div>
              </div>
              <div className="form-group">
                <label className="form-label">预警级别</label>
                <span className={`badge ${
                  selectedWarning.level === '高' ? 'badge-danger' :
                  selectedWarning.level === '中' ? 'badge-warning' : 'badge-success'
                }`}>
                  {selectedWarning.level}
                </span>
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">预警描述</label>
                <div>{selectedWarning.desc}</div>
              </div>
              <div className="form-group">
                <label className="form-label">当前状态</label>
                <span className={`badge ${selectedWarning.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                  {selectedWarning.status === 'pending' ? '待处理' : '已处理'}
                </span>
              </div>
            </div>
          </div>
          <div className="card mt-1">
            <h4>📋 处理建议</h4>
            <ul style={{ marginLeft: '1.5rem' }}>
              <li>立即安排运维人员现场检查</li>
              <li>记录设备运行参数，分析异常原因</li>
              <li>评估是否需要更换设备部件</li>
              <li>处理完成后更新预警状态</li>
            </ul>
          </div>
          <div className="flex gap-1 mt-2">
            <button className="btn btn-primary" onClick={() => {
              handleResolveWarning(selectedWarning.index)
              setSelectedWarning(null)
            }}>
              标记已处理
            </button>
            <button className="btn btn-outline" onClick={() => setSelectedWarning(null)}>
              返回
            </button>
          </div>
        </div>
      )}

      {selectedSatisfaction && (
        <div className="card mt-2" style={{ border: '2px solid #9c27b0' }}>
          <div className="flex flex-between mb-1">
            <h3 className="card-title" style={{ margin: 0 }}>⭐ 满意度复查 - {selectedSatisfaction.evaluation_id}</h3>
            <button className="btn btn-outline" onClick={() => setSelectedSatisfaction(null)}>关闭</button>
          </div>
          <div className="grid grid-2">
            <div>
              <div className="form-group">
                <label className="form-label">评价编号</label>
                <div style={{ fontWeight: 700 }}>{selectedSatisfaction.evaluation_id}</div>
              </div>
              <div className="form-group">
                <label className="form-label">用户编号</label>
                <div>{selectedSatisfaction.user_id}</div>
              </div>
              <div className="form-group">
                <label className="form-label">服务类型</label>
                <div>{selectedSatisfaction.service_type}</div>
              </div>
              <div className="form-group">
                <label className="form-label">评价时间</label>
                <div>{new Date(selectedSatisfaction.created_at).toLocaleString()}</div>
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">评分</label>
                <div style={{ color: '#ffc107', fontSize: '1.5rem' }}>
                  {'⭐'.repeat(selectedSatisfaction.score)}{'☆'.repeat(5 - selectedSatisfaction.score)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">评价内容</label>
                <div>{selectedSatisfaction.comment || '暂无评价'}</div>
              </div>
              <div className="form-group">
                <label className="form-label">闭环状态</label>
                <span className={`badge ${selectedSatisfaction.replied ? 'badge-success' : 'badge-warning'}`}>
                  {selectedSatisfaction.replied ? '已闭环' : '待处理'}
                </span>
              </div>
            </div>
          </div>
          {selectedSatisfaction.score <= 3 && (
            <div className="alert alert-warning mt-1">
              <strong>⚠️ 低分预警</strong>
              <div>此评价为3星及以下，需重点关注并回访用户</div>
            </div>
          )}
          <div className="card mt-1">
            <h4>📞 回访建议</h4>
            <ul style={{ marginLeft: '1.5rem' }}>
              <li>24小时内安排客服人员电话回访</li>
              <li>了解用户不满意的具体原因</li>
              <li>提出改进措施并向用户反馈</li>
              <li>记录回访结果，更新服务质量数据库</li>
            </ul>
          </div>
          <div className="flex gap-1 mt-2">
            <button className="btn btn-success" onClick={() => {
              handleReplySatisfaction(selectedSatisfaction.evaluation_id)
              setSelectedSatisfaction(null)
            }}>
              标记已闭环
            </button>
            <button className="btn btn-outline" onClick={() => setSelectedSatisfaction(null)}>
              返回
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
