import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, ScanLine, Search, ShieldCheck } from 'lucide-react'
import { traceRecords } from '@/mocks'

const exampleCodes = ['TR-2026-0001', 'TR-2026-0002', 'TR-2026-0003', 'TR-2026-0004']

function matchTraceRecords(keyword: string) {
  const query = keyword.trim().toLowerCase()
  if (!query) return []

  return traceRecords.filter((record) => {
    const values = [
      record.traceCode,
      record.productName,
      record.category,
      record.origin,
      record.batchNo,
      ...record.nodes.map((node) => `${node.operator} ${node.location} ${node.stage}`),
    ]
    return values.some((value) => value.toLowerCase().includes(query))
  })
}

export default function TracePage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [searchedKeyword, setSearchedKeyword] = useState('')
  const [results, setResults] = useState<typeof traceRecords>([])

  const handleSubmit = () => {
    const keyword = code.trim()
    if (!keyword) return

    const exactRecord = traceRecords.find((record) => record.traceCode.toLowerCase() === keyword.toLowerCase())
    if (exactRecord) {
      navigate(`/trace/${exactRecord.traceCode}`)
      return
    }

    setSearchedKeyword(keyword)
    const matched = matchTraceRecords(keyword)
    setResults(matched.length > 0 ? matched : traceRecords)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-gold-50" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #0D7C3E 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-4xl text-center"
      >
        <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <ScanLine size={32} className="text-white" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-3">溯源查询</h1>
        <p className="text-gray-500 mb-8">输入溯源码、产品、产地或企业名称，查看产品全链条信息</p>
        <div className="relative mx-auto mb-6 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="请输入溯源码或关键词，如 TR-2026-0001"
            className="w-full pl-12 pr-28 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all text-lg"
          />
          <button
            onClick={handleSubmit}
            disabled={!code.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            查询
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-sm text-gray-400 mr-1 self-center">示例：</span>
          {exampleCodes.map((c) => (
            <button
              key={c}
              onClick={() => navigate(`/trace/${c}`)}
              className="px-3 py-1.5 bg-white border border-primary-200 text-primary-600 rounded-full text-sm hover:bg-primary-50 hover:border-primary-400 transition-colors"
            >
              {c}
            </button>
          ))}
        </div>

        {searchedKeyword && (
          <div className="mt-8 text-left">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-900">查询结果</h2>
                <p className="mt-1 text-sm text-gray-500">
                  关键词「{searchedKeyword}」匹配 {results.length} 条溯源记录
                </p>
              </div>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
                搜索结果
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((record) => (
                <Link
                  key={record.traceCode}
                  to={`/trace/${record.traceCode}`}
                  className="group block rounded-xl bg-white p-5 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                          {record.category}
                        </span>
                        <span className="font-mono text-xs text-gray-400">{record.traceCode}</span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-gray-900">{record.productName}</h3>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 text-gray-300 transition group-hover:text-primary-500" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} />
                      {record.origin}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck size={14} />
                      区块 #{record.blockHeight.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    {record.nodes[0]?.operator} 至 {record.nodes[record.nodes.length - 1]?.operator}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
