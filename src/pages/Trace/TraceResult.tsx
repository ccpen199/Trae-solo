import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  ShieldCheck,
  Sprout,
  Factory,
  Truck,
  Store,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  Hash,
  Box,
  FileText,
  Thermometer,
  Droplets,
  AlertTriangle,
  ExternalLink,
  Leaf,
  Package,
} from 'lucide-react'
import { traceRecords, farmPlots, logisticsOrders, shops } from '@/mocks'
import type { TraceNode } from '@/types'

const stageConfig: Record<string, { label: string; icon: typeof Sprout; color: string; bg: string; border: string }> = {
  production: { label: '生产', icon: Sprout, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-400' },
  processing: { label: '加工', icon: Factory, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-400' },
  logistics: { label: '物流', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-400' },
  wholesale: { label: '批发', icon: Store, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-400' },
  retail: { label: '零售', icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-400' },
}

const resultConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  passed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: '合格' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: '不合格' },
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: '待检测' },
}

const farmRecordTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  sowing: { label: '播种', color: 'text-green-700', bg: 'bg-green-100' },
  fertilizing: { label: '施肥', color: 'text-amber-700', bg: 'bg-amber-100' },
  irrigating: { label: '灌溉', color: 'text-blue-700', bg: 'bg-blue-100' },
  spraying: { label: '施药', color: 'text-red-700', bg: 'bg-red-100' },
  harvesting: { label: '采收', color: 'text-purple-700', bg: 'bg-purple-100' },
}

function findMatchingPlot(record: typeof traceRecords[number]) {
  const keywordMap: Record<string, string[]> = {
    '寿光': ['寿光'],
    '五常': ['五常'],
    '阿克苏': ['阿克苏'],
  }
  const categoryCropMap: Record<string, string[]> = {
    '蔬菜': ['西红柿'],
    '粮食': ['水稻'],
    '水果': ['苹果'],
  }
  for (const plot of farmPlots) {
    for (const [keyword, matches] of Object.entries(keywordMap)) {
      if (record.origin.includes(keyword) && matches.some(m => plot.name.includes(m))) {
        return plot
      }
    }
    const crops = categoryCropMap[record.category]
    if (crops && crops.includes(plot.crop)) {
      return plot
    }
  }
  return null
}

function searchTraceRecords(keyword?: string) {
  const query = decodeURIComponent(keyword || '').trim().toLowerCase()
  if (!query) return traceRecords

  const matched = traceRecords.filter((record) => {
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

  return matched.length > 0 ? matched : traceRecords
}

function TimelineNode({
  node,
  isLast,
  index,
}: {
  node: TraceNode
  isLast: boolean
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const config = stageConfig[node.stage]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full ${config.bg} border-2 ${config.border} flex items-center justify-center flex-shrink-0`}
          >
            <Icon size={18} className={config.color} />
          </div>
          {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
        </div>
        <div className="flex-1 pb-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-sm font-medium text-gray-900">{node.operator}</span>
              </div>
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} className="text-gray-400" />
              </motion.div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {node.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {node.timestamp}
              </span>
            </div>
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-2 ml-2 bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">详细信息</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(node.details).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-xs text-gray-400">{key}</span>
                        <p className="text-sm text-gray-700">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default function TraceResult() {
  const { traceCode } = useParams<{ traceCode: string }>()
  const record = traceRecords.find((r) => r.traceCode === traceCode)

  if (!record) {
    const results = searchTraceRecords(traceCode)

    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/trace" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
          <ArrowLeft size={16} />
          返回查询
        </Link>
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl font-bold text-gray-900">查询结果</h1>
              <p className="mt-2 text-gray-500">
                关键词「{traceCode}」暂无精确溯源码，已为你展示可追溯产品记录。
              </p>
            </div>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
              搜索结果
            </span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((item) => (
            <Link
              key={item.traceCode}
              to={`/trace/${item.traceCode}`}
              className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      {item.category}
                    </span>
                    <span className="font-mono text-xs text-gray-400">{item.traceCode}</span>
                  </div>
                  <h2 className="font-serif text-lg font-bold text-gray-900">{item.productName}</h2>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 text-gray-300 transition group-hover:text-primary-500" />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {item.origin}
                </span>
                <span className="flex items-center gap-1">
                  <Box size={14} />
                  {item.batchNo}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                {item.nodes[0]?.operator} 至 {item.nodes[item.nodes.length - 1]?.operator}
              </p>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const matchedPlot = findMatchingPlot(record)
  const matchedLogistics = logisticsOrders.find((o) => o.batchNo === record.batchNo)
  const matchedShopEntry = shops.flatMap((s) => s.products.map((p) => ({ shop: s, product: p }))).find((e) => e.product.traceCode === record.traceCode)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/trace" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft size={16} />
        返回查询
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900">{record.productName}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                {record.category}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {record.origin}
              </span>
              {matchedPlot && (
                <Link to={`/farm/plot/${matchedPlot.id}`} className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium">
                  查看种植档案 →
                </Link>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">批次号</p>
            <p className="text-sm font-mono text-gray-700">{record.batchNo}</p>
            <p className="text-xs text-gray-400 mt-1">溯源码</p>
            <p className="text-sm font-mono text-primary-600 font-medium">{record.traceCode}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">全链条追溯</h2>
        <div>
          {record.nodes.map((node, i) => (
            <TimelineNode
              key={node.id}
              node={node}
              isLast={i === record.nodes.length - 1}
              index={i}
            />
          ))}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary-500" />
            区块链验证
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">交易哈希</p>
              <p className="font-mono text-xs text-gray-600 break-all bg-gray-50 p-2 rounded-lg">{record.blockchainHash}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Box size={10} />
                  区块高度
                </p>
                <p className="font-mono text-sm text-gray-700">{record.blockHeight.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Calendar size={10} />
                  上链时间
                </p>
                <p className="text-sm text-gray-700">{record.timestamp}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <CheckCircle2 size={14} />
                已验证
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Hash size={20} className="text-gold-500" />
            检验报告
          </h3>
          <div className="space-y-3">
            {record.inspections.map((insp) => {
              const rConfig = resultConfig[insp.result]
              const RIcon = rConfig.icon
              return (
                <div key={insp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{insp.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{insp.date}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 ${rConfig.bg} ${rConfig.color} rounded-full text-xs font-medium`}>
                    <RIcon size={12} />
                    {rConfig.label}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Leaf size={20} className="text-green-600" />
          种植档案关联
        </h2>
        {matchedPlot ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400">地块名称</p>
                <p className="text-sm font-medium text-gray-800">{matchedPlot.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">作物</p>
                <p className="text-sm font-medium text-gray-800">{matchedPlot.crop}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">面积</p>
                <p className="text-sm font-medium text-gray-800">{matchedPlot.area}亩</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">土壤类型</p>
                <p className="text-sm font-medium text-gray-800">{matchedPlot.soilType}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-gray-500 mb-3">农事记录</p>
              <div className="space-y-2">
                {matchedPlot.records.map((fr, idx) => {
                  const typeConf = farmRecordTypeConfig[fr.type]
                  return (
                    <div key={idx} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeConf.bg} ${typeConf.color} whitespace-nowrap`}>
                        {typeConf.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{fr.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fr.date}</p>
                      </div>
                      {fr.inputs && fr.inputs.length > 0 && (
                        <div className="text-xs text-gray-500 flex-shrink-0">
                          {fr.inputs.map((inp, i) => (
                            <span key={i} className="inline-block bg-white px-1.5 py-0.5 rounded mr-1 mb-0.5">
                              {inp.name} {inp.amount}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <Link to={`/farm/plot/${matchedPlot.id}`} className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
              查看完整档案
              <ExternalLink size={14} />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400">
            暂无关联种植档案
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Thermometer size={20} className="text-orange-600" />
          物流温湿度全程
        </h2>
        {matchedLogistics ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Truck size={12} /> 运输路线</p>
                <p className="text-sm font-medium text-gray-800">{matchedLogistics.origin} → {matchedLogistics.destination}</p>
                <p className="text-xs text-gray-400 mt-0.5">承运：{matchedLogistics.carrier}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Thermometer size={12} /> 温度范围</p>
                  <p className="text-sm font-medium text-gray-800">
                    {Math.min(...matchedLogistics.tempData.map(t => t.temp))}℃ ~ {Math.max(...matchedLogistics.tempData.map(t => t.temp))}℃
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Droplets size={12} /> 湿度范围</p>
                  <p className="text-sm font-medium text-gray-800">
                    {Math.min(...matchedLogistics.tempData.map(t => t.humidity))}% ~ {Math.max(...matchedLogistics.tempData.map(t => t.humidity))}%
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 mb-4">
              <p className="text-xs font-medium text-gray-500 mb-3">温度曲线</p>
              <svg viewBox="0 0 400 80" className="w-full h-20">
                {(() => {
                  const temps = matchedLogistics.tempData.map(t => t.temp)
                  const minT = Math.min(...temps)
                  const maxT = Math.max(...temps)
                  const range = maxT - minT || 1
                  const barW = 400 / temps.length
                  return temps.map((t, i) => {
                    const h = ((t - minT) / range) * 60 + 10
                    const y = 70 - h
                    return <rect key={i} x={i * barW + 1} y={y} width={barW - 2} height={h} rx={2} fill={t === maxT && maxT - minT > 2 ? '#ef4444' : '#f97316'} opacity={0.7} />
                  })
                })()}
              </svg>
            </div>
            {matchedLogistics.alerts.length > 0 && (
              <div className="border-t pt-4 mb-4">
                <p className="text-xs font-medium text-gray-500 mb-3">告警汇总</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <AlertTriangle size={14} />
                    共 {matchedLogistics.alerts.length} 条
                  </span>
                  <span className="text-green-600">已解决 {matchedLogistics.alerts.filter(a => a.resolved).length}</span>
                  <span className="text-red-600">未解决 {matchedLogistics.alerts.filter(a => !a.resolved).length}</span>
                </div>
              </div>
            )}
            {matchedLogistics.status === 'delivered' && (
              <div className="border-t pt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <CheckCircle2 size={16} />
                  已签收
                </span>
                <p className="text-xs text-gray-400 mt-2">签收地点：{matchedLogistics.currentLocation.address}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400">
            暂无物流记录
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={20} className="text-purple-600" />
          入市销售凭证
        </h2>
        {matchedShopEntry ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400">店铺名称</p>
                <p className="text-sm font-medium text-gray-800">{matchedShopEntry.shop.name}</p>
                <p className="text-xs text-amber-600 mt-0.5">评分 {matchedShopEntry.shop.rating}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">商品名称</p>
                <p className="text-sm font-medium text-gray-800">{matchedShopEntry.product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">库存 {matchedShopEntry.product.stock} 件</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-gray-500 mb-3">销售凭证</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">销售方</p>
                    <p className="text-gray-800">{matchedShopEntry.shop.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">商品名称</p>
                    <p className="text-gray-800">{matchedShopEntry.product.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">零售价格</p>
                    <p className="text-gray-800">¥{matchedShopEntry.product.price}/kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">上架时间</p>
                    <p className="text-gray-800">
                      {record.nodes.find(n => n.stage === 'retail')?.timestamp ?? '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Link to={`/shop/${matchedShopEntry.shop.id}`} className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
              查看店铺
              <ExternalLink size={14} />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400">
            暂无入市销售记录
          </div>
        )}
      </motion.div>
    </div>
  )
}
