import { useUserStore } from '@/store/user'
import {
  Eye, Type, Volume2, Users, X, Info, Phone, Lock
} from 'lucide-react'

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default function Settings() {
  const { elderlyMode, toggleElderlyMode, voiceNav, toggleVoiceNav, fontScale, setFontScale, user, setUser } = useUserStore()

  const removeProxy = (id: string) => {
    if (!user) return
    setUser({
      ...user,
      relatives: user.relatives.filter((r) => r.id !== id),
    })
  }

  const authorizedRelatives = user?.relatives.filter((r) => r.authorized) || []

  return (
    <div className="max-w-lg mx-auto animate-fadeIn space-y-4">
      <h1 className="text-xl font-bold text-text-dark">设置</h1>

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-text-dark">老年人模式</p>
              <p className="text-xs text-text-muted">开启后将放大字体、简化界面</p>
            </div>
          </div>
          <Toggle checked={elderlyMode} onChange={toggleElderlyMode} />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-3 mb-3">
            <Type className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-text-dark">字体大小</p>
            <span className="ml-auto text-sm text-primary font-medium">{fontScale.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="1.5"
            step="0.1"
            value={fontScale}
            onChange={(e) => setFontScale(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-gray-200 accent-primary"
          />
          <div
            className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-text-dark transition-all"
            style={{ fontSize: `${fontScale}rem` }}
          >
            预览文字：政务服务，让生活更便捷
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-text-dark">语音导航</p>
              <p className="text-xs text-text-muted">开启后将语音播报操作指引</p>
            </div>
          </div>
          <Toggle checked={voiceNav} onChange={toggleVoiceNav} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <p className="text-sm font-medium text-text-dark">代办管理</p>
        </div>
        {authorizedRelatives.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">暂无已授权代办人</p>
        ) : (
          <div className="space-y-3">
            {authorizedRelatives.map((rel) => (
              <div key={rel.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{rel.name}</p>
                  <p className="text-xs text-text-muted">{rel.relation} · {rel.idCardMasked}</p>
                </div>
                <button
                  onClick={() => removeProxy(rel.id)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                >
                  <X className="w-3 h-3" /> 取消授权
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <Info className="w-5 h-5 text-primary" />
          <p className="text-sm font-medium text-text-dark">关于</p>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-text-muted">版本号</span>
          <span className="text-sm font-medium">v1.0.0</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-text-muted">客服电话</span>
          <a href="tel:12345" className="text-sm text-primary font-medium flex items-center gap-1">
            <Phone className="w-3 h-3" /> 12345
          </a>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-text-muted">隐私政策</span>
          <a href="/privacy" className="text-sm text-primary font-medium flex items-center gap-1">
            <Lock className="w-3 h-3" /> 查看
          </a>
        </div>
      </div>
    </div>
  )
}
