import { useState } from 'react'
import { ShoppingCart, MessageSquare, CheckCircle } from 'lucide-react'
import { useStore } from '@/store'
import InquiryModal from './InquiryModal'

const bomItems = [
  { name: '羊绒混纺纱线', spec: '2/48Nm', unit: 'kg', quantity: 500 },
  { name: '拉链', spec: '5号闭尾', unit: '条', quantity: 5000 },
  { name: '纽扣', spec: '14mm四孔', unit: '颗', quantity: 15000 },
  { name: '洗水标', spec: '30x15mm', unit: '个', quantity: 5000 },
  { name: '胶袋', spec: '25x35cm', unit: '个', quantity: 5000 },
]

const bomPrices: Record<string, { supplier: string; price: number }[]> = {
  '羊绒混纺纱线': [
    { supplier: '桐乡锦华纱线', price: 268 },
    { supplier: '濮院纱线市场', price: 285 },
    { supplier: '绍兴纺织城', price: 295 },
  ],
  '拉链': [
    { supplier: '义乌辅料中心', price: 2.3 },
    { supplier: '温州纽扣饰品', price: 2.5 },
    { supplier: '杭州辅料城', price: 2.8 },
  ],
  '纽扣': [
    { supplier: '温州纽扣饰品', price: 0.75 },
    { supplier: '义乌辅料中心', price: 0.8 },
    { supplier: '杭州辅料城', price: 0.95 },
  ],
  '洗水标': [
    { supplier: '义乌辅料中心', price: 0.12 },
    { supplier: '杭州辅料城', price: 0.15 },
    { supplier: '温州纽扣饰品', price: 0.18 },
  ],
  '胶袋': [
    { supplier: '义乌辅料中心', price: 0.08 },
    { supplier: '杭州辅料城', price: 0.1 },
    { supplier: '温州纽扣饰品', price: 0.12 },
  ],
}

const supplierIdMap: Record<string, string> = {
  '桐乡锦华纱线': 's5',
  '濮院纱线市场': 's1',
  '义乌辅料中心': 's3',
  '温州纽扣饰品': 's4',
  '绍兴纺织城': 'bom_s1',
  '杭州辅料城': 'bom_s2',
}

export default function BomCompare() {
  const addInquiry = useStore((s) => s.addInquiry)
  const currentUser = useStore((s) => s.currentUser)

  const supplierNames = ['桐乡锦华纱线', '濮院纱线市场', '义乌辅料中心', '温州纽扣饰品', '绍兴纺织城', '杭州辅料城']

  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [inquiryTarget, setInquiryTarget] = useState<{ id: string; name: string } | null>(null)

  const supplierTotals = supplierNames.map((name) => {
    const total = bomItems.reduce((sum, item) => {
      const prices = bomPrices[item.name] || []
      const priceEntry = prices.find((p) => p.supplier === name)
      return sum + (priceEntry ? priceEntry.price * item.quantity : 0)
    }, 0)
    return { name, total }
  })

  const minTotal = Math.min(...supplierTotals.filter((s) => s.total > 0).map((s) => s.total))
  const lowestSupplier = supplierTotals.find((s) => s.total === minTotal)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleRowInquiry = (itemName: string, itemSpec: string, itemQty: number, itemUnit: string) => {
    const prices = bomPrices[itemName] || []
    const minPrice = Math.min(...prices.map((p) => p.price))
    const lowestPriceSupplier = prices.find((p) => p.price === minPrice)
    if (!lowestPriceSupplier) return

    addInquiry({
      fromUserId: currentUser?.id || 'u1',
      toSupplierId: supplierIdMap[lowestPriceSupplier.supplier] || lowestPriceSupplier.supplier,
      type: 'accessory',
      title: `关于${itemName}的询价`,
      content: `规格: ${itemSpec}, 数量: ${itemQty}${itemUnit}, 最低价: ¥${minPrice}`,
      quantity: itemQty,
      budget: { min: minPrice, max: minPrice },
      deliveryDate: '',
    })
    showToast(`${itemName}询价已发送至${lowestPriceSupplier.supplier}`)
  }

  const handleGenerateOrder = () => {
    if (!lowestSupplier) return
    addInquiry({
      fromUserId: currentUser?.id || 'u1',
      toSupplierId: supplierIdMap[lowestSupplier.name] || lowestSupplier.name,
      type: 'procurement',
      title: `BOM采购单 - ${lowestSupplier.name}`,
      content: bomItems.map((item) => `${item.name}(${item.spec}) × ${item.quantity}${item.unit}`).join('\n'),
      quantity: bomItems.reduce((s, i) => s + i.quantity, 0),
      budget: { min: lowestSupplier.total, max: lowestSupplier.total },
      deliveryDate: '',
    })
    showToast('采购单已生成，可在订单中心查看')
  }

  const handleOpenInquiryModal = () => {
    if (!lowestSupplier) return
    const sid = supplierIdMap[lowestSupplier.name] || lowestSupplier.name
    setInquiryTarget({ id: sid, name: lowestSupplier.name })
    setInquiryOpen(true)
  }

  const handleSelectLowest = () => {
    if (lowestSupplier) {
      setSelectedSupplier(lowestSupplier.name)
      showToast(`已选择最低价供应商: ${lowestSupplier.name}`)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="font-serif text-base font-semibold text-navy-700 mb-4">BOM清单比价</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100">
              <th className="text-left py-2 px-3 text-xs font-medium text-navy-400">物料名称</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-navy-400">规格</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-navy-400">数量</th>
              {supplierNames.map((name) => (
                <th key={name} className={`text-right py-2 px-3 text-xs font-medium ${selectedSupplier === name ? 'text-amber-600' : 'text-navy-400'}`}>
                  {name}
                  {selectedSupplier === name && <CheckCircle size={10} className="inline ml-1 text-amber-500" />}
                </th>
              ))}
              <th className="text-center py-2 px-3 text-xs font-medium text-navy-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {bomItems.map((item) => {
              const prices = bomPrices[item.name] || []
              const minPrice = Math.min(...prices.map((p) => p.price))
              return (
                <tr key={item.name} className="border-b border-navy-50 hover:bg-surface">
                  <td className="py-2.5 px-3 text-navy-700 font-medium">{item.name}</td>
                  <td className="py-2.5 px-3 text-navy-400">{item.spec}</td>
                  <td className="py-2.5 px-3 text-right text-navy-500">{item.quantity}{item.unit}</td>
                  {supplierNames.map((name) => {
                    const priceEntry = prices.find((p) => p.supplier === name)
                    const isMin = priceEntry && priceEntry.price === minPrice
                    return (
                      <td key={name} className={`py-2.5 px-3 text-right ${isMin ? 'text-teal-600 font-semibold bg-teal-50/50' : 'text-navy-400'}`}>
                        {priceEntry ? `¥${priceEntry.price}` : '-'}
                        {isMin && <span className="ml-1 text-[10px] text-teal-500">最低</span>}
                      </td>
                    )
                  })}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleRowInquiry(item.name, item.spec, item.quantity, item.unit)}
                      className="px-2 py-1 text-[10px] text-amber-600 border border-amber-300 rounded hover:bg-amber-50 transition-colors"
                    >
                      询价
                    </button>
                  </td>
                </tr>
              )
            })}
            <tr className="bg-navy-50/50 font-semibold">
              <td className="py-2.5 px-3 text-navy-700" colSpan={2}>合计</td>
              <td className="py-2.5 px-3 text-right text-navy-500">-</td>
              {supplierNames.map((name) => {
                const entry = supplierTotals.find((s) => s.name === name)
                const isLowest = entry && entry.total === minTotal && entry.total > 0
                return (
                  <td key={name} className={`py-2.5 px-3 text-right ${isLowest ? 'text-teal-600 bg-teal-50' : 'text-navy-600'}`}>
                    {entry && entry.total > 0 ? `¥${entry.total.toLocaleString()}` : '-'}
                    {isLowest && <span className="ml-1 text-[10px] text-teal-500">最低</span>}
                  </td>
                )
              })}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 mt-4 pt-4 border-t border-navy-100">
        <button
          onClick={handleSelectLowest}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors flex items-center gap-1"
        >
          <CheckCircle size={14} />一键选择最低价供应商
        </button>
        <button
          onClick={handleGenerateOrder}
          className="px-4 py-2 border border-navy-200 rounded-lg text-sm text-navy-600 hover:bg-navy-50 transition-colors flex items-center gap-1"
        >
          <ShoppingCart size={14} />生成采购单
        </button>
        <button
          onClick={handleOpenInquiryModal}
          className="px-4 py-2 border border-navy-200 rounded-lg text-sm text-navy-600 hover:bg-navy-50 transition-colors flex items-center gap-1"
        >
          <MessageSquare size={14} />发起询价
        </button>
      </div>
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-teal-500 text-white rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}
      {inquiryTarget && (
        <InquiryModal
          open={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
          supplierId={inquiryTarget.id}
          supplierName={inquiryTarget.name}
        />
      )}
    </div>
  )
}
