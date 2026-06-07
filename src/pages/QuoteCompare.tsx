import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Plus, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, XCircle, BarChart3, FileText, ChevronLeft, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const demoQuotes = [
  {
    id: 1,
    companyId: 1,
    companyName: '东易日盛装饰',
    totalPrice: 158000,
    items: [
      { name: '水电改造', unit: '项', quantity: 1, price: 18000 },
      { name: '地砖铺设', unit: '㎡', quantity: 120, price: 150 },
      { name: '墙面乳胶漆', unit: '㎡', quantity: 300, price: 80 },
      { name: '吊顶造型', unit: '项', quantity: 1, price: 12000 },
      { name: '防水工程', unit: '项', quantity: 1, price: 8000 },
      { name: '门套制作', unit: '套', quantity: 4, price: 1500 },
    ],
  },
  {
    id: 2,
    companyId: 2,
    companyName: '业之峰装饰',
    totalPrice: 142000,
    items: [
      { name: '水电改造', unit: '项', quantity: 1, price: 15000 },
      { name: '地砖铺设', unit: '㎡', quantity: 120, price: 130 },
      { name: '墙面乳胶漆', unit: '㎡', quantity: 300, price: 70 },
      { name: '吊顶造型', unit: '项', quantity: 1, price: 10000 },
      { name: '防水工程', unit: '项', quantity: 1, price: 6000 },
      { name: '管理费', unit: '项', quantity: 1, price: 8000 },
    ],
  },
  {
    id: 3,
    companyId: 4,
    companyName: '尚品本色装饰',
    totalPrice: 128000,
    items: [
      { name: '水电改造', unit: '项', quantity: 1, price: 12000 },
      { name: '地砖铺设', unit: '㎡', quantity: 120, price: 110 },
      { name: '墙面乳胶漆', unit: '㎡', quantity: 280, price: 60 },
      { name: '防水工程', unit: '项', quantity: 1, price: 5000 },
      { name: '门套制作', unit: '套', quantity: 4, price: 1000 },
    ],
  },
]

export default function QuoteCompare() {
  const [selectedQuotes, setSelectedQuotes] = useState<number[]>([1, 2])
  const [uploadedQuotes, setUploadedQuotes] = useState<number[]>([])
  const [notice, setNotice] = useState('')

  const allItemNames = Array.from(
    new Set(demoQuotes.flatMap((q) => q.items.map((i) => i.name)))
  )

  const toggleQuote = (id: number) => {
    setSelectedQuotes((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    )
  }

  const selectedQuoteData = demoQuotes.filter((q) => selectedQuotes.includes(q.id))
  const selectedTotals = selectedQuoteData.map((q) => q.totalPrice)

  const getItemPrice = (quote: typeof demoQuotes[0], itemName: string) => {
    const item = quote.items.find((i) => i.name === itemName)
    return item ? item.price * item.quantity : null
  }

  const getPriceDiff = (itemName: string) => {
    const prices = selectedQuoteData
      .map((q) => getItemPrice(q, itemName))
      .filter((p) => p !== null) as number[]
    if (prices.length < 2) return { max: 0, min: 0, diff: 0 }
    const max = Math.max(...prices)
    const min = Math.min(...prices)
    return { max, min, diff: max - min }
  }

  const maxTotal = selectedTotals.length > 0 ? Math.max(...selectedTotals) : 0
  const minTotal = selectedTotals.length > 0 ? Math.min(...selectedTotals) : 0

  const addUploadedQuote = () => {
    const nextId = uploadedQuotes.length + 1
    setUploadedQuotes((prev) => [...prev, nextId])
    setNotice(`报价单 ${nextId} 已上传并进入待解析队列`)
  }

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/renovation" className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1 mb-4">
            <ChevronLeft size={16} strokeWidth={1.5} />
            返回装修服务
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">装修报价对比</h1>
          <p className="text-slate-500">上传多家报价单，智能对比分析，帮您省钱避坑</p>
        </div>

        {notice && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700 shadow-sm">
            <CheckCircle size={18} strokeWidth={1.5} />
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-slate-900 mb-4">选择报价单</h3>

              <div className="space-y-3 mb-6">
                {demoQuotes.map((quote) => (
                  <label
                    key={quote.id}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selectedQuotes.includes(quote.id)
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-teal-200'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedQuotes.includes(quote.id)}
                      onChange={() => toggleQuote(quote.id)}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{quote.companyName}</p>
                      <p className="text-lg font-bold text-teal-600">¥{quote.totalPrice.toLocaleString()}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button
                  onClick={addUploadedQuote}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-teal-500 hover:text-teal-600 transition-colors"
                >
                  <Upload size={18} strokeWidth={1.5} />
                  上传报价单
                </button>
              </div>

              {uploadedQuotes.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedQuotes.map((id) => (
                    <div key={id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-teal-600" strokeWidth={1.5} />
                        <span className="text-sm">已上传报价单 {id}</span>
                      </div>
                      <button
                        onClick={() => setUploadedQuotes((prev) => prev.filter((q) => q !== id))}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-amber-50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-teal-600" strokeWidth={1.5} />
                <h3 className="font-semibold text-slate-900">对比总结</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">最高价</p>
                  <p className="text-2xl font-bold text-red-500">¥{maxTotal.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">最低价</p>
                  <p className="text-2xl font-bold text-green-500">¥{minTotal.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">最大差价</p>
                  <p className="text-2xl font-bold text-amber-500">¥{(maxTotal - minTotal).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {selectedQuoteData.length >= 2 ? (
              <>
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 sticky left-0 bg-slate-50 z-10">
                            项目名称
                          </th>
                          {selectedQuoteData.map((quote) => (
                            <th key={quote.id} className="px-6 py-4 text-center text-sm font-semibold text-slate-900 min-w-[180px]">
                              {quote.companyName}
                              <p className="text-lg font-bold text-teal-600 mt-1">
                                ¥{quote.totalPrice.toLocaleString()}
                              </p>
                            </th>
                          ))}
                          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 min-w-[120px]">
                            差价
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allItemNames.map((itemName) => {
                          const { max, min, diff } = getPriceDiff(itemName)
                          const hasMissing = selectedQuoteData.some((q) => !q.items.find((i) => i.name === itemName))

                          return (
                            <tr key={itemName} className={hasMissing ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                              <td className="px-6 py-4 sticky left-0 bg-white z-10">
                                <div className="flex items-center gap-2">
                                  {hasMissing && (
                                    <AlertTriangle size={16} className="text-amber-500" strokeWidth={1.5} />
                                  )}
                                  <span className="font-medium text-slate-900">{itemName}</span>
                                </div>
                              </td>
                              {selectedQuoteData.map((quote) => {
                                const price = getItemPrice(quote, itemName)
                                const isMax = price === max && price !== null
                                const isMin = price === min && price !== null

                                return (
                                  <td key={quote.id} className="px-6 py-4 text-center">
                                    {price !== null ? (
                                      <div>
                                        <p className={cn(
                                          'font-semibold',
                                          isMax && diff > 0 ? 'text-red-500' : isMin && diff > 0 ? 'text-green-500' : 'text-slate-700'
                                        )}>
                                          ¥{price.toLocaleString()}
                                        </p>
                                        {isMax && diff > 0 && (
                                          <span className="inline-flex items-center gap-0.5 text-xs text-red-500">
                                            <TrendingUp size={12} strokeWidth={1.5} />
                                            最高
                                          </span>
                                        )}
                                        {isMin && diff > 0 && (
                                          <span className="inline-flex items-center gap-0.5 text-xs text-green-500">
                                            <TrendingDown size={12} strokeWidth={1.5} />
                                            最低
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-slate-400">
                                        <XCircle size={18} className="mx-auto" strokeWidth={1.5} />
                                        <p className="text-xs mt-1">无此项目</p>
                                      </div>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="px-6 py-4 text-center">
                                {diff > 0 ? (
                                  <span className="font-semibold text-amber-500">
                                    ¥{diff.toLocaleString()}
                                  </span>
                                ) : (
                                  <CheckCircle size={18} className="mx-auto text-green-500" strokeWidth={1.5} />
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 font-semibold">
                        <tr>
                          <td className="px-6 py-4 text-slate-900 sticky left-0 bg-slate-50 z-10">
                            总计
                          </td>
                          {selectedQuoteData.map((quote) => (
                            <td key={quote.id} className="px-6 py-4 text-center">
                              <p className={cn(
                                'text-xl font-bold',
                                quote.totalPrice === maxTotal ? 'text-red-500' : quote.totalPrice === minTotal ? 'text-green-500' : 'text-slate-900'
                              )}>
                                ¥{quote.totalPrice.toLocaleString()}
                              </p>
                            </td>
                          ))}
                          <td className="px-6 py-4 text-center">
                            <span className="text-xl font-bold text-amber-500">
                              ¥{(maxTotal - minTotal).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="font-semibold text-slate-900 mb-4">差异分析</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={18} className="text-amber-500" strokeWidth={1.5} />
                        <span className="font-medium text-amber-800">漏项提醒</span>
                      </div>
                      <p className="text-sm text-amber-700">
                        {selectedQuoteData.filter((q) => !q.items.find((i) => i.name === '吊顶造型')).length > 0 && (
                          <>部分报价缺少"吊顶造型"项目<br /></>
                        )}
                        {selectedQuoteData.filter((q) => !q.items.find((i) => i.name === '管理费')).length > 0 && (
                          <>部分报价缺少"管理费"项目<br /></>
                        )}
                        {selectedQuoteData.filter((q) => !q.items.find((i) => i.name === '门套制作')).length > 0 && (
                          <>部分报价缺少"门套制作"项目</>
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={18} className="text-green-500" strokeWidth={1.5} />
                        <span className="font-medium text-green-800">省钱建议</span>
                      </div>
                      <p className="text-sm text-green-700">
                        选择最低价方案可节省 ¥{(maxTotal - minTotal).toLocaleString()}<br />
                        建议重点关注水电改造、防水工程等隐蔽工程的施工质量
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setNotice('对比报告已生成，包含总价差异、漏项提醒和省钱建议')}
                    className="px-8 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                  >
                    导出对比报告
                  </button>
                  <button
                    onClick={addUploadedQuote}
                    className="px-8 py-3 border-2 border-teal-600 text-teal-600 rounded-xl font-medium hover:bg-teal-50 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} strokeWidth={1.5} />
                    添加报价单
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-16 text-center shadow-lg">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <BarChart3 size={32} className="text-slate-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">请选择至少2份报价单进行对比</h3>
                <p className="text-slate-500">在左侧选择报价单或上传新的报价单</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
