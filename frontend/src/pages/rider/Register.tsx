import { useState } from 'react'
import { Bike, User, CreditCard, MapPin, CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

type VehicleType = 'ebike' | 'motorcycle' | 'car'

interface RiderRegisterForm {
  name: string
  idCard: string
  vehicleType: VehicleType
  plateNumber: string
  serviceArea: string
}

const vehicleOptions: { key: VehicleType; label: string }[] = [
  { key: 'ebike', label: '电动车' },
  { key: 'motorcycle', label: '摩托车' },
  { key: 'car', label: '汽车' },
]

const emptyForm: RiderRegisterForm = {
  name: '',
  idCard: '',
  vehicleType: 'ebike',
  plateNumber: '',
  serviceArea: '',
}

export default function RiderRegister() {
  const [form, setForm] = useState<RiderRegisterForm>(emptyForm)
  const [submitted, setSubmitted] = useState(false)

  const updateField = <K extends keyof RiderRegisterForm>(key: K, value: RiderRegisterForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    if (!form.name || !form.idCard || !form.plateNumber || !form.serviceArea) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">申请已提交</h2>
          <p className="text-gray-500 mb-6">您的骑手入驻申请已提交，我们将在1-3个工作日内完成审核。</p>
          <Button onClick={() => setSubmitted(false)}>返回</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-3">
            <Bike className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">骑手入驻申请</h1>
          <p className="text-gray-500 mt-1">填写以下信息，提交审核后即可开始接单</p>
        </div>

        <Card>
          <div className="space-y-5">
            <Input
              label="姓名"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="请输入真实姓名"
              prefix={<User className="w-4 h-4" />}
            />

            <Input
              label="身份证号"
              value={form.idCard}
              onChange={(e) => updateField('idCard', e.target.value)}
              placeholder="请输入18位身份证号"
              prefix={<CreditCard className="w-4 h-4" />}
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">车辆类型</label>
              <div className="grid grid-cols-3 gap-2">
                {vehicleOptions.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => updateField('vehicleType', v.key)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.vehicleType === v.key
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-100 text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="车牌号"
              value={form.plateNumber}
              onChange={(e) => updateField('plateNumber', e.target.value)}
              placeholder="请输入车牌号"
            />

            <Input
              label="服务区域"
              value={form.serviceArea}
              onChange={(e) => updateField('serviceArea', e.target.value)}
              placeholder="请输入常驻服务区域"
              prefix={<MapPin className="w-4 h-4" />}
            />

            <div className="pt-2">
              <Button fullWidth size="lg" onClick={handleSubmit}>
                提交审核
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
