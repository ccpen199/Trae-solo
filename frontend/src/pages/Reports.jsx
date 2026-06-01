import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Reports() {
  const [data, setData] = useState(null)
  const [expandedRep, setExpandedRep] = useState(null)
  const [expandedDoctor, setExpandedDoctor] = useState(null)

  useEffect(() => {
    axios.get('/api/reports/manager-view').then(res => setData(res.data))
  }, [])

  if (!data) return <div>加载中...</div>

  const toggleRep = (id) => {
    setExpandedRep(expandedRep === id ? null : id)
  }

  const toggleDoctor = (id) => {
    setExpandedDoctor(expandedDoctor === id ? null : id)
  }

  return (
    <div className="page-reports">
      <div className="page-header">
        <h1 className="page-title">经理报表视图</h1>
      </div>

      <div className="card">
        <div className="card-header">代表绩效概览</div>
        <div className="card-body">
          <div className="table-wrapper">
            <table className="table table-reports">
              <thead>
                <tr>
                  <th className="col-expand"></th>
                  <th className="col-name">代表姓名</th>
                  <th className="col-num">计划拜访数</th>
                  <th className="col-num">已完成拜访</th>
                  <th className="col-num">完成率</th>
                  <th className="col-num">待处理风险</th>
                  <th className="col-action">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.repStats.map(rep => (
                  <React.Fragment key={rep.id}>
                    <tr className={expandedRep === rep.id ? 'row-expanded' : ''}>
                      <td className="col-expand">
                        <button className="btn-expand" onClick={() => toggleRep(rep.id)}>
                          {expandedRep === rep.id ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="col-name">{rep.name}</td>
                      <td className="col-num">{rep.planned_visits}</td>
                      <td className="col-num">{rep.completed_visits}</td>
                      <td className="col-num">
                        <span className={rep.planned_visits > 0 && rep.completed_visits / rep.planned_visits < 0.6 ? 'tag tag-warning' : 'tag tag-success'}>
                          {rep.planned_visits > 0 ? Math.round(rep.completed_visits / rep.planned_visits * 100) : 0}%
                        </span>
                      </td>
                      <td className="col-num">{rep.pending_risks > 0 ? <span className="tag tag-danger">{rep.pending_risks}</span> : 0}</td>
                      <td className="col-action">
                        <button className="btn btn-link" onClick={() => toggleRep(rep.id)}>
                          {expandedRep === rep.id ? '收起详情' : '查看详情'}
                        </button>
                      </td>
                    </tr>
                    {expandedRep === rep.id && (
                      <tr className="row-detail">
                        <td colSpan={7}>
                          <div className="detail-panel">
                            <div className="detail-panel-title">详细分析</div>
                            <div className="detail-cards">
                              <div className="card card-sm">
                                <div className="card-body">
                                  <div className="stat-label">本月拜访趋势</div>
                                  <div className="trend-chart">
                                    {[3,5,2,6,4,5,7].map((h,i) => (
                                      <div key={i} className="trend-bar" style={{ height: h * 18 }}></div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="card card-sm">
                                <div className="card-body">
                                  <div className="stat-label">医生覆盖</div>
                                  <div className="stat-value">12位</div>
                                  <div className="stat-desc">覆盖3家医院，5个科室</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">医生合规状态监控</div>
        <div className="card-body">
          <div className="table-wrapper">
            <table className="table table-reports">
              <thead>
                <tr>
                  <th className="col-expand"></th>
                  <th className="col-name">医生姓名</th>
                  <th className="col-hospital">医院</th>
                  <th className="col-num">累计拜访</th>
                  <th className="col-num">月限次数</th>
                  <th className="col-status">合规状态</th>
                </tr>
              </thead>
              <tbody>
                {data.doctorCompliance.map(doc => (
                  <React.Fragment key={doc.id}>
                    <tr className={expandedDoctor === doc.id ? 'row-expanded' : ''}>
                      <td className="col-expand">
                        <button className="btn-expand" onClick={() => toggleDoctor(doc.id)}>
                          {expandedDoctor === doc.id ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="col-name">{doc.name}</td>
                      <td className="col-hospital">{doc.hospital_name}</td>
                      <td className="col-num">{doc.visit_count}</td>
                      <td className="col-num">{doc.visit_frequency_limit}次/月</td>
                      <td className="col-status">
                        {doc.visit_count > doc.visit_frequency_limit ? (
                          <span className="tag tag-danger">超频警告</span>
                        ) : (
                          <span className="tag tag-success">正常</span>
                        )}
                      </td>
                    </tr>
                    {expandedDoctor === doc.id && (
                      <tr className="row-detail">
                        <td colSpan={6}>
                          <div className="detail-panel">
                            <div className="detail-panel-title">拜访历史（最近5次）</div>
                            <table className="table table-inner">
                              <thead>
                                <tr>
                                  <th>日期</th>
                                  <th>代表</th>
                                  <th>资料使用</th>
                                  <th>合规状态</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>2024-01-15</td>
                                  <td>张代表</td>
                                  <td>产品说明书</td>
                                  <td><span className="tag tag-success">正常</span></td>
                                </tr>
                                <tr>
                                  <td>2024-01-08</td>
                                  <td>张代表</td>
                                  <td>临床研究数据（敏感）</td>
                                  <td><span className="tag tag-warning">需关注</span></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">合规通过率</div>
          <div className="stat-value">92%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">超频拜访</div>
          <div className="stat-value warning">3位医生</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">定位异常</div>
          <div className="stat-value">1次</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">敏感资料使用</div>
          <div className="stat-value">5次</div>
        </div>
      </div>
    </div>
  )
}

export default Reports
