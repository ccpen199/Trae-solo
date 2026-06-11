import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, FileText, Calendar, Building, ChevronDown } from 'lucide-react'
import { policyDocs } from '@/mocks/admin'

const CATEGORIES = ['全部', '社会保险', '就业服务', '人才服务', '劳动维权'] as const

const CATEGORY_COLORS: Record<string, string> = {
  '社会保险': 'bg-blue-100 text-blue-700',
  '就业服务': 'bg-green-100 text-green-700',
  '人才服务': 'bg-purple-100 text-purple-700',
  '劳动维权': 'bg-orange-100 text-orange-700',
}

function highlightText(text: string, keyword: string) {
  if (!keyword) return text
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-accent-500 font-semibold">{text.slice(idx, idx + keyword.length)}</span>
      {text.slice(idx + keyword.length)}
    </>
  )
}

export default function Policy() {
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(() => searchParams.get('q') || '')
  const [category, setCategory] = useState<string>('全部')
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)

  useEffect(() => {
    setKeyword(searchParams.get('q') || '')
  }, [searchParams])

  const filtered = useMemo(() => {
    return policyDocs.filter((doc) => {
      const matchCategory = category === '全部' || doc.category === category
      const normalizedKeyword = keyword.trim().toLowerCase()
      const matchKeyword = !normalizedKeyword ||
        doc.title.toLowerCase().includes(normalizedKeyword) ||
        doc.summary.toLowerCase().includes(normalizedKeyword) ||
        doc.department.toLowerCase().includes(normalizedKeyword) ||
        doc.category.toLowerCase().includes(normalizedKeyword)
      return matchCategory && matchKeyword
    })
  }, [keyword, category])

  const resultSummary = keyword.trim()
    ? `已按「${keyword.trim()}」匹配 ${filtered.length} 份政策文件`
    : `共收录 ${filtered.length} 份本地政策文件`

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="gov-section-title">政策文件</h1>

      <div className="gov-card p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gov-muted" size={20} />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索政策文件..."
            className="gov-input pl-12 py-3.5 text-base"
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gov-muted">{resultSummary}</p>
          {(keyword || category !== '全部') && (
            <button
              type="button"
              onClick={() => {
                setKeyword('')
                setCategory('全部')
                setExpandedDocId(null)
              }}
              className="text-sm text-primary-500 hover:text-primary-600"
            >
              清除筛选
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gov-muted hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="gov-card p-10 text-center text-gov-muted">
            未找到匹配的政策文件
          </div>
        ) : (
          filtered.map((doc) => (
            <div key={doc.id} className="gov-card p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-50 rounded-lg mt-0.5 shrink-0">
                  <FileText size={20} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gov-text leading-snug">
                    {highlightText(doc.title, keyword)}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gov-muted">
                    <span className="inline-flex items-center gap-1">
                      <Building size={12} />
                      {doc.department}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} />
                      {doc.publishDate}
                    </span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[doc.category] || 'bg-gray-100 text-gray-700'}`}>
                      {doc.category}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gov-muted line-clamp-2 leading-relaxed">
                    {doc.summary}
                  </p>

                  {expandedDocId === doc.id && (
                    <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50/50 p-4 text-sm text-gov-text leading-relaxed space-y-2">
                      <p>
                        <span className="font-medium">政策全文摘要：</span>
                        {doc.summary} 适用于广东省行政区域内参保单位、参保人、就业服务机构和相关经办部门。
                      </p>
                      <p>
                        <span className="font-medium">办理指引：</span>
                        申请人可通过移动政务中台提交材料，后台管理端完成受理、审核、归档和操作日志留痕。
                      </p>
                      <p>
                        <span className="font-medium">数据口径：</span>
                        文件分类、发布日期、主管部门和检索关键词均来自本地政策库，支持按类别筛选复核。
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                    className="mt-3 inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 cursor-pointer font-medium"
                  >
                    {expandedDocId === doc.id ? '收起全文' : '查看全文'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedDocId === doc.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
