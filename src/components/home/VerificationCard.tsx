import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ShieldAlert, FileCheck, ChevronDown, ChevronUp, Clock, CheckCircle, Upload, XCircle, AlertCircle, FileUp, Send, RotateCcw } from 'lucide-react'
import { useStore, type User } from '@/store'

const verificationId = `VL-20260610-001`

const roleDocMap: Record<User['role'], { name: string; optional?: boolean }[]> = {
  buyer: [
    { name: '营业执照' },
    { name: '法人身份证明' },
    { name: '行业资质（进出口经营许可证/品牌授权书）' },
  ],
  factory: [
    { name: '营业执照' },
    { name: '工厂执照（生产许可证/环保审批）' },
    { name: '安全生产合格证' },
    { name: '员工社保人数证明' },
  ],
  supplier: [
    { name: '营业执照' },
    { name: '法人身份证明' },
    { name: '行业资质（ISO/检测报告）' },
  ],
  designer: [
    { name: '营业执照', optional: true },
    { name: '设计师作品集链接' },
    { name: '获奖证书/合作品牌证明' },
  ],
  admin: [
    { name: '营业执照' },
    { name: '管理员授权书' },
  ],
}

const roleLabels: Record<User['role'], string> = {
  buyer: '采购商',
  factory: '加工厂',
  supplier: '辅料商',
  designer: '设计师',
  admin: '管理员',
}

const rejectedItems = ['营业执照扫描件不清晰', '行业资质证书已过期']

export default function VerificationCard() {
  const currentUser = useStore((s) => s.currentUser)
  const submitReVerification = useStore((s) => s.submitReVerification)
  const [expanded, setExpanded] = useState(false)
  const [showReverifyForm, setShowReverifyForm] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState('')
  const [remark, setRemark] = useState('')
  const [uploaded, setUploaded] = useState(false)
  const navigate = useNavigate()

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert size={20} className="text-amber-500" />
          <h2 className="font-serif text-lg font-semibold text-navy-700">身份认证</h2>
        </div>
        <p className="text-sm text-navy-400">登录后查看认证状态</p>
      </div>
    )
  }

  if (!currentUser.verified) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert size={20} className="text-amber-500" />
          <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">资质未认证</span>
        </div>
        <p className="text-sm text-navy-400 mb-4">完成行业资质核验后可使用完整平台功能</p>
        <button
          onClick={() => navigate('/register')}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <Upload size={16} />
          立即认证
        </button>
      </div>
    )
  }

  const docs = roleDocMap[currentUser.role] || []
  const reviews = currentUser.verificationReviews || []
  const firstReviews = reviews.filter((r) => r.reviewType === 'first')
  const recheckReviews = reviews.filter((r) => r.reviewType === 'recheck')
  const latestReview = reviews.length > 0 ? reviews[reviews.length - 1] : null
  const isLatestRejected = latestReview?.result === 'rejected'
  const reCount = currentUser.reVerificationCount || 0

  const handleSubmitReverify = () => {
    if (!selectedDoc) return
    submitReVerification({
      docName: selectedDoc,
      docUrl: uploaded ? `${selectedDoc}_${Date.now()}.pdf` : '',
      remark,
    })
    setShowReverifyForm(false)
    setSelectedDoc('')
    setRemark('')
    setUploaded(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={20} className="text-emerald-500" />
        <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">已认证</span>
        <span className="text-xs font-medium text-navy-400 bg-navy-50 px-2 py-0.5 rounded ml-auto">{roleLabels[currentUser.role]}</span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-navy-400">认证类型</span>
          <span className="text-navy-700 font-medium">{currentUser.qualificationType || '营业执照'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-navy-400">认证时间</span>
          <span className="text-navy-700">2026-05-22</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-navy-400">认证编号</span>
          <span className="text-navy-700 font-mono text-xs">{verificationId}</span>
        </div>
        {reCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-navy-400">复查次数</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              <RotateCcw size={10} />
              第{reCount}次复查
            </span>
          </div>
        )}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 text-sm text-teal-600 hover:text-teal-700 transition-colors mb-3"
      >
        {expanded ? '收起详情' : '查看认证详情'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="border-t border-navy-100 pt-4 mb-3 animate-fade-in space-y-5">
          <div>
            <h3 className="text-sm font-medium text-navy-700 mb-2 flex items-center gap-1.5">
              <FileCheck size={14} className="text-teal-500" />
              认证材料清单
            </h3>
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.name} className="flex items-center justify-between text-sm bg-surface rounded-lg px-3 py-2">
                  <span className="flex items-center gap-2 text-navy-600">
                    <FileCheck size={14} className="text-navy-400" />
                    {doc.name}
                    {doc.optional && <span className="text-[10px] text-navy-400">(选填)</span>}
                  </span>
                  <span className="text-emerald-600 text-xs flex items-center gap-1">
                    <CheckCircle size={12} />
                    已审核通过
                  </span>
                </div>
              ))}
            </div>
          </div>

          {isLatestRejected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">需要重新提交材料</p>
                  <p className="text-xs text-red-600 mb-2">最新审核驳回，请修正以下问题：</p>
                  <ul className="space-y-1">
                    {rejectedItems.map((item, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-center gap-1">
                        <XCircle size={10} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-navy-700 mb-2 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                初次审核
              </h3>
              <div className="space-y-0 pl-1">
                {firstReviews.length === 0 ? (
                  <p className="text-xs text-navy-400">暂无记录</p>
                ) : (
                  firstReviews.map((item, i) => (
                    <div key={`first-${i}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${
                          item.result === 'approved' ? 'bg-emerald-500' :
                          item.result === 'rejected' ? 'bg-red-500' : 'bg-amber-400'
                        }`} />
                        {i < firstReviews.length - 1 && <div className="w-px h-10 bg-navy-200" />}
                      </div>
                      <div className="pb-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-navy-700">{item.reviewer}</p>
                          <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${
                            item.result === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                            item.result === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {item.result === 'approved' ? <CheckCircle size={8} /> :
                             item.result === 'rejected' ? <XCircle size={8} /> : <Clock size={8} />}
                            {item.result === 'approved' ? '通过' : item.result === 'rejected' ? '驳回' : '审核中'}
                          </span>
                        </div>
                        <p className="text-xs text-navy-500 mt-0.5">{item.comment}</p>
                        <p className="text-xs text-navy-400 flex items-center gap-1 mt-1">
                          <Clock size={10} />
                          {item.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {recheckReviews.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-navy-700 mb-2 flex items-center gap-1.5">
                  <RotateCcw size={14} className="text-amber-500" />
                  复查记录
                  {reCount > 0 && (
                    <span className="text-[10px] font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      共{reCount}次
                    </span>
                  )}
                </h3>
                <div className="space-y-0 pl-1">
                  {recheckReviews.map((item, i) => (
                    <div key={`recheck-${i}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${
                          item.result === 'approved' ? 'bg-emerald-500' :
                          item.result === 'rejected' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'
                        }`} />
                        {i < recheckReviews.length - 1 && <div className="w-px h-10 bg-navy-200" />}
                      </div>
                      <div className="pb-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-navy-700">{item.reviewer}</p>
                          <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${
                            item.result === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                            item.result === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {item.result === 'approved' ? <CheckCircle size={8} /> :
                             item.result === 'rejected' ? <XCircle size={8} /> : <Clock size={8} />}
                            {item.result === 'approved' ? '通过' : item.result === 'rejected' ? '驳回' : '审核中'}
                          </span>
                          {i === recheckReviews.length - 1 && reCount > 0 && (
                            <span className="text-[10px] text-navy-400 bg-navy-50 px-1.5 py-0.5 rounded">
                              第{i + 1}次复查
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-navy-500 mt-0.5">{item.comment}</p>
                        <p className="text-xs text-navy-400 flex items-center gap-1 mt-1">
                          <Clock size={10} />
                          {item.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showReverifyForm && (
            <div className="bg-surface rounded-lg p-4 space-y-3 border border-navy-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-navy-700 flex items-center gap-1.5">
                  <FileUp size={14} className="text-amber-500" />
                  重新上传材料
                </h4>
                <button
                  onClick={() => {
                    setShowReverifyForm(false)
                    setSelectedDoc('')
                    setRemark('')
                    setUploaded(false)
                  }}
                  className="text-navy-400 hover:text-navy-600"
                >
                  <XCircle size={14} />
                </button>
              </div>
              <div>
                <label className="block text-xs text-navy-500 mb-1">选择材料名称</label>
                <select
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="">请选择需要重新提交的材料</option>
                  {docs.map((doc) => (
                    <option key={doc.name} value={doc.name}>{doc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-navy-500 mb-1">上传文件</label>
                <button
                  onClick={() => setUploaded(true)}
                  className={`w-full px-3 py-3 text-sm border-2 border-dashed rounded-md transition-colors flex items-center justify-center gap-2 ${
                    uploaded
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                      : 'border-navy-200 hover:border-amber-400 hover:bg-amber-50 text-navy-500'
                  }`}
                >
                  {uploaded ? (
                    <>
                      <CheckCircle size={14} />
                      {selectedDoc || '文件'}_模拟上传.pdf
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      点击选择文件（模拟）
                    </>
                  )}
                </button>
              </div>
              <div>
                <label className="block text-xs text-navy-500 mb-1">补充说明</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  placeholder="请填写补充说明或修正内容..."
                  className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowReverifyForm(false)
                    setSelectedDoc('')
                    setRemark('')
                    setUploaded(false)
                  }}
                  className="flex-1 py-2 text-sm border border-navy-200 text-navy-500 rounded-md hover:bg-navy-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitReverify}
                  disabled={!selectedDoc}
                  className="flex-1 py-2 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Send size={14} />
                  提交复查
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setShowReverifyForm((prev) => !prev)}
        className="w-full flex items-center justify-center gap-2 bg-navy-50 hover:bg-navy-100 text-navy-600 text-sm font-medium py-2 rounded-lg transition-colors"
      >
        <RotateCcw size={16} />
        重新验证
      </button>
    </div>
  )
}
