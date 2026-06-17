import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car,
  Plus,
  Upload,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  FileText,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

interface Vehicle {
  id: string
  plateNumber: string
  vehicleType: string
  capacity: string
  volume: string
  verified: boolean
  images: string[]
}

interface CertItem {
  name: string
  status: 'verified' | 'pending' | 'expired'
  expireDate?: string
  daysLeft?: number
}

const myVehicles: Vehicle[] = [
  {
    id: '1',
    plateNumber: '京A·88888',
    vehicleType: '4.2米厢式货车',
    capacity: '3吨',
    volume: '18立方',
    verified: true,
    images: [],
  },
  {
    id: '2',
    plateNumber: '京B·66666',
    vehicleType: '6.8米厢式货车',
    capacity: '8吨',
    volume: '38立方',
    verified: false,
    images: [],
  },
]

const certificates: CertItem[] = [
  { name: '驾驶证', status: 'verified', expireDate: '2028-06-15', daysLeft: 730 },
  { name: '行驶证', status: 'verified', expireDate: '2026-08-20', daysLeft: 66 },
  { name: '交强险', status: 'verified', expireDate: '2025-09-01', daysLeft: 78 },
  { name: '商业险', status: 'expired', expireDate: '2025-05-10', daysLeft: -36 },
  { name: '营运证', status: 'pending', expireDate: undefined },
  { name: '从业资格证', status: 'verified', expireDate: '2027-03-10', daysLeft: 633 },
]

const statusConfig: Record<CertItem['status'], { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }> = {
  verified: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-50', label: '已核验' },
  pending: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-50', label: '审核中' },
  expired: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50', label: '已过期' },
}

export default function DriverVehicles() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('1')

  const selectedVehicle = myVehicles.find((v) => v.id === selectedVehicleId)

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-lg px-4 pt-2 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-orange-500" />
            车辆管理
          </h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-base font-bold text-gray-900 mb-3">我的车辆</h2>
          <div className="space-y-3">
            {myVehicles.map((vehicle, index) => {
              const isSelected = vehicle.id === selectedVehicleId
              const StatusIcon = vehicle.verified ? ShieldCheck : Clock
              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    hover
                    className={`!p-0 overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-orange-400 shadow-lg shadow-orange-500/10' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            vehicle.verified
                              ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg'
                              : 'bg-gray-200'
                          }`}>
                            <Car className={`w-6 h-6 ${vehicle.verified ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 tracking-wide">
                              {vehicle.plateNumber}
                            </h3>
                            <p className="text-xs text-gray-500">{vehicle.vehicleType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <StatusIcon
                            className={`w-4 h-4 ${vehicle.verified ? 'text-green-500' : 'text-amber-500'}`}
                          />
                          <span className={`text-xs font-medium ${vehicle.verified ? 'text-green-600' : 'text-amber-600'}`}>
                            {vehicle.verified ? '已认证' : '审核中'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-gray-500">载重</p>
                          <p className="text-sm font-bold text-gray-900">{vehicle.capacity}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-gray-500">容积</p>
                          <p className="text-sm font-bold text-gray-900">{vehicle.volume}</p>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="px-4 pb-4 flex gap-2 border-t border-gray-50 pt-3">
                        <Button size="sm" variant="secondary" fullWidth>
                          编辑信息
                        </Button>
                        <Button size="sm" variant="primary" className="!bg-orange-600 hover:!bg-orange-700" fullWidth>
                          <Upload className="w-4 h-4" />
                          上传照片
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              证件核验
            </h2>
            <Tag
              color={certificates.some((c) => c.status === 'expired') ? 'red' : 'green'}
              size="sm"
            >
              {certificates.filter((c) => c.status === 'verified').length}/{certificates.length} 已核验
            </Tag>
          </div>

          {certificates.some((c) => c.status === 'expired') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-3 flex items-start gap-2 bg-red-50 rounded-xl p-3 border border-red-100"
            >
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-700">
                <span className="font-bold">证件过期提醒：</span>
                您的商业险已过期 36 天，请及时续保避免影响接单。
              </div>
            </motion.div>
          )}

          <Card className="!p-0">
            {certificates.map((cert, index) => {
              const config = statusConfig[cert.status]
              const Icon = config.icon
              const isExpiringSoon = cert.daysLeft !== undefined && cert.daysLeft > 0 && cert.daysLeft <= 90
              return (
                <div
                  key={cert.name}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    index < certificates.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                      {isExpiringSoon && (
                        <Tag color="yellow" size="sm">
                          剩余{cert.daysLeft}天
                        </Tag>
                      )}
                    </div>
                    {cert.expireDate && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        有效期至 {cert.expireDate}
                      </p>
                    )}
                    {cert.status === 'pending' && (
                      <p className="text-xs text-amber-600 mt-0.5">审核中，预计 1-3 个工作日</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    {cert.status !== 'verified' && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 ml-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </div>
                </div>
              )
            })}
          </Card>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full"
        >
          <Card className="!py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">添加新车辆</p>
                <p className="text-xs text-gray-500">上传车辆信息和证件</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Card>
        </motion.button>
      </div>
    </div>
  )
}
