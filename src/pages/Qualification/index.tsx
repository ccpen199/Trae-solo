import { useState } from 'react'
import { CheckCircle2, XCircle, Search } from 'lucide-react'
import { mockQualificationCerts } from '@/mock/data'
import type { QualificationCert } from '@/types'

type SearchMode = 'certNo' | 'idCard'

export default function Qualification() {
  const [searchMode, setSearchMode] = useState<SearchMode>('certNo')
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<QualificationCert[]>([])
  const [searched, setSearched] = useState(false)

  const placeholder = searchMode === 'certNo' ? '请输入证书编号' : '请输入身份证号'

  const handleSearch = () => {
    setSearched(true)
    if (!keyword.trim()) {
      setResults(mockQualificationCerts)
      return
    }
    setResults(mockQualificationCerts)
  }

  const validCount = results.filter((c) => c.valid).length
  const invalidCount = results.filter((c) => !c.valid).length

  return (
    <div className="min-h-screen bg-surface-primary p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">职业资格证书核验</h1>
        <p className="text-sm text-gray-500 mt-1">全国职业资格证书真伪查询</p>
      </div>

      <div className="gov-card p-6 mb-6">
        <div className="flex items-center gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="searchMode"
              checked={searchMode === 'certNo'}
              onChange={() => setSearchMode('certNo')}
              className="accent-gov-blue"
            />
            <span className="text-sm text-gray-700">证书编号查询</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="searchMode"
              checked={searchMode === 'idCard'}
              onChange={() => setSearchMode('idCard')}
              className="accent-gov-blue"
            />
            <span className="text-sm text-gray-700">身份证号查询</span>
          </label>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="gov-btn-primary">
            查询核验
          </button>
        </div>
      </div>

      {searched && (
        <div className="space-y-4 mb-6 animate-fade-in-up">
          {results.map((cert) => (
            <div
              key={cert.id}
              className="gov-card p-5 border-l-4"
              style={{ borderLeftColor: cert.valid ? '#2ECC71' : '#E74C3C' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gov-blue-dark">{cert.name}</h3>
                    <span className="gov-badge bg-gov-blue/10 text-gov-blue">{cert.level}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-400">发证机构：</span>
                      {cert.issuer}
                    </div>
                    <div>
                      <span className="text-gray-400">发证日期：</span>
                      {cert.issueDate}
                    </div>
                    <div>
                      <span className="text-gray-400">证书编号：</span>
                      {cert.certNo}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-4 shrink-0">
                  {cert.valid ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-status-success" />
                      <span className="text-sm font-medium text-status-success">✓ 证书有效</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-status-danger" />
                      <span className="text-sm font-medium text-status-danger">✗ 证书无效</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {searched && results.length > 0 && (
        <div className="gov-card p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">查询证书总数</p>
              <p className="text-2xl font-bold text-gov-blue mt-1">{results.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">有效证书</p>
              <p className="text-2xl font-bold text-status-success mt-1">{validCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">无效证书</p>
              <p className="text-2xl font-bold text-status-danger mt-1">{invalidCount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
