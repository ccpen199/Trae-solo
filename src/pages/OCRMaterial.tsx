import { useState } from 'react'

const recentRecords = [
  { id: 1, fileName: '身份证正面.jpg', time: '2026-06-10 09:15', status: '识别完成', confidence: 98.7 },
  { id: 2, fileName: '学历证书.pdf', time: '2026-06-09 16:30', status: '识别完成', confidence: 95.2 },
  { id: 3, fileName: '收入证明.jpg', time: '2026-06-08 14:20', status: '识别中', confidence: 0 },
  { id: 4, fileName: '劳动合同.pdf', time: '2026-06-07 10:45', status: '识别完成', confidence: 96.8 },
  { id: 5, fileName: '社保证明.jpg', time: '2026-06-06 15:12', status: '识别失败', confidence: 0 },
]

const ocrFields = [
  { name: '姓名', value: '张三', confidence: 99.2, reviewed: true, reviewType: '已复核' },
  { name: '身份证号', value: '500112199005151234', confidence: 99.5, reviewed: true, reviewType: '已复核' },
  { name: '性别', value: '男', confidence: 99.8, reviewed: true, reviewType: '系统自动确认' },
  { name: '民族', value: '汉', confidence: 99.6, reviewed: true, reviewType: '系统自动确认' },
  { name: '出生日期', value: '1990-05-15', confidence: 99.3, reviewed: true, reviewType: '已复核' },
  { name: '住址', value: '重庆市渝北区XX街道XX号', confidence: 96.8, reviewed: true, reviewType: '已复核' },
  { name: '签发机关', value: '重庆市公安局渝北区分局', confidence: 97.2, reviewed: true, reviewType: '已复核' },
  { name: '有效期', value: '2020.05.15-2040.05.15', confidence: 98.1, reviewed: true, reviewType: '已复核' },
]

const materialCategories = ['全部', '身份证明', '学历证明', '工作证明', '收入证明', '其他']

const materials = [
  { id: 1, name: '居民身份证', thumbnail: '🪪', uploadTime: '2026-06-10', source: 'OCR识别', validity: '长期有效', status: '正常', reuseCount: 12, category: '身份证明' },
  { id: 2, name: '户口簿', thumbnail: '📋', uploadTime: '2026-06-08', source: 'OCR识别', validity: '长期有效', status: '正常', reuseCount: 8, category: '身份证明' },
  { id: 3, name: '学历学位证书', thumbnail: '🎓', uploadTime: '2026-05-20', source: 'OCR识别', validity: '长期有效', status: '正常', reuseCount: 5, category: '学历证明' },
  { id: 4, name: '学历认证报告', thumbnail: '📜', uploadTime: '2026-05-15', source: '系统自动获取', validity: '2027-06到期', status: '即将过期', reuseCount: 3, category: '学历证明' },
  { id: 5, name: '工作证明', thumbnail: '💼', uploadTime: '2026-04-10', source: '手动上传', validity: '2027-04到期', status: '正常', reuseCount: 6, category: '工作证明' },
  { id: 6, name: '收入证明', thumbnail: '💰', uploadTime: '2026-03-15', source: 'OCR识别', validity: '2027-03到期', status: '正常', reuseCount: 4, category: '收入证明' },
  { id: 7, name: '社保缴费证明', thumbnail: '📊', uploadTime: '2026-02-20', source: '系统自动获取', validity: '2026-08到期', status: '即将过期', reuseCount: 7, category: '收入证明' },
  { id: 8, name: '居住证', thumbnail: '🏠', uploadTime: '2025-12-01', source: 'OCR识别', validity: '2026-12到期', status: '正常', reuseCount: 2, category: '身份证明' },
  { id: 9, name: '离职证明', thumbnail: '📄', uploadTime: '2025-06-10', source: '手动上传', validity: '2026-06到期', status: '已过期', reuseCount: 1, category: '工作证明' },
]

const reuseRecords = [
  { id: 1, material: '居民身份证', target: '失业金申领', time: '2026-06-08 10:30', status: '成功', verifyType: '自动核验' },
  { id: 2, material: '学历学位证书', target: '职称申报', time: '2026-06-05 14:20', status: '成功', verifyType: '自动核验' },
  { id: 3, material: '社保缴费证明', target: '人才认定', time: '2026-06-02 09:15', status: '成功', verifyType: '人工核验' },
  { id: 4, material: '收入证明', target: '公积金贷款', time: '2026-05-28 16:45', status: '成功', verifyType: '自动核验' },
  { id: 5, material: '工作证明', target: '居住证办理', time: '2026-05-20 11:00', status: '成功', verifyType: '自动核验' },
  { id: 6, material: '学历学位证书', target: '人才认定', time: '2026-05-18 13:30', status: '失败', verifyType: '自动核验' },
  { id: 7, material: '居民身份证', target: '社保参保登记', time: '2026-05-10 10:00', status: '成功', verifyType: '自动核验' },
  { id: 8, material: '户口簿', target: '子女入学', time: '2026-04-25 09:30', status: '成功', verifyType: '人工核验' },
  { id: 9, material: '收入证明', target: '公积金贷款', time: '2026-04-22 15:00', status: '失败', verifyType: '自动核验' },
  { id: 10, material: '居住证', target: '机动车上牌', time: '2026-04-15 14:00', status: '待确认', verifyType: '人工核验' },
]

const failureFeedbacks = [
  {
    id: 1,
    material: '学历学位证书',
    target: '人才认定',
    time: '2026-05-18',
    reason: '材料清晰度不足，关键字段置信度低于阈值',
    suggestion: '请重新扫描上传',
    status: '已重新上传并识别成功',
    statusType: 'success' as const,
  },
  {
    id: 2,
    material: '收入证明',
    target: '公积金贷款',
    time: '2026-04-22',
    reason: '材料已过期（有效期一年）',
    suggestion: '请提供最新收入证明',
    status: '待重新提交',
    statusType: 'pending' as const,
  },
]

function getConfidenceColor(confidence: number) {
  if (confidence >= 95) return 'bg-emerald-500'
  if (confidence >= 80) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getConfidenceTextColor(confidence: number) {
  if (confidence >= 95) return 'text-emerald-600'
  if (confidence >= 80) return 'text-yellow-600'
  return 'text-red-600'
}

function StatusBadge({ status, type = 'default' }: { status: string; type?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const colorMap: Record<string, string> = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-cyan-100 text-cyan-700',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorMap[type]}`}>
      {status}
    </span>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${getConfidenceColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${getConfidenceTextColor(value)}`}>
        {value}%
      </span>
    </div>
  )
}

function TabRecognition() {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-cyan-100 rounded-lg flex items-center justify-center text-base">📤</span>
            材料上传
          </h2>

          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
              isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 bg-gray-50'
            } px-6 py-10 cursor-pointer`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false) }}
          >
            <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 7.5m0 0L7.5 12M12 7.5v9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">拖拽文件到此处上传</p>
            <p className="text-xs text-gray-400 mb-4">或点击下方按钮选择文件</p>
            <button className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors">
              选择文件
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>支持格式：PDF / JPG / PNG</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>单个文件 ≤ 10MB</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-cyan-100 rounded-lg flex items-center justify-center text-base">📋</span>
            近期识别记录
          </h2>
          <div className="space-y-3">
            {recentRecords.map((record) => (
              <div
              key={record.id}
              className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:bg-cyan-50 hover:border-cyan-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate flex-1">{record.fileName}</span>
                {record.status === '识别完成' && <StatusBadge status={record.status} type="success" />}
                {record.status === '识别中' && <StatusBadge status={record.status} type="info" />}
                {record.status === '识别失败' && <StatusBadge status={record.status} type="danger" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{record.time}</span>
                {record.confidence > 0 && <ConfidenceBar value={record.confidence} />}
              </div>
            </div>
            ))}
          </div>
        </section>
      </div>

      <div className="lg:col-span-3 space-y-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-cyan-100 rounded-lg flex items-center justify-center text-base">🔍</span>
            识别详情
          </h2>

          <div className="flex items-start gap-4 mb-5 pb-5 border-b border-gray-100">
            <div className="w-24 h-32 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border border-cyan-100 flex items-center justify-center flex-shrink-0">
              <span className="text-4xl">🪪</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-800 mb-2">身份证正面.jpg</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-gray-400 w-16">文件大小</span>
                  <span>2.4 MB</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-gray-400 w-16">页数</span>
                  <span>1 页</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-gray-400 w-16">上传时间</span>
                  <span>2026-06-10 09:15</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">识别状态</p>
              <p className="text-sm font-bold text-emerald-600">识别完成 ✓</p>
            </div>
            <div className="bg-cyan-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">总体置信度</p>
              <p className="text-sm font-bold text-cyan-600">98.7%</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">识别耗时</p>
              <p className="text-sm font-bold text-teal-600">1.2秒</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">识别引擎</p>
              <p className="text-xs font-bold text-gray-600">百度OCR v3.0</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">字段级识别结果</h3>
          <div className="overflow-hidden rounded-xl border border-gray-200 mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">字段名</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">识别值</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">置信度</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">复核状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ocrFields.map((field) => (
                  <tr key={field.name} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-medium text-gray-700 text-xs">{field.name}</td>
                    <td className="px-4 py-2.5 text-gray-800 text-sm">{field.value}</td>
                    <td className="px-4 py-2.5"><ConfidenceBar value={field.confidence} /></td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                        </svg>
                        {field.reviewType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200 mb-5">
            <h3 className="text-sm font-semibold text-cyan-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              人工复核
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-cyan-600/70">复核状态：</span>
                <span className="text-cyan-800 font-medium">已通过</span>
              </div>
              <div>
                <span className="text-cyan-600/70">复核人：</span>
                <span className="text-cyan-800">系统自动核验（公安户籍库比对一致）</span>
              </div>
              <div>
                <span className="text-cyan-600/70">复核时间：</span>
                <span className="text-cyan-800">2026-06-08 14:33</span>
              </div>
              <div>
                <span className="text-cyan-600/70">复核说明：</span>
                <span className="text-cyan-800">与公安户籍系统数据一致，自动确认</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001c0 3.98.5 5.753.5 0 3.98-2.247 4.064-4.992 4.064m-1.02-8.064h-3.98m0 0 3.98 1.98m0-1.98v3.96m-8.064-2.024H6.976 2v.001c0 3.98 2.247 4.064 4.992 4.064m1.02-8.064h3.98m0 0-3.98 1.98m0 0v3.96" />
              </svg>
              重新识别
            </button>
            <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.5 17.25l-4.5.75.75-4.5 7.612-7.613Z" />
              </svg>
              人工修正
            </button>
            <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12 2.12a3.75 3.75 0 0 0-.867 1.816l-1.535 7.102a.9.9 0 0 0 1.013 1.013l7.102-1.535a3.75 3.75 0 0 0 1.816-.867l2.12-2.12a2.25 2.25 0 0 0-1.095-3.795 48.134 48.134 0 0 0-7.542-1.734 2.25 2.25 0 0 0-1.908.951Z" />
              </svg>
              加入材料库
            </button>
            <button className="px-4 py-2 border border-cyan-200 text-cyan-600 rounded-lg text-sm font-medium hover:bg-cyan-50 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 7.5m0 0L7.5 12M12 7.5v9" />
              </svg>
              下载识别结果
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">数据核验比对</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-500">✓</span>
                  <span className="text-xs font-medium text-emerald-700">一致</span>
                </div>
                <p className="text-xs text-gray-500">公安户籍系统</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-500">✓</span>
                  <span className="text-xs font-medium text-emerald-700">一致</span>
                </div>
                <p className="text-xs text-gray-500">社保核心库</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-500">✓</span>
                  <span className="text-xs font-medium text-emerald-700">一致</span>
                </div>
                <p className="text-xs text-gray-500">公积金中心</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function TabMaterialLibrary() {
  const [activeCategory, setActiveCategory] = useState('全部')

  const filteredMaterials = activeCategory === '全部'
    ? materials
    : materials.filter((m) => m.category === activeCategory)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '正常':
        return <StatusBadge status={status} type="success" />
      case '即将过期':
        return <StatusBadge status={status} type="warning" />
      case '已过期':
        return <StatusBadge status={status} type="danger" />
      default:
        return <StatusBadge status={status} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">累计材料数</p>
              <p className="text-3xl font-bold mt-1">28份</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">本月新增</p>
              <p className="text-3xl font-bold mt-1 text-cyan-600">5份</p>
            </div>
            <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">可复用材料</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600">22份</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">复用次数</p>
              <p className="text-3xl font-bold mt-1 text-teal-600">76次</p>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-7 h-7 bg-cyan-100 rounded-lg flex items-center justify-center text-base">📚</span>
            材料库
          </h2>
          <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            上传材料
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {materialCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-gray-50 rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-14 h-18 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg border border-cyan-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{material.thumbnail}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1 truncate">{material.name}</h3>
                  {getStatusBadge(material.status)}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">上传时间</span>
                  <span>{material.uploadTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">来源</span>
                  <span>{material.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">有效期</span>
                  <span>{material.validity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">已复用</span>
                  <span className="text-cyan-600 font-medium">{material.reuseCount} 次</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button className="flex-1 py-1.5 text-xs text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors font-medium">
                  查看
                </button>
                <button className="flex-1 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium">
                  复用
                </button>
                <button className="flex-1 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function TabReuseRecords() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '成功':
        return <StatusBadge status={status} type="success" />
      case '失败':
        return <StatusBadge status={status} type="danger" />
      case '待确认':
        return <StatusBadge status={status} type="warning" />
      default:
        return <StatusBadge status={status} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">累计复用</p>
              <p className="text-3xl font-bold mt-1">76次</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">本月复用</p>
              <p className="text-3xl font-bold mt-1 text-cyan-600">18次</p>
            </div>
            <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">节省办事时间</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600">12小时</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">减少材料提交</p>
              <p className="text-3xl font-bold mt-1 text-teal-600">24份</p>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-cyan-100 rounded-lg flex items-center justify-center text-base">🔐</span>
          跨事项复用授权
        </h2>
        <div className="bg-cyan-50 rounded-xl p-5 border border-cyan-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 11.25 7.5 12.75l4.5-4.5 6 6-1.5 1.5-4.5-6L6 15l-1.5-1.5a9 9 0 1 1 0 5.578" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-cyan-800">授权状态：已授权</p>
                <p className="text-xs text-cyan-600/70">重庆市人社领域所有办事事项</p>
              </div>
            </div>
            <StatusBadge status="已授权" type="success" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-cyan-600/70">授权时间：</span>
              <span className="text-cyan-800">2024-03-01</span>
            </div>
            <div>
              <span className="text-cyan-600/70">授权有效期：</span>
              <span className="text-cyan-800">长期有效</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors">
              调整授权范围
            </button>
            <button className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
              取消授权
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-cyan-100 rounded-lg flex items-center justify-center text-base">📋</span>
          复用明细
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">复用材料</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">目标事项</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">复用时间</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">复用状态</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">核验方式</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reuseRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-700 text-xs">{record.material}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{record.target}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{record.time}</td>
                  <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{record.verifyType}</td>
                  <td className="px-4 py-3">
                    <button className="text-cyan-600 hover:text-cyan-700 text-xs font-medium">
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center text-base">⚠️</span>
          复用失败反馈
        </h2>
        <div className="space-y-4">
          {failureFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-red-50 rounded-xl p-4 border border-red-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{feedback.material}</h3>
                    <p className="text-xs text-gray-500">目标事项：{feedback.target}</p>
                  </div>
                </div>
                {feedback.statusType === 'success' && <StatusBadge status={feedback.status} type="success" />}
                {feedback.statusType === 'pending' && <StatusBadge status={feedback.status} type="warning" />}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 flex-shrink-0 w-16">失败时间</span>
                  <span className="text-gray-600">{feedback.time}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 flex-shrink-0 w-16">失败原因</span>
                  <span className="text-red-600">{feedback.reason}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 flex-shrink-0 w-16">处理建议</span>
                  <span className="text-gray-600">{feedback.suggestion}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function OCRMaterial() {
  const [activeTab, setActiveTab] = useState('recognition')

  const tabs = [
    { key: 'recognition', label: '识别中心', icon: '🔍' },
    { key: 'library', label: '材料库', icon: '📚' },
    { key: 'records', label: '复用记录', icon: '📋' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">材料识别</h1>
              <p className="text-sm text-gray-500">OCR智能识别 · 结构化提取 · 材料复用</p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'recognition' && <TabRecognition />}
        {activeTab === 'library' && <TabMaterialLibrary />}
        {activeTab === 'records' && <TabReuseRecords />}

        <footer className="mt-8 text-center text-xs text-gray-400 pb-4">
          重庆市人力资源和社会保障局 · 材料OCR识别服务平台
        </footer>
      </div>
    </div>
  )
}
