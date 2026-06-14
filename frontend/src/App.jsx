import { useEffect, useMemo, useState, useCallback } from 'react'
import './App.css'

const API = '/api'

const identityLabels = { employee: '职工', resident: '居民', institution: '机关事业' }
const statusLabels = { active: '正常', suspended: '暂停', terminated: '终止' }
const businessStatusLabels = {
  registered: '已登记',
  active: '在保',
  suspended: '停保',
  receiving_benefits: '待遇中',
  certification_expiring: '认证到期',
  terminated: '终止'
}
const businessStatusOrder = ['registered', 'active', 'suspended', 'receiving_benefits', 'certification_expiring', 'terminated']
const accountTypeLabels = {
  individual: '个人账户', pooled: '统筹账户', medical: '医疗保险账户',
  unemployment: '失业保险账户', injury: '工伤保险账户', maternity: '生育保险账户',
  pension: '养老保险账户'
}
const recordStatusLabels = {
  pending: '待处理', processing: '处理中', reviewing: '审核中',
  approved: '已通过', completed: '已完成', rejected: '已拒绝', withdrawn: '已撤回'
}
const stepNameLabels = {
  face_verify: '人脸核验', material_check: '材料预检',
  cross_dept_verify: '跨部门比对', review: '审核', approve: '审批'
}
const categoryLabels = {
  registration: '参保登记', benefit: '待遇申领', certification: '资格认证',
  query: '缴费查询', proof: '参保证明'
}
const credTypeLabels = { virtual_card: '电子社保卡', proof_pdf: '参保证明', certification_record: '认证记录' }
const fieldNameLabels = {
  id_card: '身份证号',
  name: '姓名',
  insured_status: '参保状态',
  payment_months: '缴费月数',
  medical_insurance_type: '医保类型',
  tax_payment_status: '纳税状态',
  social_security_base: '社保基数',
  individual_income_tax: '个税申报',
  marital_status: '婚姻状态',
  survival_status: '生存状态',
  social_assistance: '社会救助'
}

const fmt = (v) => Number(v || 0).toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 })

const fetchJson = async (url, opts = {}) => {
  const r = await fetch(`${API}${url}`, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } })
  if (!r.ok) throw new Error(`${url} ${r.status}`)
  return r.json()
}

const parseJson = (v, fallback) => { try { return JSON.parse(v || '[]') } catch (_) { return fallback || [] } }

const toArray = (v) => Array.isArray(v) ? v : []

function App() {
  const [persons, setPersons] = useState([])
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [businessItems, setBusinessItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [serviceRecords, setServiceRecords] = useState([])
  const [paymentRecords, setPaymentRecords] = useState([])
  const [policyRules, setPolicyRules] = useState([])
  const [credentials, setCredentials] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [detailsReady, setDetailsReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [expandedRecord, setExpandedRecord] = useState(null)
  const [recordSteps, setRecordSteps] = useState([])
  const [recordLogs, setRecordLogs] = useState([])

  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifyType, setVerifyType] = useState('')

  const [showFlowModal, setShowFlowModal] = useState(false)
  const [flowRecord, setFlowRecord] = useState(null)
  const [flowSteps, setFlowSteps] = useState([])

  const [selectedCredential, setSelectedCredential] = useState(null)
  const [credentialVerifyResult, setCredentialVerifyResult] = useState(null)
  const [credentialTrace, setCredentialTrace] = useState(null)
  const [downloadingCred, setDownloadingCred] = useState(null)
  const [utilityMode, setUtilityMode] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ username: 'admin', password: 'Admin@123', display_name: '', phone: '' })
  const [authUser, setAuthUser] = useState(null)
  const [authMessage, setAuthMessage] = useState({ type: '', text: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const results = await Promise.allSettled([
        fetchJson('/insured-persons'),
        fetchJson('/business-items'),
        fetchJson('/service-records?limit=50'),
        fetchJson('/summary'),
        fetchJson('/policy-rules')
      ])
      if (cancelled) return
      const ps = results[0].status === 'fulfilled' ? toArray(results[0].value) : []
      const items = results[1].status === 'fulfilled' ? toArray(results[1].value) : []
      const records = results[2].status === 'fulfilled' ? toArray(results[2].value) : []
      const sum = results[3].status === 'fulfilled' ? results[3].value : {}
      const rules = results[4].status === 'fulfilled' ? toArray(results[4].value) : []
      setPersons(ps)
      setBusinessItems(items)
      setServiceRecords(records)
      setSummary(sum)
      setPolicyRules(rules)
      if (ps.length > 0) setSelectedPerson(ps[0])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedPerson) { setAccounts([]); setPaymentRecords([]); setCredentials([]); setDetailsReady(false); return }
    let cancelled = false
    const load = async () => {
      setDetailsReady(false)
      const [aRes, pRes, cRes] = await Promise.allSettled([
        fetchJson(`/insured-persons/${selectedPerson.id}/accounts`),
        fetchJson(`/payment-records?personId=${selectedPerson.id}`),
        fetchJson(`/electronic-credentials?personId=${selectedPerson.id}`)
      ])
      if (cancelled) return
      setAccounts(aRes.status === 'fulfilled' ? toArray(aRes.value) : [])
      setPaymentRecords(pRes.status === 'fulfilled' ? toArray(pRes.value) : [])
      setCredentials(cRes.status === 'fulfilled' ? toArray(cRes.value) : [])
      setDetailsReady(true)
    }
    load()
    return () => { cancelled = true }
  }, [selectedPerson])

  const personRecords = useMemo(() =>
    selectedPerson ? serviceRecords.filter(r => r.insured_person_id === selectedPerson.id) : [],
    [selectedPerson, serviceRecords]
  )

  const totalBalance = useMemo(() =>
    accounts.reduce((s, a) => s + Number(a.balance || 0), 0), [accounts]
  )

  const handleApplyService = async () => {
    if (!selectedPerson || !selectedItem || submitting) return
    setSubmitting(true)
    try {
      await fetchJson('/service-records', {
        method: 'POST',
        body: JSON.stringify({ insured_person_id: selectedPerson.id, business_item_id: selectedItem.id, materials: {} })
      })
      const [recRes] = await Promise.allSettled([fetchJson('/service-records?limit=50')])
      if (recRes.status === 'fulfilled') setServiceRecords(toArray(recRes.value))
      showMessage('success', `${selectedItem.name} 已提交，进入人脸核验步骤`)
    } catch (e) {
      showMessage('error', '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdvanceStep = async (recordId, action = 'pass') => {
    try {
      const body = { action, step_result: action === 'pass' ? '通过' : '不通过' }
      if (action === 'reject') body.detail = '审核不通过'
      const result = await fetchJson(`/service-records/${recordId}/advance-step`, {
        method: 'POST',
        body: JSON.stringify(body)
      })
      const [recRes] = await Promise.allSettled([fetchJson('/service-records?limit=50')])
      if (recRes.status === 'fulfilled') setServiceRecords(toArray(recRes.value))

      if (flowRecord?.id === recordId) {
        setFlowSteps(result.steps || [])
        setFlowRecord(result.record)
      }

      if (result.advanceResult?.status === 'completed') {
        showMessage('success', '业务办理完成！已生成电子凭证。')
        if (selectedPerson) {
          const cRes = await fetchJson(`/electronic-credentials?personId=${selectedPerson.id}`)
          setCredentials(toArray(cRes))
        }
      } else if (result.advanceResult?.status === 'rejected') {
        showMessage('error', '审核未通过，流程已终止。')
      } else {
        const nextStep = (result.steps || []).find(s => s.status === 'pending')
        showMessage('success', `步骤通过，进入: ${stepNameLabels[nextStep?.step_name] || nextStep?.step_name || '下一步'}`)
      }
    } catch (e) {
      showMessage('error', '操作失败')
    }
  }

  const handleWithdraw = async (recordId) => {
    try {
      await fetchJson(`/service-records/${recordId}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ reason: '申请人主动撤回' })
      })
      const [recRes] = await Promise.allSettled([fetchJson('/service-records?limit=50')])
      if (recRes.status === 'fulfilled') setServiceRecords(toArray(recRes.value))
      setShowFlowModal(false)
      showMessage('success', '已撤回申请')
    } catch (e) {
      showMessage('error', '撤回失败')
    }
  }

  const handleVerify = async (type, recordId = null) => {
    if (!selectedPerson) return
    if (type === 'material' && !selectedItem) {
      const defaultItem = businessItems.find(i => i.name === '资格认证' || i.category === 'certification') || businessItems[0]
      if (defaultItem) {
        setSelectedItem(defaultItem)
      } else {
        showMessage('warning', '请先在业务办理区选择事项')
        return
      }
    }
    const currentItem = selectedItem || businessItems.find(i => i.name === '资格认证' || i.category === 'certification') || businessItems[0]
    setVerifyType(type)
    setShowVerifyModal(true)
    setVerifyResult(null)
    const activeRecord = recordId || serviceRecords.find(r =>
      r.insured_person_id === selectedPerson.id &&
      (r.status === 'pending' || r.status === 'processing')
    )?.id
    try {
      let result
      if (type === 'face') {
        result = await fetchJson('/face-verify', {
          method: 'POST',
          body: JSON.stringify({ person_id: selectedPerson.id, service_record_id: activeRecord })
        })
        if (result.verified && result.person_update) {
          const updated = { ...selectedPerson, ...result.person_update }
          setSelectedPerson(updated)
          setPersons(prev => prev.map(p => p.id === selectedPerson.id ? updated : p))
        }
      } else if (type === 'material') {
        result = await fetchJson('/material-check', {
          method: 'POST',
          body: JSON.stringify({
            business_item_id: currentItem?.id,
            materials: parseJson(currentItem?.required_materials, []),
            person_id: selectedPerson.id,
            service_record_id: activeRecord
          })
        })
      } else if (type === 'cross_dept') {
        result = await fetchJson('/cross-dept-verify', {
          method: 'POST',
          body: JSON.stringify({
            person_id: selectedPerson.id,
            verify_types: ['medical', 'tax', 'civil'],
            business_item_id: currentItem?.id,
            service_record_id: activeRecord
          })
        })
      }
      setVerifyResult(result)
      if (result?.record_updated) {
        const recRes = await fetchJson('/service-records?limit=50')
        setServiceRecords(recRes)
      }
    } catch (e) {
      setVerifyResult({ error: true, message: '验证请求失败：' + (e.message || '网络异常') })
    }
  }

  const downloadCredential = async (cred) => {
    setDownloadingCred(cred.id)
    try {
      const data = parseJson(cred.data, {})
      const content = []
      content.push(`=== ${cred.title} ===`)
      content.push(`类型: ${credTypeLabels[cred.type] || cred.type}`)
      content.push(`签发日期: ${cred.issued_at?.slice(0, 10)}`)
      content.push(`有效期至: ${cred.expires_at?.slice(0, 10)}`)
      content.push('')
      if (data.card_no) content.push(`卡号: ${data.card_no}`)
      if (data.proof_no) content.push(`证明编号: ${data.proof_no}`)
      if (data.name) content.push(`姓名: ${data.name}`)
      if (data.id_card) content.push(`身份证号: ${data.id_card}`)
      if (data.content) content.push(`内容: ${data.content}`)
      if (data.payment_months !== undefined) content.push(`累计缴费月数: ${data.payment_months}个月`)
      if (data.payment_amount !== undefined) content.push(`累计缴费金额: ${fmt(data.payment_amount)}`)
      if (data.status) content.push(`状态: ${data.status}`)
      if (data.issuer) content.push(`发卡机构: ${data.issuer}`)
      if (data.issue_unit) content.push(`出具单位: ${data.issue_unit}`)
      content.push('')
      content.push(`数字签名: ${cred.digital_signature}`)
      content.push(`签发时间: ${cred.issued_at}`)
      content.push(`过期时间: ${cred.expires_at}`)
      if (cred.service_record_id) content.push(`关联办理记录: #${cred.service_record_id}`)
      content.push('')
      content.push('=== 本电子凭证通过数字签名，可在线校验真伪 ===')

      const blob = new Blob([content.join('\n')], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${cred.title}_${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showMessage('success', `${cred.title} 已下载`)
    } catch (e) {
      showMessage('error', '下载失败：' + (e.message || '未知错误'))
    } finally {
      setDownloadingCred(null)
    }
  }

  const verifyCredential = async (cred) => {
    try {
      const result = await fetchJson(`/verify-credential/${cred.id}`)
      setCredentialVerifyResult(result)
      setSelectedCredential(cred)
      showMessage(result.valid ? 'success' : 'error', result.message)
    } catch (e) {
      showMessage('error', '校验失败：' + (e.message || '网络异常'))
    }
  }

  const traceCredential = async (cred) => {
    try {
      const result = await fetchJson(`/credential-trace/${cred.id}`)
      setCredentialTrace(result)
      setSelectedCredential(cred)
    } catch (e) {
      showMessage('error', '追溯失败：' + (e.message || '网络异常'))
    }
  }

  const openFlowModal = async (record) => {
    setFlowRecord(record)
    setShowFlowModal(true)
    try {
      const steps = await fetchJson(`/service-records/${record.id}/steps`)
      setFlowSteps(steps)
    } catch (_) {
      setFlowSteps([])
    }
  }

  const toggleRecordExpand = async (record) => {
    if (expandedRecord === record.id) {
      setExpandedRecord(null)
      setRecordSteps([])
      setRecordLogs([])
      return
    }
    setExpandedRecord(record.id)
    try {
      const [steps, logs] = await Promise.allSettled([
        fetchJson(`/service-records/${record.id}/steps`),
        fetchJson(`/audit-logs?entityId=${record.id}&entityType=service_record`)
      ])
      setRecordSteps(steps.status === 'fulfilled' ? toArray(steps.value) : [])
      setRecordLogs(logs.status === 'fulfilled' ? toArray(logs.value) : [])
    } catch (_) {
      setRecordSteps([])
      setRecordLogs([])
    }
  }

  const pageReady = !loading && (!selectedPerson || detailsReady)

  const currentLifecycleIndex = selectedPerson ? businessStatusOrder.indexOf(selectedPerson.business_status) : -1

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(businessItems.map(item => item.category))).filter(Boolean)
  }, [businessItems])

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const includesSearch = useCallback((values) => {
    if (!normalizedSearch) return true
    return values.some(value => String(value || '').toLowerCase().includes(normalizedSearch))
  }, [normalizedSearch])

  const filteredPersons = useMemo(() => persons.filter(person => includesSearch([
    person.name,
    person.id_card_number,
    person.phone,
    identityLabels[person.identity_type],
    businessStatusLabels[person.business_status]
  ])), [persons, includesSearch])

  const filteredBusinessItems = useMemo(() => businessItems.filter(item => {
    const categoryMatched = categoryFilter === 'all' || item.category === categoryFilter
    return categoryMatched && includesSearch([
      item.name,
      item.description,
      categoryLabels[item.category],
      parseJson(item.required_materials).join(' ')
    ])
  }), [businessItems, categoryFilter, includesSearch])

  const filteredPolicyRules = useMemo(() => policyRules.filter(rule => includesSearch([
    rule.rule_name,
    rule.policy_source,
    rule.rule_content,
    parseJson(rule.business_nodes).join(' ')
  ])), [policyRules, includesSearch])

  const pendingRecords = useMemo(() =>
    serviceRecords.filter(r => r.status === 'pending' || r.status === 'processing' || r.status === 'reviewing'),
    [serviceRecords]
  )

  const recordsByStatus = useMemo(() => serviceRecords.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1
    return acc
  }, {}), [serviceRecords])

  const discoverGroups = useMemo(() => categoryOptions.map(category => {
    const items = businessItems.filter(item => item.category === category)
    const matchedPolicies = policyRules.filter(rule => parseJson(rule.business_nodes).some(node =>
      items.some(item => item.name === node || categoryLabels[item.category] === node)
    ))
    return { category, items, policies: matchedPolicies }
  }), [categoryOptions, businessItems, policyRules])

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthMessage({ type: '', text: '' })
    try {
      const body = authMode === 'login'
        ? { username: authForm.username, password: authForm.password }
        : authForm
      const result = await fetchJson(authMode === 'login' ? '/auth/login' : '/auth/register', {
        method: 'POST',
        body: JSON.stringify(body)
      })
      setAuthUser(result.user)
      setAuthMessage({ type: 'success', text: result.message || (authMode === 'login' ? '登录成功' : '注册成功') })
    } catch (e) {
      setAuthMessage({ type: 'error', text: authMode === 'login' ? '登录失败，请检查账号密码' : '注册失败，请更换账号或补全信息' })
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">省级社保公共服务</p>
          <h1>统一数字入口</h1>
        </div>
        <div className="topbar-actions">
          <button className={`top-action ${utilityMode === 'auth' ? 'active' : ''}`} type="button" onClick={() => setUtilityMode('auth')}>
            登录 / 注册
          </button>
          <button className={`top-action ${utilityMode === 'search' ? 'active' : ''}`} type="button" onClick={() => setUtilityMode('search')}>
            搜索
          </button>
          <button className={`top-action ${utilityMode === 'admin' ? 'active' : ''}`} type="button" onClick={() => setUtilityMode('admin')}>
            管理后台
          </button>
          <button className={`top-action ${utilityMode === 'discover' ? 'active' : ''}`} type="button" onClick={() => setUtilityMode('discover')}>
            发现分类
          </button>
          <div className="health-pill">API 在线</div>
        </div>
      </header>

      {utilityMode && (
        <section className="utility-panel">
          <div className="utility-heading">
            <div>
              <p>{utilityMode === 'auth' ? '账号入口' : utilityMode === 'search' ? '检索中心' : utilityMode === 'admin' ? '运营管理' : '服务发现'}</p>
              <h2>{utilityMode === 'auth' ? '登录注册' : utilityMode === 'search' ? '搜索结果' : utilityMode === 'admin' ? '管理后台' : '发现分类'}</h2>
            </div>
            <button type="button" className="utility-close" onClick={() => setUtilityMode('')}>关闭</button>
          </div>

          {utilityMode === 'auth' && (
            <div className="utility-auth">
              <form className="auth-form" onSubmit={handleAuthSubmit}>
                <div className="segmented">
                  <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>登录</button>
                  <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>注册</button>
                </div>
                <label>
                  <span>账号</span>
                  <input value={authForm.username} placeholder="用户名 / 账号" autoComplete="username" onChange={e => setAuthForm({ ...authForm, username: e.target.value })} />
                </label>
                <label>
                  <span>密码</span>
                  <input type="password" value={authForm.password} placeholder="密码" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />
                </label>
                {authMode === 'register' && (
                  <>
                    <label>
                      <span>姓名</span>
                      <input value={authForm.display_name} placeholder="姓名" onChange={e => setAuthForm({ ...authForm, display_name: e.target.value })} />
                    </label>
                    <label>
                      <span>手机号</span>
                      <input value={authForm.phone} placeholder="手机号" onChange={e => setAuthForm({ ...authForm, phone: e.target.value })} />
                    </label>
                  </>
                )}
                <button type="submit" className="primary-button">{authMode === 'login' ? '登录' : '注册'}</button>
                {authMessage.text && <div className={`notice ${authMessage.type}`}>{authMessage.text}</div>}
              </form>
              <div className="auth-summary">
                <h3>{authUser ? authUser.display_name : '演示账号'}</h3>
                {authUser ? (
                  <div className="auth-user">
                    <span>{authUser.username}</span>
                    <strong>{authUser.role === 'admin' ? '管理员' : authUser.role === 'caseworker' ? '经办人员' : '参保用户'}</strong>
                  </div>
                ) : (
                  <>
                    <div className="demo-credential"><span>admin</span><strong>Admin@123</strong></div>
                    <div className="demo-credential"><span>staff</span><strong>Staff@123</strong></div>
                    <div className="demo-credential"><span>user</span><strong>User@123</strong></div>
                  </>
                )}
              </div>
            </div>
          )}

          {utilityMode === 'search' && (
            <div className="utility-search">
              <div className="search-controls">
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="请输入搜索或查询关键词"
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <select aria-label="筛选分类" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  <option value="all">全部分类</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{categoryLabels[category] || category}</option>
                  ))}
                </select>
              </div>
              <div className="search-results">
                <article>
                  <h3>人员查询</h3>
                  {filteredPersons.slice(0, 4).map(person => (
                    <button key={person.id} type="button" className="result-row" onClick={() => setSelectedPerson(person)}>
                      <span>{person.name}</span>
                      <small>{identityLabels[person.identity_type]} · {businessStatusLabels[person.business_status]}</small>
                    </button>
                  ))}
                  {!filteredPersons.length && <div className="empty small-empty">暂无匹配人员</div>}
                </article>
                <article>
                  <h3>事项筛选</h3>
                  {filteredBusinessItems.slice(0, 5).map(item => (
                    <button key={item.id} type="button" className="result-row" onClick={() => setSelectedItem(item)}>
                      <span>{item.name}</span>
                      <small>{categoryLabels[item.category] || item.category}</small>
                    </button>
                  ))}
                  {!filteredBusinessItems.length && <div className="empty small-empty">暂无匹配事项</div>}
                </article>
                <article>
                  <h3>政策匹配</h3>
                  {filteredPolicyRules.slice(0, 4).map(rule => (
                    <div key={rule.id} className="result-row static">
                      <span>{rule.rule_name}</span>
                      <small>{rule.policy_source}</small>
                    </div>
                  ))}
                  {!filteredPolicyRules.length && <div className="empty small-empty">暂无匹配政策</div>}
                </article>
              </div>
            </div>
          )}

          {utilityMode === 'admin' && (
            <div className="admin-dashboard">
              <div className="admin-metrics">
                <div><span>参保人员</span><strong>{summary.insuredPersons || persons.length}</strong></div>
                <div><span>业务事项</span><strong>{summary.businessItems || businessItems.length}</strong></div>
                <div><span>办理记录</span><strong>{summary.serviceRecords || serviceRecords.length}</strong></div>
                <div><span>电子凭证</span><strong>{summary.credentials || credentials.length}</strong></div>
              </div>
              <div className="admin-columns">
                <article>
                  <h3>数据概览</h3>
                  {Object.entries(recordsByStatus).map(([status, count]) => (
                    <div key={status} className="admin-row">
                      <span>{recordStatusLabels[status] || status}</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                  {!Object.keys(recordsByStatus).length && <div className="empty small-empty">暂无状态数据</div>}
                </article>
                <article>
                  <h3>用户管理</h3>
                  <div className="admin-row"><span>管理员</span><strong>admin</strong></div>
                  <div className="admin-row"><span>经办人员</span><strong>staff</strong></div>
                  <div className="admin-row"><span>参保用户</span><strong>user</strong></div>
                </article>
                <article>
                  <h3>运营数据</h3>
                  {pendingRecords.slice(0, 4).map(record => (
                    <div key={record.id} className="admin-row">
                      <span>{record.item_name}</span>
                      <strong>{recordStatusLabels[record.status] || record.status}</strong>
                    </div>
                  ))}
                  {!pendingRecords.length && <div className="empty small-empty">暂无待办</div>}
                </article>
              </div>
            </div>
          )}

          {utilityMode === 'discover' && (
            <div className="discover-grid">
              {discoverGroups.map(group => (
                <article key={group.category} className="discover-card">
                  <span className="category">{categoryLabels[group.category] || group.category}</span>
                  <h3>{categoryLabels[group.category] || group.category}频道</h3>
                  <div className="discover-items">
                    {group.items.map(item => (
                      <button key={item.id} type="button" onClick={() => setSelectedItem(item)}>{item.name}</button>
                    ))}
                  </div>
                  {group.policies.slice(0, 2).map(policy => (
                    <small key={policy.id}>{policy.rule_name}</small>
                  ))}
                </article>
              ))}
              {!discoverGroups.length && <div className="empty">暂无分类频道</div>}
            </div>
          )}
        </section>
      )}

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-title">
            <h2>参保人员</h2>
            <span>{persons.length} 人</span>
          </div>
          <div className="person-list">
            {persons.map(p => (
              <button key={p.id} className={`person-item ${selectedPerson?.id === p.id ? 'active' : ''}`}
                type="button" onClick={() => { setSelectedPerson(p); setSelectedItem(null); setMessage({ type: '', text: '' }) }}>
                <span className="person-name">{p.name}</span>
                <small className="person-meta">
                  {identityLabels[p.identity_type]} · {businessStatusLabels[p.business_status] || p.business_status}
                </small>
                <small className="person-id">{p.id_card_number}</small>
              </button>
            ))}
          </div>

          {selectedPerson && (
            <div className="sidebar-verify">
              <h3>快捷核验</h3>
              <button className="btn-outline" type="button" onClick={() => handleVerify('face')}>人脸核验</button>
              <button className="btn-outline" type="button" onClick={() => handleVerify('material')}>材料预检</button>
              <button className="btn-outline" type="button" onClick={() => handleVerify('cross_dept')}>跨部门比对</button>
            </div>
          )}
        </aside>

        <main className="workspace">
          {loading && <div className="loading">加载中...</div>}
          {message.text && <div className={`notice ${message.type}`}>{message.text}</div>}

          {selectedPerson && pageReady && (
            <>
              <section className="lifecycle-section">
                <h2>参保状态生命周期</h2>
                <div className="lifecycle-track">
                  {businessStatusOrder.map((s, i) => (
                    <div key={s} className={`lifecycle-node ${i <= currentLifecycleIndex ? 'reached' : ''} ${s === selectedPerson.business_status ? 'current' : ''}`}>
                      <div className="node-dot" />
                      <div className="node-label">{businessStatusLabels[s]}</div>
                      {s === selectedPerson.business_status && selectedPerson.certification_expire_date && s === 'certification_expiring' && (
                        <div className="node-expire">到期日: {selectedPerson.certification_expire_date}</div>
                      )}
                    </div>
                  ))}
                </div>
                {selectedPerson.benefit_type && (
                  <div className="benefit-tag">当前待遇: {selectedPerson.benefit_type}</div>
                )}
              </section>

              <section className="section-grid">
                <article className="panel">
                  <div className="section-heading">
                    <h2>个人信息</h2>
                    <span className={`status ${selectedPerson.status}`}>{statusLabels[selectedPerson.status]}</span>
                    <span className={`biz-status ${selectedPerson.business_status}`}>{businessStatusLabels[selectedPerson.business_status]}</span>
                  </div>
                  <dl className="info-list">
                    <div><dt>姓名</dt><dd>{selectedPerson.name}</dd></div>
                    <div><dt>身份证号</dt><dd>{selectedPerson.id_card_number}</dd></div>
                    <div><dt>身份类型</dt><dd>{identityLabels[selectedPerson.identity_type]}</dd></div>
                    <div><dt>业务状态</dt><dd>{businessStatusLabels[selectedPerson.business_status]}</dd></div>
                    <div><dt>联系电话</dt><dd>{selectedPerson.phone || '-'}</dd></div>
                    <div><dt>地址</dt><dd>{selectedPerson.address || '-'}</dd></div>
                    {selectedPerson.certification_expire_date && (
                      <div className="wide"><dt>认证到期日</dt><dd className="expire-warn">{selectedPerson.certification_expire_date}</dd></div>
                    )}
                    {selectedPerson.benefit_type && (
                      <div className="wide"><dt>待遇类型</dt><dd>{selectedPerson.benefit_type}</dd></div>
                    )}
                  </dl>
                </article>

                <article className="panel">
                  <div className="section-heading">
                    <h2>账户概览</h2>
                    <strong className="total-balance">{fmt(totalBalance)}</strong>
                  </div>
                  <div className="account-list">
                    {accounts.map(a => (
                      <div key={a.id} className="account-card">
                        <div className="account-header">
                          <span className="account-type">{accountTypeLabels[a.account_type] || a.account_type}</span>
                          <strong className="account-balance">{fmt(a.balance)}</strong>
                        </div>
                        <div className="account-details">
                          {a.account_type === 'individual' && (
                            <>
                              <span>收入 {fmt(a.personal_in)}</span>
                              <span>支出 {fmt(a.personal_out)}</span>
                            </>
                          )}
                          {a.account_type === 'pooled' && (
                            <>
                              <span>收入 {fmt(a.pooled_in)}</span>
                              <span>支出 {fmt(a.pooled_out)}</span>
                            </>
                          )}
                          <span>缴费 {a.total_contribution_years}年{a.total_contribution_months ? `${a.total_contribution_months}月` : ''}</span>
                          {a.base_amount > 0 && <span>基数 {fmt(a.base_amount)}</span>}
                        </div>
                      </div>
                    ))}
                    {!accounts.length && <div className="empty">暂无账户数据</div>}
                  </div>
                </article>
              </section>

              <section className="panel">
                <div className="section-heading">
                  <h2>业务办理</h2>
                  <span>{businessItems.length} 个事项</span>
                </div>
                <div className="business-grid">
                  {businessItems.map(item => (
                    <article key={item.id} className={`business-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                      onClick={() => setSelectedItem(item)}>
                      <span className="category">{categoryLabels[item.category] || item.category}</span>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <div className="flow-steps-preview">
                        {parseJson(item.flow_steps).map((s, i) => (
                          <span key={i} className="step-tag">{s.label}</span>
                        ))}
                      </div>
                      <div className="materials">材料：{parseJson(item.required_materials).join('、') || '无'}</div>
                      <button type="button" className="select-button"
                        onClick={e => { e.stopPropagation(); setSelectedItem(item) }}>选择</button>
                    </article>
                  ))}
                </div>
                {selectedItem && (
                  <div className="apply-panel">
                    <div>
                      <span>当前事项</span>
                      <strong>{selectedItem.name}</strong>
                      <div className="flow-preview">
                        办理流程：{parseJson(selectedItem.flow_steps).map(s => s.label).join(' → ')}
                      </div>
                    </div>
                    <div className="apply-actions">
                      <button className="btn-outline" type="button" onClick={() => handleVerify('material')}>材料预检</button>
                      <button className="primary-button" type="button" onClick={handleApplyService} disabled={submitting}>
                        {submitting ? '提交中...' : '立即办理'}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="section-grid">
                <article className="panel">
                  <div className="section-heading">
                    <h2>办理记录</h2>
                    <span>{personRecords.length} 条</span>
                  </div>
                  <div className="record-list">
                    {personRecords.slice(0, 8).map(r => (
                      <div key={r.id} className="record-expandable">
                        <div className="record-row" onClick={() => toggleRecordExpand(r)}>
                          <div className="record-main">
                            <strong>{r.item_name}</strong>
                            <span className="record-time">{r.created_at}</span>
                          </div>
                          <div className="record-badges">
                            <span className={`record-status ${r.status}`}>{recordStatusLabels[r.status] || r.status}</span>
                            {r.current_step && <span className="step-badge">{stepNameLabels[r.current_step] || r.current_step}</span>}
                          </div>
                        </div>
                        {expandedRecord === r.id && (
                          <div className="record-detail">
                            <div className="detail-section">
                              <h4>业务概览</h4>
                              <div className="detail-grid">
                                <div className="detail-row">
                                  <span className="detail-label">事项名称</span>
                                  <span className="detail-value">{r.item_name}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">当前步骤</span>
                                  <span className="detail-value highlight">{stepNameLabels[r.current_step] || r.current_step}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">人脸核验</span>
                                  <span className={r.face_verified ? 'pass' : 'pending'}>{r.face_verified ? '✓ 已通过' : '○ 待核验'}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">材料预检</span>
                                  <span className={r.material_checked ? 'pass' : 'pending'}>{r.material_checked ? '✓ 已通过' : '○ 待预检'}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">跨部门比对</span>
                                  <span className={r.cross_dept_checked ? 'pass' : 'pending'}>{r.cross_dept_checked ? '✓ 已通过' : '○ 待比对'}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">提交时间</span>
                                  <span className="detail-value">{r.created_at}</span>
                                </div>
                              </div>
                            </div>

                            {r.cross_dept_result && (
                              <div className="detail-section">
                                <h4>比对结果摘要</h4>
                                <div className="detail-row full">
                                  <span className="detail-label">跨部门比对</span>
                                  <span className="detail-value">{r.cross_dept_result}</span>
                                </div>
                              </div>
                            )}

                            {r.reject_reason && (
                              <div className="detail-section reject">
                                <h4>✗ 审核拒绝</h4>
                                <div className="reject-box">
                                  <div className="reject-header">
                                    <span className="reject-label">拒绝原因:</span>
                                    <span className="reject-content">{r.reject_reason}</span>
                                  </div>
                                  <div className="reject-correction">
                                    <span className="reject-label">补正要求:</span>
                                    <span className="reject-content">请根据上述原因补充相关材料或说明情况后重新提交</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {r.withdraw_reason && (
                              <div className="detail-section withdrawn">
                                <h4>↩ 已撤回</h4>
                                <div className="withdraw-box">
                                  <div className="withdraw-header">
                                    <span className="withdraw-label">撤回原因:</span>
                                    <span className="withdraw-content">{r.withdraw_reason}</span>
                                  </div>
                                  <div className="withdraw-info">
                                    <span className="withdraw-label">撤回时间:</span>
                                    <span className="withdraw-content">{r.updated_at}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {recordSteps.length > 0 && (
                              <div className="detail-section">
                                <h4>审核节点 (流程存证)</h4>
                                <div className="detail-steps">
                                  {recordSteps.map(step => (
                                    <div key={step.id} className={`step-item ${step.status}`}>
                                      <div className="step-main">
                                        <div className="step-number">{step.step_order}</div>
                                        <div className="step-info">
                                          <div className="step-header">
                                            <span className="step-name">{stepNameLabels[step.step_name] || step.step_name}</span>
                                            <span className={`step-status ${step.status}`}>
                                              {step.status === 'completed' ? '✓ 通过' : step.status === 'rejected' ? '✗ 拒绝' : step.status === 'pending' ? '○ 待处理' : '—'}
                                            </span>
                                          </div>
                                          {step.detail && <div className="step-detail-text">详情: {step.detail}</div>}
                                          {step.result && <div className="step-result-text">结果: {step.result}</div>}
                                          <div className="step-meta">
                                            {step.operator && <span>操作人: {step.operator}</span>}
                                            {step.completed_at && <span>完成: {step.completed_at}</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {recordLogs.length > 0 && (
                              <div className="detail-section">
                                <h4>全过程存证 (操作日志)</h4>
                                <div className="detail-logs">
                                  {recordLogs.map(log => {
                                    const logDetail = parseJson(log.detail, {})
                                    return (
                                      <div key={log.id} className="log-item">
                                        <div className="log-header">
                                          <span className="log-action">{log.action}</span>
                                          <span className="log-time">{log.created_at}</span>
                                        </div>
                                        {logDetail && typeof logDetail === 'object' && (
                                          <div className="log-detail-full">
                                            {logDetail.method && <div><span className="log-key">核验方式:</span> {logDetail.method}</div>}
                                            {logDetail.confidence && <div><span className="log-key">置信度:</span> {logDetail.confidence}</div>}
                                            {logDetail.police_match !== undefined && <div><span className="log-key">公安比对:</span> {logDetail.police_match ? '匹配' : '不匹配'}</div>}
                                            {logDetail.all_matched !== undefined && <div><span className="log-key">部门比对:</span> {logDetail.all_matched ? '全部通过' : '存在差异'}</div>}
                                            {logDetail.auto_approve !== undefined && <div><span className="log-key">自动审核:</span> {logDetail.auto_approve ? '通过' : '需人工'}</div>}
                                            {logDetail.old_status && <div><span className="log-key">状态变更:</span> {businessStatusLabels[logDetail.old_status] || logDetail.old_status} → {businessStatusLabels[logDetail.new_status] || logDetail.new_status}</div>}
                                            {logDetail.new_cert_expire && <div><span className="log-key">新有效期:</span> {logDetail.new_cert_expire}</div>}
                                            {logDetail.reason && <div><span className="log-key">原因:</span> {logDetail.reason}</div>}
                                          </div>
                                        )}
                                        {log.operator && <div className="log-op">操作人: {log.operator}</div>}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {credentials.filter(c => c.service_record_id === r.id).length > 0 && (
                              <div className="detail-section">
                                <h4>关联电子凭证</h4>
                                <div className="related-creds">
                                  {credentials.filter(c => c.service_record_id === r.id).map(c => {
                                    const data = parseJson(c.data, {})
                                    return (
                                      <div key={c.id} className="cred-mini">
                                        <div className="cred-mini-header">
                                          <span className={`cred-type ${c.type}`}>{credTypeLabels[c.type] || c.type}</span>
                                          <span className="cred-title">{c.title}</span>
                                        </div>
                                        <div className="cred-mini-body">
                                          {data.card_no && <div><span>卡号</span><span>{data.card_no}</span></div>}
                                          {data.proof_no && <div><span>证明编号</span><span>{data.proof_no}</span></div>}
                                          <div className="cred-mini-footer">
                                            <span className="cred-sig">签名: {c.digital_signature?.slice(0, 12)}...</span>
                                            <span>签发: {c.issued_at?.slice(0, 10)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {(r.status === 'pending' || r.status === 'processing') && (
                              <div className="record-actions">
                                <button className="btn-sm primary" type="button" onClick={() => openFlowModal(r)}>推进流程</button>
                                <button className="btn-sm" type="button" onClick={() => handleVerify('face')}>人脸核验</button>
                                <button className="btn-sm" type="button" onClick={() => setSelectedItem({ id: r.business_item_id, name: r.item_name, required_materials: '[]' })}>材料预检</button>
                                <button className="btn-sm" type="button" onClick={() => handleVerify('cross_dept')}>跨部门比对</button>
                                <button className="btn-sm danger" type="button" onClick={() => handleWithdraw(r.id)}>撤回申请</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {!personRecords.length && <div className="empty">暂无办理记录</div>}
                  </div>
                </article>

                <article className="panel">
                  <div className="section-heading">
                    <h2>缴费记录</h2>
                    <span>{paymentRecords.length} 条</span>
                  </div>
                  <div className="payment-list">
                    {paymentRecords.slice(0, 6).map(pr => (
                      <div key={pr.id} className="payment-row">
                        <span className="pay-month">{pr.payment_month || pr.payment_date}</span>
                        <strong className="pay-amount">{fmt(pr.payment_amount)}</strong>
                        <span className="pay-type">{pr.payment_type}</span>
                        <span className="pay-account">{accountTypeLabels[pr.account_type] || ''}</span>
                      </div>
                    ))}
                    {!paymentRecords.length && <div className="empty">暂无缴费记录</div>}
                  </div>
                </article>
              </section>

              <section className="panel">
                <div className="section-heading">
                  <h2>电子凭证中心</h2>
                  <span>{credentials.length} 个</span>
                </div>
                <div className="credential-grid">
                  {credentials.map(c => {
                    const data = parseJson(c.data, {})
                    const expiresAt = new Date(c.expires_at)
                    const now = new Date()
                    const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
                    const isExpired = daysUntilExpiry <= 0
                    const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30
                    return (
                      <div key={c.id} className={`credential-card ${isExpired ? 'expired' : isExpiringSoon ? 'expiring' : ''}`}>
                        <div className="cred-header">
                          <span className={`cred-type ${c.type}`}>{credTypeLabels[c.type] || c.type}</span>
                          <strong>{c.title}</strong>
                          {isExpired && <span className="cred-expire-badge expired">已过期</span>}
                          {isExpiringSoon && <span className="cred-expire-badge expiring">{daysUntilExpiry}天后过期</span>}
                        </div>
                        <div className="cred-body">
                          {data.card_no && <div><span>卡号</span><span>{data.card_no}</span></div>}
                          {data.proof_no && <div><span>证明编号</span><span>{data.proof_no}</span></div>}
                          {data.name && <div><span>姓名</span><span>{data.name}</span></div>}
                          {data.payment_months !== undefined && <div><span>累计缴费</span><span>{data.payment_months}个月</span></div>}
                          {data.payment_amount !== undefined && <div><span>累计金额</span><span>{fmt(data.payment_amount)}</span></div>}
                          {data.content && <div className="cred-content"><span>内容</span><span>{data.content}</span></div>}
                          {data.status && <div><span>状态</span><span>{data.status}</span></div>}
                          {data.issuer && <div><span>发卡机构</span><span>{data.issuer}</span></div>}
                          {data.issue_unit && <div><span>出具单位</span><span>{data.issue_unit}</span></div>}
                          {c.service_record_id && <div><span>关联记录</span><span className="mono">#{c.service_record_id}</span></div>}
                        </div>
                        <div className="cred-footer">
                          <div className="cred-sig">签名: {c.digital_signature?.slice(0, 16)}...</div>
                          <div className="cred-dates">
                            <span>签发: {c.issued_at?.slice(0, 10)}</span>
                            <span className={isExpired ? 'expired' : isExpiringSoon ? 'expiring' : ''}>
                              过期: {c.expires_at?.slice(0, 10)}
                            </span>
                          </div>
                        </div>
                        <div className="cred-actions">
                          <button className="btn btn-mini" onClick={() => downloadCredential(c)} disabled={downloadingCred === c.id}>
                            {downloadingCred === c.id ? '下载中...' : '⬇ 下载'}
                          </button>
                          <button className="btn btn-mini" onClick={() => verifyCredential(c)}>
                            ✓ 校验
                          </button>
                          <button className="btn btn-mini" onClick={() => traceCredential(c)}>
                            ⟲ 追溯
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {!credentials.length && <div className="empty">暂无电子凭证</div>}
                </div>
              </section>

              <section className="panel">
                <div className="section-heading">
                  <h2>政策规则引擎</h2>
                  <span>{policyRules.length} 条</span>
                </div>
                <div className="policy-grid">
                  {policyRules.map(rule => {
                    const mappedFlows = parseJson(rule.mapped_flows, [])
                    const nodes = parseJson(rule.business_nodes, [])
                    return (
                      <article key={rule.id} className="policy-card">
                        <div className="policy-header">
                          <span className="policy-source">{rule.policy_source}</span>
                          <h3>{rule.rule_name}</h3>
                        </div>
                        <p>{rule.rule_content}</p>
                        <div className="policy-mapping">
                          <h4>映射业务流程</h4>
                          {nodes.map((n, i) => (
                            <span key={i} className="mapped-node">{n}</span>
                          ))}
                        </div>
                        {mappedFlows.map((mf, i) => (
                          <div key={i} className="policy-flow-change">
                            <span className="flow-name">{mf.flow}</span>
                            <span className="flow-change">{mf.change}</span>
                            <span className="flow-detail">{mf.detail}</span>
                          </div>
                        ))}
                        <small>{rule.effective_date} 生效</small>
                      </article>
                    )
                  })}
                  {!policyRules.length && <div className="empty">暂无政策规则</div>}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {showVerifyModal && (
        <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{verifyType === 'face' ? '人脸核验' : verifyType === 'material' ? '材料预检' : '跨部门比对'}</h3>
              <button type="button" onClick={() => setShowVerifyModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {!verifyResult && <div className="loading">核验中...</div>}
              {verifyResult?.error && <div className="notice error">{verifyResult.message}</div>}
              {verifyResult && !verifyResult.error && verifyType === 'face' && (
                <div className="verify-result">
                  <div className={`verify-badge ${verifyResult.verified ? 'pass' : 'fail'}`}>
                    {verifyResult.verified ? '✓ 核验通过' : '✗ 核验未通过'}
                  </div>

                  {verifyResult.failure_reasons && verifyResult.failure_reasons.length > 0 && (
                    <div className="verify-section fail">
                      <h4>失败原因</h4>
                      <div className="failure-list">
                        {verifyResult.failure_reasons.map((fr, i) => (
                          <div key={i} className="failure-item">
                            <div className="failure-code">错误代码: {fr.code}</div>
                            <div className="failure-reason-text">原因: {fr.reason}</div>
                            <div className="failure-suggestion">建议: {fr.suggestion}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {verifyResult.live_face_details && (
                    <div className="verify-section">
                      <h4>活体人脸检测</h4>
                      <div className="verify-details">
                        <div><span>检测方式</span><span>{verifyResult.live_face_details.detection_method}</span></div>
                        <div><span>活体分数</span><span className="highlight">{verifyResult.live_face_details.liveness_score}</span></div>
                        <div><span>眨眼检测</span><span className={verifyResult.live_face_details.blink_detected ? 'pass' : 'fail'}>{verifyResult.live_face_details.blink_detected ? '检测到' : '未检测到'}</span></div>
                        <div><span>嘴部动作</span><span className={verifyResult.live_face_details.mouth_movement_detected ? 'pass' : 'fail'}>{verifyResult.live_face_details.mouth_movement_detected ? '检测到' : '未检测到'}</span></div>
                        <div><span>头部姿态</span><span className={verifyResult.live_face_details.head_pose_detected ? 'pass' : 'fail'}>{verifyResult.live_face_details.head_pose_detected ? '正常' : '异常'}</span></div>
                        <div><span>图像质量</span><span>{verifyResult.live_face_details.quality_score}</span></div>
                        <div><span>光照条件</span><span>{verifyResult.live_face_details.lighting_condition}</span></div>
                        <div><span>人脸角度</span><span>{verifyResult.live_face_details.face_angle}</span></div>
                        <div><span>采集时间</span><span>{verifyResult.live_face_details.capture_time}</span></div>
                      </div>
                    </div>
                  )}

                  {verifyResult.police_match_details && (
                    <div className="verify-section">
                      <h4>公安库比对结论</h4>
                      <div className="verify-details">
                        <div><span>数据源</span><span>{verifyResult.police_match_details.source_db}</span></div>
                        <div><span>查询编号</span><span className="mono">{verifyResult.police_match_details.query_id}</span></div>
                        <div><span>匹配分数</span><span className="highlight">{verifyResult.police_match_details.match_score}</span></div>
                        <div><span>身份证核验</span><span className={verifyResult.police_match_details.id_card_verified ? 'pass' : 'fail'}>{verifyResult.police_match_details.id_card_verified ? '通过' : '未通过'}</span></div>
                        <div><span>照片比对</span><span className={verifyResult.police_match_details.matched ? 'pass' : 'fail'}>{verifyResult.police_match_details.photo_compared}</span></div>
                        {verifyResult.police_match_details.mismatch_reason && <div><span>不匹配原因</span><span className="fail">{verifyResult.police_match_details.mismatch_reason}</span></div>}
                        <div><span>查询机构</span><span>{verifyResult.police_match_details.query_org}</span></div>
                        <div><span>响应耗时</span><span>{verifyResult.police_match_details.response_time}</span></div>
                        <div><span>查询时间</span><span>{verifyResult.police_match_details.query_time}</span></div>
                      </div>
                    </div>
                  )}

                  {verifyResult.silent_verify_records && verifyResult.silent_verify_records.length > 0 && (
                    <div className="verify-section">
                      <h4>{verifyResult.verified ? '静默认证历史记录' : '本次核验记录'}</h4>
                      <div className="silent-records">
                        {verifyResult.silent_verify_records.map((r, i) => (
                          <div key={i} className="silent-record">
                            <div className="silent-record-header">
                              <span className="silent-channel">{r.channel}</span>
                              <span className={`silent-result ${r.result === '通过' ? 'pass' : 'fail'}`}>{r.result}</span>
                            </div>
                            <div className="silent-record-body">
                              <div><span>时间</span><span>{r.verify_time}</span></div>
                              <div><span>地点</span><span>{r.location}</span></div>
                              <div><span>置信度</span><span>{r.confidence}</span></div>
                              {r.failure_reasons && <div><span>失败原因</span><span>{r.failure_reasons.join('; ')}</span></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {verifyResult.person_update && (
                    <div className="verify-section update">
                      <h4>参保人状态已更新</h4>
                      <div className="verify-details">
                        <div><span>原业务状态</span><span className="status-badge">{businessStatusLabels[verifyResult.person_update.old_status] || verifyResult.person_update.old_status}</span></div>
                        <div><span>新业务状态</span><span className="status-badge pass">{businessStatusLabels[verifyResult.person_update.new_status] || verifyResult.person_update.new_status}</span></div>
                        <div><span>认证有效期</span><span className="highlight">至 {verifyResult.person_update.new_cert_expire}</span></div>
                      </div>
                    </div>
                  )}

                  {verifyResult.review_record && (
                    <div className="verify-section warning">
                      <h4>可复查核验记录</h4>
                      <div className="verify-details">
                        <div><span>核验编号</span><span className="mono">{verifyResult.review_record.verify_id}</span></div>
                        <div><span>公安查询号</span><span className="mono">{verifyResult.review_record.query_id}</span></div>
                        <div><span>核验时间</span><span>{verifyResult.review_record.verify_time}</span></div>
                        <div><span>办理渠道</span><span>{verifyResult.review_record.channel}</span></div>
                        <div><span>核验结果</span><span className={verifyResult.review_record.result === '通过' ? 'pass' : 'fail'}>{verifyResult.review_record.result}</span></div>
                        <div><span>置信度</span><span>{verifyResult.review_record.confidence}</span></div>
                        <div><span>复查截止</span><span>{verifyResult.review_record.review_deadline}</span></div>
                        <div><span>剩余重试次数</span><span className={verifyResult.review_record.remaining_attempts > 0 ? 'pass' : ''}>{verifyResult.review_record.remaining_attempts} 次</span></div>
                      </div>
                    </div>
                  )}

                  {verifyResult.review_suggestion && (
                    <div className="verify-section review-basis">
                      <h4>复查建议</h4>
                      <p>{verifyResult.review_suggestion}</p>
                    </div>
                  )}

                  {verifyResult.record_updated && (
                    <div className="verify-section">
                      <div className="verify-details">
                        <div><span>记录同步</span><span className="pass">✓ 办理记录已自动更新</span></div>
                      </div>
                    </div>
                  )}

                  <div className="verify-section">
                    <div className="verify-details">
                      <div><span>综合结果</span><span>{verifyResult.message}</span></div>
                    </div>
                  </div>
                </div>
              )}
              {verifyResult && !verifyResult.error && verifyType === 'material' && (
                <div className="verify-result">
                  <div className={`verify-badge ${verifyResult.passed ? 'pass' : 'fail'}`}>
                    {verifyResult.passed ? '✓ 材料齐全' : verifyResult.need_correction?.length > 0 ? '⚠ 需补正' : '✗ 材料不齐'}
                  </div>

                  {verifyResult.reject_reasons && verifyResult.reject_reasons.length > 0 && (
                    <div className="verify-section fail">
                      <h4>驳回原因</h4>
                      <div className="failure-list">
                        {verifyResult.reject_reasons.map((rr, i) => (
                          <div key={i} className="failure-item">
                            <div className="failure-reason-text">原因: {rr}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {verifyResult.pass_reason && (
                    <div className="verify-section update">
                      <h4>通过原因</h4>
                      <p>{verifyResult.pass_reason}</p>
                    </div>
                  )}

                  <div className="verify-section">
                    <h4>预检上下文</h4>
                    <div className="verify-details">
                      <div><span>当前事项</span><span className="highlight">{verifyResult.item_name}</span></div>
                      <div><span>人员身份</span><span className="highlight">{identityLabels[verifyResult.identity_type] || verifyResult.identity_type}</span></div>
                      <div><span>所在地</span><span className="highlight">{verifyResult.location}</span></div>
                      {verifyResult.current_context && (
                        <>
                          <div><span>当前季节</span><span>{verifyResult.current_context.season}</span></div>
                          <div><span>当前月份</span><span>{verifyResult.current_context.month}月</span></div>
                          <div><span>当前年度</span><span>{verifyResult.current_context.year}年</span></div>
                          {verifyResult.current_context.age && <div><span>人员年龄</span><span>{verifyResult.current_context.age}岁</span></div>}
                        </>
                      )}
                      <div><span>预检时间</span><span>{verifyResult.check_time}</span></div>
                    </div>
                  </div>

                  {verifyResult.submitted_status && (
                    <div className="verify-section">
                      <h4>材料清单</h4>
                      <div className="material-list">
                        {verifyResult.submitted_status.map((s, i) => (
                          <div key={i} className={`material-item ${s.status === '已提交' ? 'pass' : 'fail'}`}>
                            <span className="material-icon">{s.status === '已提交' ? '✓' : '✗'}</span>
                            <span className="material-name">{s.material}</span>
                            <span className="material-meta">{s.source === '时间' ? '时间相关' : s.source === '身份' ? '身份相关' : s.source === '地域' ? '地域相关' : s.source === '事项' ? '事项相关' : '通用材料'}</span>
                            <span className={`material-status ${s.status === '已提交' ? 'pass' : 'fail'}`}>{s.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {verifyResult.missing && verifyResult.missing.length > 0 && (
                    <div className="verify-section fail">
                      <h4>缺少材料 ({verifyResult.missing.length}项)</h4>
                      <div className="missing-list">
                        {verifyResult.missing.map((m, i) => (
                          <div key={i} className="missing-item">
                            <span className="missing-icon">!</span>
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {verifyResult.need_correction && verifyResult.need_correction.length > 0 && (
                    <div className="verify-section warning">
                      <h4>需补正信息 ({verifyResult.need_correction.length}项)</h4>
                      <div className="correction-list">
                        {verifyResult.need_correction.map((c, i) => (
                          <div key={i} className="correction-item">
                            <div className="correction-header">
                              <span className="correction-item-name">{c.item}</span>
                              <span className="correction-issue">{c.issue}</span>
                            </div>
                            <div className="correction-detail">
                              <span className="correction-label">补正方式:</span>
                              <span>{c.correction}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="verify-section">
                    <h4>材料分类说明</h4>
                    <div className="material-categories">
                      <div className="material-category">
                        <h5>通用材料</h5>
                        <div className="category-materials">
                          {verifyResult.required?.filter(m =>
                            !verifyResult.identity_required?.includes(m) &&
                            !verifyResult.location_required?.includes(m) &&
                            !verifyResult.item_required?.includes(m) &&
                            !verifyResult.time_required?.includes(m)
                          ).map((m, i) => <span key={i} className="tag">{m}</span>)}
                        </div>
                      </div>
                      {verifyResult.identity_required?.length > 0 && (
                        <div className="material-category">
                          <h5>身份专属材料 <small>({identityLabels[verifyResult.identity_type] || verifyResult.identity_type})</small></h5>
                          <div className="category-materials">
                            {verifyResult.identity_required.map((m, i) => <span key={i} className="tag identity">{m}</span>)}
                          </div>
                        </div>
                      )}
                      {verifyResult.location_required?.length > 0 && (
                        <div className="material-category">
                          <h5>所在地材料 <small>({verifyResult.location})</small></h5>
                          <div className="category-materials">
                            {verifyResult.location_required.map((m, i) => <span key={i} className="tag location">{m}</span>)}
                          </div>
                        </div>
                      )}
                      {verifyResult.item_required?.length > 0 && (
                        <div className="material-category">
                          <h5>事项专属材料 <small>({verifyResult.item_name})</small></h5>
                          <div className="category-materials">
                            {verifyResult.item_required.map((m, i) => <span key={i} className="tag item">{m}</span>)}
                          </div>
                        </div>
                      )}
                      {verifyResult.time_required?.length > 0 && (
                        <div className="material-category">
                          <h5>时间相关材料 <small>({verifyResult.current_context?.season} {verifyResult.current_context?.year}年)</small></h5>
                          <div className="category-materials">
                            {verifyResult.time_required.map((m, i) => <span key={i} className="tag item">{m}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {verifyResult.record_updated && (
                    <div className="verify-section">
                      <div className="verify-details">
                        <div><span>记录同步</span><span className="pass">✓ 办理记录已自动更新</span></div>
                      </div>
                    </div>
                  )}

                  <div className="verify-section">
                    <div className="verify-details">
                      <div><span>综合结论</span><span>{verifyResult.message}</span></div>
                    </div>
                  </div>
                </div>
              )}
              {verifyResult && !verifyResult.error && verifyType === 'cross_dept' && (
                <div className="verify-result">
                  <div className={`verify-badge ${verifyResult.verified ? 'pass' : 'fail'}`}>
                    {verifyResult.verified ? '✓ 比对通过' : '✗ 存在差异'}
                    {verifyResult.auto_approve && <span className="auto-approve-tag">可自动审核</span>}
                  </div>

                  {verifyResult.review_basis && (
                    <div className="verify-section review-basis">
                      <h4>自动审核依据</h4>
                      <p>{verifyResult.review_basis}</p>
                    </div>
                  )}

                  <div className="verify-section">
                    <h4>各部门比对结果</h4>
                    {Object.entries(verifyResult.results).map(([key, val]) => (
                      <div key={key} className="dept-result">
                        <div className="dept-header">
                          <span className="dept-name">{val.source_dept}</span>
                          <span className={`dept-status ${val.status}`}>
                            {val.status === 'matched' ? '✓ 匹配' : '✗ 不匹配'}
                          </span>
                        </div>
                        <div className="dept-source">
                          <span className="dept-db">数据源: {val.source}</span>
                          <span className="dept-query">查询: {val.query_id}</span>
                        </div>
                        <div className="dept-meta">
                          <span>响应: {val.response_time}</span>
                          <span>时间: {val.query_time}</span>
                        </div>

                        {val.matched_fields && (
                          <div className="dept-fields">
                            <h5>比对字段</h5>
                            <div className="fields-grid">
                              {Object.entries(val.matched_fields).map(([fkey, fval]) => (
                                <div key={fkey} className="field-item">
                                  <span className="field-name">{fieldNameLabels[fkey] || fkey}</span>
                                  <span className={`field-value ${typeof fval === 'boolean' ? (fval ? 'pass' : 'fail') : ''}`}>
                                    {typeof fval === 'boolean' ? (fval ? '一致' : '不一致') : fval}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {val.hit_records && val.hit_records.length > 0 && (
                          <div className="dept-hits">
                            <h5>历史命中记录</h5>
                            <div className="hit-records">
                              {val.hit_records.map((hr, hi) => (
                                <div key={hi} className="hit-record">
                                  <span className="hit-time">{hr.time || hr.period}</span>
                                  <span className="hit-type">{hr.type || hr.employer}</span>
                                  {hr.amount && <span className="hit-amount">¥{hr.amount?.toFixed?.(2) || hr.amount}</span>}
                                  {hr.location && <span className="hit-location">{hr.location}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="dept-detail">
                          <span className="detail-label">结论:</span>
                          <span className={`detail-value ${val.status === 'matched' ? 'pass' : 'fail'}`}>{val.detail}</span>
                        </div>

                        {val.exception_handling && (
                          <div className="dept-exception">
                            <span className="exception-label">异常处置:</span>
                            <span className="exception-value">{val.exception_handling}</span>
                          </div>
                        )}

                        {val.auto_review_basis && (
                          <div className="dept-basis">
                            <span className="basis-label">审核依据:</span>
                            <span className="basis-value">{val.auto_review_basis}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {verifyResult.exception_items && verifyResult.exception_items.length > 0 && (
                    <div className="verify-section exception">
                      <h4>异常事项汇总</h4>
                      <div className="exception-list">
                        {verifyResult.exception_items.map((ex, i) => (
                          <div key={i} className="exception-item">
                            <div className="ex-header">
                              <span className="ex-dept">{ex.dept}</span>
                              <span className="ex-issue">{ex.issue}</span>
                            </div>
                            <div className="ex-handling">
                              <span>处置:</span> {ex.handling}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {verifyResult.record_updated && (
                    <div className="verify-section">
                      <div className="verify-details">
                        <div><span>记录同步</span><span className="pass">✓ 办理记录已自动更新，比对结论已写入</span></div>
                        {verifyResult.service_record_id && <div><span>关联记录ID</span><span className="mono">#{verifyResult.service_record_id}</span></div>}
                      </div>
                    </div>
                  )}

                  <div className="verify-section">
                    <div className="verify-details">
                      <div><span>综合结论</span><span>{verifyResult.message}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showFlowModal && flowRecord && (
        <div className="modal-overlay" onClick={() => setShowFlowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>推进流程 - {flowRecord.item_name}</h3>
              <button type="button" onClick={() => setShowFlowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="flow-steps-full">
                {flowSteps.map(step => (
                  <div key={step.id} className={`flow-step ${step.status}`}>
                    <div className="flow-step-dot" />
                    <div className="flow-step-content">
                      <div className="flow-step-header">
                        <strong>{stepNameLabels[step.step_name] || step.step_name}</strong>
                        <span className={`step-status ${step.status}`}>
                          {step.status === 'completed' ? '✓ 通过' : step.status === 'rejected' ? '✗ 拒绝' : step.status === 'pending' ? '○ 待处理' : '—'}
                        </span>
                      </div>
                      {step.operator && <small>操作人: {step.operator}</small>}
                      {step.detail && <small>详情: {step.detail}</small>}
                      {step.completed_at && <small>完成: {step.completed_at}</small>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flow-actions">
                {(flowRecord.status === 'pending' || flowRecord.status === 'processing') && (
                  <>
                    <button className="btn-sm primary" type="button" onClick={() => handleAdvanceStep(flowRecord.id, 'pass')}>通过当前步骤</button>
                    <button className="btn-sm danger" type="button" onClick={() => handleAdvanceStep(flowRecord.id, 'reject')}>拒绝</button>
                    <button className="btn-sm" type="button" onClick={() => handleWithdraw(flowRecord.id)}>撤回申请</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCredential && (
        <div className="modal-overlay" onClick={() => { setSelectedCredential(null); setCredentialVerifyResult(null); setCredentialTrace(null); }}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>电子凭证详情 - {selectedCredential.title}</h3>
              <button type="button" onClick={() => { setSelectedCredential(null); setCredentialVerifyResult(null); setCredentialTrace(null); }}>✕</button>
            </div>
            <div className="modal-body">
              {credentialVerifyResult && (
                <div className="verify-section">
                  <h4>签名校验结果</h4>
                  <div className="verify-details">
                    <div><span>校验状态</span><span className={credentialVerifyResult.valid ? 'pass' : 'fail'}>
                      {credentialVerifyResult.valid ? '✓ 签名有效' : '✗ 签名无效'}
                    </span></div>
                    <div><span>校验时间</span><span>{credentialVerifyResult.verify_time}</span></div>
                    <div><span>原签名</span><span className="mono small">{credentialVerifyResult.original_signature?.slice(0, 32)}...</span></div>
                    <div><span>重新计算</span><span className="mono small">{credentialVerifyResult.computed_signature?.slice(0, 32)}...</span></div>
                    {credentialVerifyResult.valid && (
                      <div><span>校验结论</span><span className="pass">{credentialVerifyResult.message}</span></div>
                    )}
                    {!credentialVerifyResult.valid && (
                      <div><span>校验结论</span><span className="fail">{credentialVerifyResult.message}</span></div>
                    )}
                  </div>
                </div>
              )}

              {credentialTrace && (
                <div className="verify-section">
                  <h4>全过程存证链路</h4>
                  {credentialTrace.service_record && (
                    <div className="verify-section update">
                      <h5>关联办理记录</h5>
                      <div className="verify-details">
                        <div><span>记录编号</span><span className="mono">#{credentialTrace.service_record.id}</span></div>
                        <div><span>事项名称</span><span>{credentialTrace.service_record.item_name}</span></div>
                        <div><span>当前状态</span><span>{recordStatusLabels[credentialTrace.service_record.status] || credentialTrace.service_record.status}</span></div>
                        <div><span>提交时间</span><span>{credentialTrace.service_record.submitted_at}</span></div>
                        {credentialTrace.service_record.face_verified !== undefined && (
                          <div><span>人脸核验</span><span className={credentialTrace.service_record.face_verified ? 'pass' : 'fail'}>
                            {credentialTrace.service_record.face_verified ? '已通过' : '未通过'}
                          </span></div>
                        )}
                        {credentialTrace.service_record.material_checked !== undefined && (
                          <div><span>材料预检</span><span className={credentialTrace.service_record.material_checked ? 'pass' : 'fail'}>
                            {credentialTrace.service_record.material_checked ? '已通过' : '未通过'}
                          </span></div>
                        )}
                        {credentialTrace.service_record.cross_dept_checked !== undefined && (
                          <div><span>跨部门比对</span><span className={credentialTrace.service_record.cross_dept_checked ? 'pass' : 'fail'}>
                            {credentialTrace.service_record.cross_dept_checked ? '已通过' : '未通过'}
                          </span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {credentialTrace.steps && credentialTrace.steps.length > 0 && (
                    <div className="verify-section">
                      <h5>审核节点流程存证</h5>
                      <div className="steps-timeline">
                        {credentialTrace.steps.map((step, i) => (
                          <div key={step.id} className={`step-timeline-item ${step.status}`}>
                            <div className="step-timeline-dot" />
                            <div className="step-timeline-content">
                              <div className="step-timeline-header">
                                <span className="step-no">节点 {i + 1}</span>
                                <strong>{stepNameLabels[step.step_name] || step.step_name}</strong>
                                <span className={`step-status ${step.status}`}>
                                  {step.status === 'completed' ? '✓ 已完成' : step.status === 'rejected' ? '✗ 已拒绝' : step.status === 'pending' ? '○ 待处理' : '— 进行中'}
                                </span>
                              </div>
                              {step.operator && <div className="step-timeline-meta">操作人: {step.operator}</div>}
                              {step.detail && <div className="step-timeline-meta">详情: {step.detail}</div>}
                              {step.completed_at && <div className="step-timeline-meta">完成时间: {step.completed_at}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {credentialTrace.audit_logs && credentialTrace.audit_logs.length > 0 && (
                    <div className="verify-section">
                      <h5>全过程操作日志 ({credentialTrace.audit_logs.length}条)</h5>
                      <div className="detail-logs">
                        {credentialTrace.audit_logs.map((log, i) => {
                          const details = parseJson(log.details, {})
                          return (
                            <div key={log.id} className="detail-log-item">
                              <div className="log-header">
                                <span className="log-time">{log.created_at}</span>
                                <span className={`log-action ${log.action_type}`}>{log.action}</span>
                                <span className="log-operator">{log.operator}</span>
                              </div>
                              {details.verifyMethod && <div className="log-detail"><span>核验方式:</span> {details.verifyMethod}</div>}
                              {details.confidence && <div className="log-detail"><span>置信度:</span> {details.confidence}%</div>}
                              {details.policeMatch && <div className="log-detail"><span>公安比对:</span> {details.policeMatch}</div>}
                              {details.deptVerify && <div className="log-detail"><span>部门比对:</span> {details.deptVerify}</div>}
                              {details.autoApprove && <div className="log-detail"><span>自动审核:</span> {details.autoApprove}</div>}
                              {details.statusChange && <div className="log-detail"><span>状态变更:</span> {details.statusChange}</div>}
                              {details.newValidity && <div className="log-detail"><span>新有效期:</span> {details.newValidity}</div>}
                              {details.reason && <div className="log-detail"><span>原因:</span> {details.reason}</div>}
                              {log.details && !Object.keys(details).length && <div className="log-detail"><span>详情:</span> {log.details}</div>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {credentialTrace.chain_info && (
                    <div className="verify-section update">
                      <h5>存证信息</h5>
                      <div className="verify-details">
                        <div><span>存证编号</span><span className="mono">{credentialTrace.chain_info.tx_id}</span></div>
                        <div><span>区块高度</span><span>{credentialTrace.chain_info.block_height}</span></div>
                        <div><span>存证时间</span><span>{credentialTrace.chain_info.timestamp}</span></div>
                        <div><span>数据哈希</span><span className="mono small">{credentialTrace.chain_info.data_hash}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!credentialVerifyResult && !credentialTrace && (
                <div className="empty">
                  <p>请选择「校验」或「追溯」操作查看详细信息</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
