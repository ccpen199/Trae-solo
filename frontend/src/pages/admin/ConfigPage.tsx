import { useState, useEffect } from 'react'
import { Settings, Save } from 'lucide-react'
import { admin } from '../../api'

export default function ConfigPage() {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const res: any = await admin.getSystemConfigs()
      setConfigs(Array.isArray(res) ? res : [])
    } catch {
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string, value: string) => {
    setSaving(key)
    try {
      await admin.updateSystemConfig(key, { value })
    } catch {
    } finally {
      setSaving(null)
    }
  }

  const handleValueChange = (id: number, newValue: string) => {
    setConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: newValue } : c)),
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings size={24} className="text-primary" />
        <h1 className="font-display text-2xl font-bold text-secondary">系统配置</h1>
      </div>

      {configs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">暂无配置项</div>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <div key={config.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-bold text-secondary">{config.label || config.key}</h3>
                <button
                  onClick={() => handleSave(config.key, config.value)}
                  disabled={saving === config.key}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Save size={12} /> {saving === config.key ? '保存中...' : '保存'}
                </button>
              </div>
              {config.description && (
                <p className="text-sm text-gray-500 mb-3">{config.description}</p>
              )}
              <input
                type="text"
                value={config.value ?? ''}
                onChange={(e) => handleValueChange(config.id, e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
