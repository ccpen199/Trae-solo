import { useState } from 'react'
import { Settings, MapPin, Truck, Clock, DollarSign } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

type DispatchStrategy = 'auto' | 'manual' | 'smart'

interface DispatchConfig {
  strategy: DispatchStrategy
  range: number
  baseFee: number
  distanceFee: number
  freeDeliveryThreshold: number
  maxOrders: number
  autoAccept: boolean
}

const strategyInfo: Record<DispatchStrategy, { label: string; desc: string }> = {
  auto: { label: '自动分发', desc: '系统根据骑手位置和负载自动分配订单' },
  manual: { label: '手动分发', desc: '商家自行选择骑手并分配订单' },
  smart: { label: '智能分发', desc: 'AI综合评估骑手评分、距离、负载等因素' },
}

export default function Dispatch() {
  const [config, setConfig] = useState<DispatchConfig>({
    strategy: 'smart',
    range: 5,
    baseFee: 3,
    distanceFee: 1.5,
    freeDeliveryThreshold: 30,
    maxOrders: 5,
    autoAccept: true,
  })

  const updateConfig = <K extends keyof DispatchConfig>(key: K, value: DispatchConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">分发设置</h1>
        <Button onClick={() => {}}>保存设置</Button>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">分发策略</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(strategyInfo) as DispatchStrategy[]).map((key) => (
            <button
              key={key}
              onClick={() => updateConfig('strategy', key)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                config.strategy === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">{strategyInfo[key].label}</div>
              <div className="text-xs text-gray-500">{strategyInfo[key].desc}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <MapPin className="w-5 h-5 text-green-600" />
          <h3 className="text-base font-semibold text-gray-900">配送范围</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>配送半径</span>
              <span className="text-blue-600">{config.range} km</span>
            </label>
            <input
              type="range"
              min={1}
              max={15}
              step={0.5}
              value={config.range}
              onChange={(e) => updateConfig('range', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1km</span>
              <span>15km</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">最大同时接单数</label>
              <Input
                type="number"
                value={String(config.maxOrders)}
                onChange={(e) => updateConfig('maxOrders', Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoAccept}
                  onChange={(e) => updateConfig('autoAccept', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">自动接单</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <DollarSign className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-semibold text-gray-900">配送费规则</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="起步价（元）"
            type="number"
            value={String(config.baseFee)}
            onChange={(e) => updateConfig('baseFee', Number(e.target.value))}
            prefix={<Truck className="w-4 h-4" />}
          />
          <Input
            label="每公里加价（元/km）"
            type="number"
            value={String(config.distanceFee)}
            onChange={(e) => updateConfig('distanceFee', Number(e.target.value))}
            prefix={<Clock className="w-4 h-4" />}
          />
          <Input
            label="免配送费门槛（元）"
            type="number"
            value={String(config.freeDeliveryThreshold)}
            onChange={(e) => updateConfig('freeDeliveryThreshold', Number(e.target.value))}
          />
        </div>

        <div className="mt-4 bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">配送费示例</h4>
          <div className="space-y-1.5 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>1km 内</span>
              <span className="text-gray-900 font-medium">¥{config.baseFee.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>3km</span>
              <span className="text-gray-900 font-medium">
                ¥{(config.baseFee + config.distanceFee * 2).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>5km</span>
              <span className="text-gray-900 font-medium">
                ¥{(config.baseFee + config.distanceFee * 4).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1.5">
              <span>满 ¥{config.freeDeliveryThreshold} 订单</span>
              <span className="text-green-600 font-medium">免配送费</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
