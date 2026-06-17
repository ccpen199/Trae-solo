import { useState } from 'react'
import { Store, FileText, User, MapPin, Phone, CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { ORDER_CATEGORIES } from '../../constants'
import type { OrderCategory } from '../../types'

interface RegisterForm {
  shopName: string
  category: OrderCategory | ''
  licenseNo: string
  legalPerson: string
  idCard: string
  address: string
  phone: string
}

const emptyForm: RegisterForm = {
  shopName: '',
  category: '',
  licenseNo: '',
  legalPerson: '',
  idCard: '',
  address: '',
  phone: '',
}

export default function MerchantRegister() {
  const [form, setForm] = useState<RegisterForm>(emptyForm)
  const [submitted, setSubmitted] = useState(false)

  const updateField = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    if (!form.shopName || !form.category || !form.licenseNo || !form.legalPerson || !form.idCard || !form.address || !form.phone) {
      return
    }
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
          <p className="text-gray-500 mb-6">您的商户入驻申请已提交，我们将在1-3个工作日内完成审核。</p>
          <Button onClick={() => setSubmitted(false)}>返回</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">商户入驻申请</h1>
          <p className="text-gray-500 mt-1">填写以下信息，提交审核后即可开通店铺</p>
        </div>

        <Card>
          <div className="space-y-5">
            <Input
              label="店铺名称"
              value={form.shopName}
              onChange={(e) => updateField('shopName', e.target.value)}
              placeholder="请输入店铺名称"
              prefix={<Store className="w-4 h-4" />}
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">经营类目</label>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value as OrderCategory)}
                className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择经营类目</option>
                {ORDER_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
            </div>

            <Input
              label="营业执照号"
              value={form.licenseNo}
              onChange={(e) => updateField('licenseNo', e.target.value)}
              placeholder="请输入统一社会信用代码"
              prefix={<FileText className="w-4 h-4" />}
            />

            <Input
              label="法人姓名"
              value={form.legalPerson}
              onChange={(e) => updateField('legalPerson', e.target.value)}
              placeholder="请输入法人姓名"
              prefix={<User className="w-4 h-4" />}
            />

            <Input
              label="法人身份证号"
              value={form.idCard}
              onChange={(e) => updateField('idCard', e.target.value)}
              placeholder="请输入18位身份证号"
            />

            <Input
              label="经营地址"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="请输入详细经营地址"
              prefix={<MapPin className="w-4 h-4" />}
            />

            <Input
              label="联系电话"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="请输入联系电话"
              prefix={<Phone className="w-4 h-4" />}
              type="tel"
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
