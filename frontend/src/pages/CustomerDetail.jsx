import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { customers, documents, credit, approvals, common } from '../api'

export default function CustomerDetail({ currentUser, onUpdate }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const defaultNode = currentUser?.role === 'director' ? 'final' : 'review'
  const [approvalForm, setApprovalForm] = useState({ node: defaultNode, opinion: '', risk_tips: '', amount_suggestion: '', result: 'approved' })
  const [coBorrowerForm, setCoBorrowerForm] = useState({ name: '', id_card: '', phone: '', relationship: 'spouse' })
  const [showCoBorrowerForm, setShowCoBorrowerForm] = useState(false)

  useEffect(() => {
    loadCustomer()
  }, [id])

  useEffect(() => {
    const node = currentUser?.role === 'director' ? 'final' : 'review'
    setApprovalForm(prev => ({ ...prev, node }))
  }, [currentUser])

  async function loadCustomer() {
    const data = await customers.get(id)
    setCustomer(data)
  }

  async function updateDocument(docId, status, rejectReason = '') {
    await documents.update(docId, {
      status,
      reviewed_by: currentUser.id,
      reject_reason: rejectReason,
      uploaded_by: currentUser.id
    })
    loadCustomer()
    onUpdate?.()
  }

  async function createCreditAuth() {
    await credit.create(id, { created_by: currentUser.id })
    loadCustomer()
  }

  async function queryCredit(authId) {
    await credit.query(authId)
    loadCustomer()
  }

  async function submitApproval(e) {
    e.preventDefault()
    
    const now = new Date()
    const validAuth = customer.creditAuths?.find(auth => 
      auth.status === 'success' && auth.expire_time && new Date(auth.expire_time) > now
    )
    
    if (!validAuth) {
      alert('征信授权已过期或未完成，无法提交审批。请先完成征信查询。')
      return
    }
    
    try {
      await approvals.create(id, { ...approvalForm, operator_id: currentUser.id })
      setApprovalForm({ node: 'review', opinion: '', risk_tips: '', amount_suggestion: '', result: 'approved' })
      loadCustomer()
      onUpdate?.()
    } catch (err) {
      alert('提交审批失败：' + (err.message || '未知错误'))
    }
  }

  async function addCoBorrower(e) {
    e.preventDefault()
    await customers.addCoBorrower(id, coBorrowerForm)
    setShowCoBorrowerForm(false)
    setCoBorrowerForm({ name: '', id_card: '', phone: '', relationship: 'spouse' })
    loadCustomer()
  }

  if (!customer) return <div className="loading">加载中...</div>

  const docStatusConfig = {
    pending: { label: '待上传', class: 'status-pending', icon: '📤' },
    submitted: { label: '待审核', class: 'status-reviewing', icon: '⏳' },
    rejected: { label: '需补正', class: 'status-rejected', icon: '❌' },
    approved: { label: '已通过', class: 'status-approved', icon: '✅' }
  }

  const creditStatusConfig = {
    pending: { label: '待查询', class: 'status-pending' },
    success: { label: '查询成功', class: 'status-approved' },
    failed: { label: '查询失败', class: 'status-rejected' }
  }

  const maritalNames = { single: '未婚', married: '已婚', divorced: '离异' }

  return (
    <div className="customer-detail">
      <div className="page-header">
        <div>
          <button className="btn" onClick={() => navigate('/customers')}>← 返回</button>
          <h2 style={{ display: 'inline', marginLeft: '1rem' }}>客户详情 - {customer.name}</h2>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>基本信息</button>
        <button className={`tab ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>资料清单</button>
        <button className={`tab ${activeTab === 'credit' ? 'active' : ''}`} onClick={() => setActiveTab('credit')}>征信授权</button>
        <button className={`tab ${activeTab === 'approval' ? 'active' : ''}`} onClick={() => setActiveTab('approval')}>审批流程</button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <div className="info-section">
            <div className="info-card">
            <h3>📋 基本信息</h3>
            <div className="info-grid">
              <div className="info-item"><label>姓名</label><span>{customer.name}</span></div>
              <div className="info-item"><label>身份证号</label><span>{customer.id_card}</span></div>
              <div className="info-item"><label>联系电话</label><span>{customer.phone || '-'}</span></div>
              <div className="info-item"><label>电子邮箱</label><span>{customer.email || '-'}</span></div>
              <div className="info-item"><label>婚姻状况</label><span>{maritalNames[customer.marital_status]}</span></div>
              <div className="info-item"><label>居住地址</label><span>{customer.address || '-'}</span></div>
              <div className="info-item"><label>贷款产品</label><span>{customer.product_name}</span></div>
              <div className="info-item"><label>申请金额</label><span>¥{Number(customer.loan_amount || 0).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="info-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>👥 共同借款人</h3>
              <button className="btn btn-small btn-primary" onClick={() => setShowCoBorrowerForm(true)}>+ 添加</button>
            </div>
            
            {showCoBorrowerForm && (
              <form onSubmit={addCoBorrower} className="inline-form">
                <input placeholder="姓名" value={coBorrowerForm.name} onChange={e => setCoBorrowerForm({...coBorrowerForm, name: e.target.value})} required />
                <input placeholder="身份证号" value={coBorrowerForm.id_card} onChange={e => setCoBorrowerForm({...coBorrowerForm, id_card: e.target.value})} required />
                <input placeholder="电话" value={coBorrowerForm.phone} onChange={e => setCoBorrowerForm({...coBorrowerForm, phone: e.target.value})} />
                <button type="submit" className="btn btn-small btn-primary">保存</button>
                <button type="button" className="btn btn-small" onClick={() => setShowCoBorrowerForm(false)}>取消</button>
              </form>
            )}

            {customer.coBorrowers?.length > 0 ? (
              <div className="co-borrower-list">
                {customer.coBorrowers.map(cb => (
                  <div key={cb.id} className="co-borrower-item">
                    <strong>{cb.name}</strong>
                    <span>{cb.id_card}</span>
                    <span>{cb.phone || '-'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">暂无共同借款人信息</p>
            )}
          </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="documents-section">
            <div className="docs-grid">
              {customer.documents?.map(doc => (
                <div key={doc.id} className={`doc-card doc-${doc.status}`}>
                  <div className="doc-header">
                    <span className="doc-icon">{docStatusConfig[doc.status]?.icon || '📄'}</span>
                    <div>
                      <h4>{doc.name}</h4>
                      <span className={`status-tag ${docStatusConfig[doc.status]?.class}`}>
                        {docStatusConfig[doc.status]?.label}
                      </span>
                      <small className="version">版本: {doc.version}</small>
                    </div>
                  </div>
                  
                  {doc.reject_reason && (
                    <div className="reject-reason">
                      <strong>补正原因：</strong>{doc.reject_reason}
                    </div>
                  )}

                  {doc.status === 'approved' && (
                    <div className="doc-info">
                      <span>✅ 审核通过</span>
                      {doc.reviewer_name && <span className="reviewer">审核人: {doc.reviewer_name}</span>}
                    </div>
                  )}

                  {doc.status === 'submitted' && doc.uploader_name && (
                    <div className="doc-info">
                      <span>📤 已提交</span>
                      <span className="uploader">提交人: {doc.uploader_name}</span>
                    </div>
                  )}

                  <div className="doc-actions">
                    {doc.status === 'pending' && ['manager', 'specialist'].includes(currentUser.role) && (
                      <button className="btn btn-small btn-primary" onClick={() => updateDocument(doc.id, 'submitted')}>提交资料</button>
                    )}
                    {doc.status === 'submitted' && ['reviewer', 'director', 'specialist'].includes(currentUser.role) && (
                      <>
                        <button className="btn btn-small btn-success" onClick={() => updateDocument(doc.id, 'approved')}>审核通过</button>
                        <button className="btn btn-small btn-danger" onClick={() => {
                          const reason = prompt('请输入补正原因：')
                          if (reason) updateDocument(doc.id, 'rejected', reason)
                        }}>退回补正</button>
                      </>
                    )}
                    {doc.status === 'rejected' && ['manager', 'specialist'].includes(currentUser.role) && (
                      <button className="btn btn-small btn-primary" onClick={() => updateDocument(doc.id, 'submitted')}>重新提交</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'credit' && (
          <div className="credit-section">
          <div className="action-bar">
            {['manager', 'specialist'].includes(currentUser.role) && (
              <button className="btn btn-primary" onClick={createCreditAuth}>+ 发起征信授权</button>
            )}
          </div>
          
          {customer.creditAuths?.length > 0 ? (
            <div className="credit-list">
              {customer.creditAuths.map(auth => {
                let report = null;
                try {
                  report = auth.credit_report ? JSON.parse(auth.credit_report) : null;
                } catch (e) {
                  console.error('征信报告解析失败', e);
                }
                return (
                <div key={auth.id} className="credit-card">
                  <div className="credit-header">
                    <span className={`status-tag ${creditStatusConfig[auth.status]?.class}`}>
                      {creditStatusConfig[auth.status]?.label}
                    </span>
                    <span className="credit-type">主借款人</span>
                  </div>
                  <div className="credit-info">
                    {auth.query_time && <div><label>查询时间：</label>{new Date(auth.query_time).toLocaleString()}</div>}
                    {auth.expire_time && <div><label>有效期至：</label>{new Date(auth.expire_time).toLocaleString()}</div>}
                    {auth.fail_reason && <div className="fail-reason"><label>失败原因：</label>{auth.fail_reason}</div>}
                  </div>
                  {report && (
                    <div className="credit-report">
                      <h4>📊 征信报告摘要</h4>
                      <div className="report-grid">
                        <div className="report-item">
                          <span className="report-label">征信评分</span>
                          <span className="report-value score">{report.score}</span>
                        </div>
                        <div className="report-item">
                          <span className="report-label">信用等级</span>
                          <span className={`report-value level-${report.scoreLevel}`}>{report.scoreLevel}级</span>
                        </div>
                        <div className="report-item">
                          <span className="report-label">逾期记录</span>
                          <span className="report-value">{report.overdueCount}次</span>
                        </div>
                        <div className="report-item">
                          <span className="report-label">现有负债</span>
                          <span className="report-value">{report.totalLoanAmount}</span>
                        </div>
                        <div className="report-item">
                          <span className="report-label">信用卡数</span>
                          <span className="report-value">{report.creditCardCount}张</span>
                        </div>
                        <div className="report-item">
                          <span className="report-label">查询次数</span>
                          <span className="report-value">{report.queryCount}次</span>
                        </div>
                      </div>
                      <div className="report-footer">
                        <div className="risk-tag risk-{report.riskLevel}">{report.riskLevel}</div>
                        <p className="report-suggestion">{report.suggestion}</p>
                        <small className="report-no">报告编号：{report.reportNo}</small>
                      </div>
                    </div>
                  )}
                  {auth.status === 'pending' && ['manager', 'specialist'].includes(currentUser.role) && (
                    <button className="btn btn-small btn-primary" onClick={() => queryCredit(auth.id)}>执行征信查询</button>
                  )}
                  {auth.status === 'failed' && ['manager', 'specialist'].includes(currentUser.role) && (
                    <button className="btn btn-small btn-primary" onClick={() => queryCredit(auth.id)}>重新查询</button>
                  )}
                </div>
              )})}
            </div>
          ) : (
            <div className="empty-state">暂无征信授权记录</div>
          )}
          </div>
        )}

        {activeTab === 'approval' && (
          <div className="approval-section">
            {['reviewer', 'director'].includes(currentUser.role) ? (
              <div className="approval-form-card">
                <h3>📝 提交{currentUser.role === 'reviewer' ? '初审' : '终审'}</h3>
                <form onSubmit={submitApproval} className="approval-form">
                  <div className="form-group">
                    <label>审批节点</label>
                    <select 
                      value={approvalForm.node} 
                      onChange={e => setApprovalForm({...approvalForm, node: e.target.value})}
                      disabled={true}
                    >
                      {currentUser.role === 'reviewer' ? (
                        <option value="review">初审</option>
                      ) : (
                        <option value="final">终审</option>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>审批结果</label>
                    <select value={approvalForm.result} onChange={e => setApprovalForm({...approvalForm, result: e.target.value})}>
                      <option value="approved">通过</option>
                      <option value="rejected">退回</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>审批意见</label>
                    <textarea value={approvalForm.opinion} onChange={e => setApprovalForm({...approvalForm, opinion: e.target.value})} rows={3} />
                  </div>
                  <div className="form-group">
                    <label>风险提示</label>
                    <textarea value={approvalForm.risk_tips} onChange={e => setApprovalForm({...approvalForm, risk_tips: e.target.value})} rows={2} />
                  </div>
                  <div className="form-group">
                    <label>额度建议（元）</label>
                    <input type="number" value={approvalForm.amount_suggestion} onChange={e => setApprovalForm({...approvalForm, amount_suggestion: e.target.value})} />
                  </div>
                  <button type="submit" className="btn btn-primary">提交{currentUser.role === 'reviewer' ? '初审' : '终审'}</button>
                </form>
              </div>
            ) : (
              <div className="approval-form-card">
                <h3>ℹ️ 审批信息</h3>
                <p style={{ color: '#666', margin: '1rem 0' }}>您当前角色为{currentUser.role === 'manager' ? '客户经理' : '资料专员'}，暂无审批权限。您可以查看下方的审批历史记录。</p>
              </div>
            )}

            <h3>📋 审批历史</h3>
            {customer.approvals?.length > 0 ? (
              <div className="approval-list">
                {customer.approvals.map(ap => (
                  <div key={ap.id} className="approval-item">
                    <div className="approval-header">
                    <span className="approval-node">{ap.node === 'review' ? '初审' : '终审'}</span>
                    <span className={`status-tag ${ap.result === 'approved' ? 'status-approved' : 'status-rejected'}`}>
                      {ap.result === 'approved' ? '通过' : '退回'}
                    </span>
                    <span className="approval-version">版本: {ap.version}</span>
                    </div>
                    <div className="approval-content">
                      {ap.opinion && <p><strong>意见：</strong>{ap.opinion}</p>}
                      {ap.risk_tips && <p><strong>风险提示：</strong>{ap.risk_tips}</p>}
                      {ap.amount_suggestion && <p><strong>额度建议：</strong>¥{Number(ap.amount_suggestion).toLocaleString()}</p>}
                    </div>
                    <div className="approval-footer">
                      <span>操作人：{ap.operator_name}</span>
                      <span>{new Date(ap.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">暂无审批记录</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
