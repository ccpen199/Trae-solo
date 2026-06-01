import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadApi, namespacesApi, repositoriesApi } from '../api.js'

export default function Upload() {
  const navigate = useNavigate()
  const [repos, setRepos] = useState<any[]>([])
  const [namespaces, setNamespaces] = useState<any[]>([])
  const [form, setForm] = useState({
    namespace: '',
    artifactName: '',
    version: '',
    uploader: 'admin',
    buildSource: '',
    releaseNotes: '',
    sizeBytes: 0,
    digest: '',
    signature: { verified: true, algorithm: 'SHA256' },
    scanResult: { status: 'passed', critical: 0, high: 0, medium: 0, low: 0, summary: '' },
    dependencies: [] as any[],
    referencedProjects: [] as any[],
  })
  const [validateResult, setValidateResult] = useState<any>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [step, setStep] = useState(1)

  useEffect(() => {
    repositoriesApi.list().then(r => setRepos(r.data)).catch(() => {})
  }, [])

  const handleRepoChange = (repoId: number) => {
    if (repoId) {
      namespacesApi.list(repoId).then(r => setNamespaces(r.data)).catch(() => {})
    } else {
      setNamespaces([])
    }
    setForm({ ...form, namespace: '' })
  }

  const handleValidate = () => {
    setValidateResult(null)
    uploadApi.validate({
      namespace: form.namespace,
      artifactName: form.artifactName,
      version: form.version,
      uploader: form.uploader,
      buildSource: form.buildSource,
      releaseNotes: form.releaseNotes,
      signature: form.signature,
      scanResult: form.scanResult,
    }).then(r => {
      setValidateResult(r.data)
      if (r.data.passed) setStep(2)
    }).catch(e => {
      setValidateResult({ passed: false, errors: [e.response?.data?.error || '校验请求失败'] })
    })
  }

  const handleUpload = () => {
    uploadApi.upload(form).then(r => {
      setUploadResult(r.data)
      setStep(3)
    }).catch(e => {
      alert(e.response?.data?.error || '上传失败')
    })
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">上传校验</h1>
          <p className="page-subtitle">校验版本号、重复发布、签名、扫描结果和发布说明，失败项阻止进入正式仓库</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 8,
            background: step >= s ? (step === s ? '#1e40af' : '#065f46') : '#1e293b',
            border: `1px solid ${step >= s ? '#3b82f6' : '#334155'}`,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background: step >= s ? '#3b82f6' : '#334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12,
            }}>{s}</span>
            {s === 1 && '填写上传信息'}
            {s === 2 && '校验并确认'}
            {s === 3 && '上传完成'}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">仓库</label>
              <select className="form-select" onChange={e => handleRepoChange(Number(e.target.value))}>
                <option value="">选择仓库...</option>
                {repos.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">命名空间 *</label>
              <select className="form-select" value={form.namespace} onChange={e => setForm({ ...form, namespace: e.target.value })}>
                <option value="">选择命名空间...</option>
                {namespaces.map(ns => <option key={ns.id} value={ns.name}>{ns.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">制品名称 *</label>
              <input className="form-input" value={form.artifactName} onChange={e => setForm({ ...form, artifactName: e.target.value })} placeholder="例如 user-service" />
            </div>
            <div className="form-group">
              <label className="form-label">版本号 *</label>
              <input className="form-input" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="例如 1.0.0 或 2.0.0-SNAPSHOT" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">上传者</label>
              <input className="form-input" value={form.uploader} onChange={e => setForm({ ...form, uploader: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">构建来源 *</label>
              <input className="form-input" value={form.buildSource} onChange={e => setForm({ ...form, buildSource: e.target.value })} placeholder="CI 构建号或 Git Commit" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">文件大小 (MB)</label>
              <input className="form-input" type="number" value={form.sizeBytes / 1024 / 1024}
                onChange={e => setForm({ ...form, sizeBytes: Number(e.target.value) * 1024 * 1024 })} />
            </div>
            <div className="form-group">
              <label className="form-label">Digest</label>
              <input className="form-input" value={form.digest} onChange={e => setForm({ ...form, digest: e.target.value })} placeholder="sha256:..." />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">发布说明 *</label>
            <textarea className="form-input" rows={3} value={form.releaseNotes}
              onChange={e => setForm({ ...form, releaseNotes: e.target.value })}
              placeholder="至少5个字符，描述此版本的变更内容" />
          </div>

          <div className="card" style={{ background: '#0f172a', border: '1px solid #334155', padding: 16 }}>
            <div className="card-title">签名与扫描</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">签名校验</label>
                <select className="form-select" value={form.signature.verified ? '1' : '0'}
                  onChange={e => setForm({ ...form, signature: { ...form.signature, verified: e.target.value === '1' } })}>
                  <option value="1">已验证</option>
                  <option value="0">未验证</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">扫描结果</label>
                <select className="form-select" value={form.scanResult.status}
                  onChange={e => setForm({ ...form, scanResult: { ...form.scanResult, status: e.target.value } })}>
                  <option value="passed">通过</option>
                  <option value="warning">警告</option>
                  <option value="failed">失败</option>
                  <option value="not_scanned">未扫描</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">高危漏洞</label>
                <input className="form-input" type="number" value={form.scanResult.critical}
                  onChange={e => setForm({ ...form, scanResult: { ...form.scanResult, critical: Number(e.target.value) } })} />
              </div>
              <div className="form-group">
                <label className="form-label">中危漏洞</label>
                <input className="form-input" type="number" value={form.scanResult.medium}
                  onChange={e => setForm({ ...form, scanResult: { ...form.scanResult, medium: Number(e.target.value) } })} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleValidate}>下一步：校验 →</button>
          </div>
        </div>
      )}

      {step === 2 && validateResult && (
        <div className="card">
          <div className="card-title">校验结果</div>
          {validateResult.passed ? (
            <>
              <div className="alert-box alert-success">✓ 所有校验项已通过，可以提交上传</div>
              {validateResult.warnings?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {validateResult.warnings.map((w: string, i: number) => (
                    <div key={i} className="alert-box alert-warning">⚠ {w}</div>
                  ))}
                </div>
              )}
              <table>
                <tbody>
                  <tr><td style={{ width: 140, color: '#94a3b8' }}>命名空间</td><td><span className="code">{form.namespace}</span></td></tr>
                  <tr><td style={{ color: '#94a3b8' }}>制品</td><td style={{ fontWeight: 600 }}>{form.artifactName}</td></tr>
                  <tr><td style={{ color: '#94a3b8' }}>版本</td><td><span className="code">{form.version}</span></td></tr>
                  <tr><td style={{ color: '#94a3b8' }}>上传者</td><td>{form.uploader}</td></tr>
                  <tr><td style={{ color: '#94a3b8' }}>构建来源</td><td>{form.buildSource}</td></tr>
                  <tr><td style={{ color: '#94a3b8' }}>大小</td><td>{(form.sizeBytes / 1024 / 1024).toFixed(2)} MB</td></tr>
                  <tr><td style={{ color: '#94a3b8' }}>发布说明</td><td style={{ fontSize: 12 }}>{form.releaseNotes}</td></tr>
                </tbody>
              </table>
            </>
          ) : (
            <>
              <div className="alert-box alert-error">✗ 校验未通过，阻止进入正式仓库</div>
              <ul style={{ paddingLeft: 24, marginTop: 12, color: '#fca5a5', fontSize: 13 }}>
                {validateResult.errors?.map((e: string, i: number) => (
                  <li key={i} style={{ marginBottom: 6 }}>• {e}</li>
                ))}
              </ul>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← 返回修改</button>
            {validateResult.passed && (
              <button className="btn btn-primary" onClick={handleUpload}>确认上传</button>
            )}
          </div>
        </div>
      )}

      {step === 3 && uploadResult && (
        <div className="card">
          <div className="alert-box alert-success">✓ 上传成功！</div>
          <table>
            <tbody>
              <tr><td style={{ width: 140, color: '#94a3b8' }}>版本 ID</td><td>{uploadResult.id}</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>制品 ID</td><td>{uploadResult.artifactId}</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>状态</td><td><span className="badge badge-pending">{uploadResult.status}</span></td></tr>
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => {
              setStep(1)
              setValidateResult(null)
              setUploadResult(null)
              setForm({ ...form, artifactName: '', version: '', releaseNotes: '' })
            }}>继续上传</button>
            <button className="btn btn-primary" onClick={() => navigate(`/versions/${uploadResult.id}`)}>查看版本详情 →</button>
          </div>
        </div>
      )}
    </div>
  )
}