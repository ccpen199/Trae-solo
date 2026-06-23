import * as React from 'react'
import { Settings, Save, DollarSign, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'

export default function AdminSettings() {
  const [settings, setSettings] = React.useState({
    monthlyPrice: '29',
    yearlyPrice: '199',
    lifetimePrice: '599',
    defaultNameCount: '12',
    maxNameLength: '4',
    minNameScore: '60',
  })
  const [saving, setSaving] = React.useState(false)

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // 模拟保存
      await new Promise((resolve) => setTimeout(resolve, 800))
      alert('设置保存成功')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-50 mb-1">系统设置</h1>
        <p className="text-sm text-jade-300">配置平台运营参数和规则</p>
      </div>

      <Card className="bg-ink-800/50 border-jade-900/50">
        <CardHeader>
          <CardTitle className="text-ink-50 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gold-400" />
            会员价格配置
          </CardTitle>
          <CardDescription className="text-jade-300">设置不同会员套餐的价格</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="月度会员价格（元）"
                value={settings.monthlyPrice}
                onChange={(e) => handleChange('monthlyPrice', e.target.value)}
                className="[&_input]:bg-ink-900/50 [&_input]:text-ink-50 [&_input]:placeholder:text-jade-400 [&_input]:border-b-jade-700 [&_input]:focus:border-b-gold-500 [&_label]:text-jade-200"
              />
            </div>
            <div>
              <Input
                label="年度会员价格（元）"
                value={settings.yearlyPrice}
                onChange={(e) => handleChange('yearlyPrice', e.target.value)}
                className="[&_input]:bg-ink-900/50 [&_input]:text-ink-50 [&_input]:placeholder:text-jade-400 [&_input]:border-b-jade-700 [&_input]:focus:border-b-gold-500 [&_label]:text-jade-200"
              />
            </div>
            <div>
              <Input
                label="终身会员价格（元）"
                value={settings.lifetimePrice}
                onChange={(e) => handleChange('lifetimePrice', e.target.value)}
                className="[&_input]:bg-ink-900/50 [&_input]:text-ink-50 [&_input]:placeholder:text-jade-400 [&_input]:border-b-jade-700 [&_input]:focus:border-b-gold-500 [&_label]:text-jade-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-ink-800/50 border-jade-900/50">
        <CardHeader>
          <CardTitle className="text-ink-50 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-jade-400" />
            起名参数配置
          </CardTitle>
          <CardDescription className="text-jade-300">配置起名引擎的默认参数</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="默认生成名字数量"
                value={settings.defaultNameCount}
                onChange={(e) => handleChange('defaultNameCount', e.target.value)}
                className="[&_input]:bg-ink-900/50 [&_input]:text-ink-50 [&_input]:placeholder:text-jade-400 [&_input]:border-b-jade-700 [&_input]:focus:border-b-gold-500 [&_label]:text-jade-200"
              />
            </div>
            <div>
              <Input
                label="名字最大字数"
                value={settings.maxNameLength}
                onChange={(e) => handleChange('maxNameLength', e.target.value)}
                className="[&_input]:bg-ink-900/50 [&_input]:text-ink-50 [&_input]:placeholder:text-jade-400 [&_input]:border-b-jade-700 [&_input]:focus:border-b-gold-500 [&_label]:text-jade-200"
              />
            </div>
            <div>
              <Input
                label="最低名字评分门槛"
                value={settings.minNameScore}
                onChange={(e) => handleChange('minNameScore', e.target.value)}
                className="[&_input]:bg-ink-900/50 [&_input]:text-ink-50 [&_input]:placeholder:text-jade-400 [&_input]:border-b-jade-700 [&_input]:focus:border-b-gold-500 [&_label]:text-jade-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          loading={saving}
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          保存设置
        </Button>
      </div>
    </div>
  )
}
