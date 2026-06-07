import { useEffect } from 'react';
import { BookOpen, Terminal, Copy, Check } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useState } from 'react';

export default function SdkDocs() {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'SDK 文档 - 云瞳视频监控';
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const codeBlocks = {
    login: `POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}`,
    deviceList: `GET /api/devices?page=1&pageSize=20&status=online
Authorization: Bearer <token>`,
    ptz: `POST /api/devices/1/ptz
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "left",
  "speed": 50
}`,
    js: `import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-server.com/api',
  headers: { Authorization: 'Bearer ' + token }
});

// 获取设备列表
const { data } = await api.get('/devices');
console.log('设备列表:', data.list);

// 云台控制
await api.post('/devices/1/ptz', {
  action: 'zoomIn',
  speed: 70
});`
  };

  const menu = [
    { id: 'intro', label: '简介' },
    { id: 'auth', label: '认证授权' },
    { id: 'devices', label: '设备管理' },
    { id: 'preview', label: '实时预览' },
    { id: 'alerts', label: '告警中心' },
    { id: 'recordings', label: '录像检索' },
    { id: 'error', label: '错误码' },
  ];

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="SDK 开发文档"
        subtitle="企业私有化部署 API 接口说明与接入指南"
        breadcrumbs={[{ label: '系统设置' }, { label: 'SDK 文档' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <aside className="lg:col-span-1">
          <div className="vms-card p-4 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-vms-primary" />
              <span className="font-semibold text-white font-mono">文档目录</span>
            </div>
            <nav className="space-y-1">
              {menu.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block px-3 py-2 rounded-lg text-sm text-vms-text-muted hover:bg-vms-surface-2 hover:text-vms-text transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-vms-border/50">
              <div className="text-xs text-vms-text-muted">API 版本</div>
              <div className="text-sm font-mono text-vms-primary">v1.0.0</div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-8">
          <section id="intro" className="vms-card p-6">
            <h2 className="text-xl font-bold text-white font-mono mb-4">简介</h2>
            <p className="text-vms-text leading-relaxed mb-4">
              云瞳视频监控平台提供完整的 RESTful API 接口，支持企业私有化部署与集成。
              通过 API 可以实现设备管理、实时预览、告警接收、录像检索等全部功能。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-vms-surface-2 rounded-lg border border-vms-border">
                <div className="text-vms-primary font-mono text-sm mb-1">协议</div>
                <div className="text-white font-medium">HTTPS / JSON</div>
              </div>
              <div className="p-4 bg-vms-surface-2 rounded-lg border border-vms-border">
                <div className="text-vms-primary font-mono text-sm mb-1">认证方式</div>
                <div className="text-white font-medium">JWT Bearer Token</div>
              </div>
              <div className="p-4 bg-vms-surface-2 rounded-lg border border-vms-border">
                <div className="text-vms-primary font-mono text-sm mb-1">字符编码</div>
                <div className="text-white font-medium">UTF-8</div>
              </div>
            </div>
          </section>

          <section id="auth" className="vms-card p-6">
            <h2 className="text-xl font-bold text-white font-mono mb-4">认证授权</h2>
            <p className="text-vms-text mb-4">
              所有业务接口必须携带 <code className="px-1.5 py-0.5 rounded bg-vms-surface-2 text-vms-primary text-sm">Authorization: Bearer {"<token>"}</code> 请求头。
              Token 通过登录接口获取，有效期 7 天。
            </p>
            <div className="relative">
              <button
                onClick={() => handleCopy(codeBlocks.login, 'login')}
                className="absolute top-2 right-2 p-1.5 rounded hover:bg-vms-surface text-vms-text-muted hover:text-vms-text"
              >
                {copied === 'login' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto text-sm font-mono text-vms-text border border-vms-border">
                {codeBlocks.login}
              </pre>
            </div>
          </section>

          <section id="devices" className="vms-card p-6">
            <h2 className="text-xl font-bold text-white font-mono mb-4">设备管理</h2>
            <p className="text-vms-text mb-4">获取设备列表、设备详情、设备健康状态。</p>
            <div className="relative">
              <button
                onClick={() => handleCopy(codeBlocks.deviceList, 'deviceList')}
                className="absolute top-2 right-2 p-1.5 rounded hover:bg-vms-surface text-vms-text-muted hover:text-vms-text"
              >
                {copied === 'deviceList' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto text-sm font-mono text-vms-text border border-vms-border">
                {codeBlocks.deviceList}
              </pre>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="vms-table text-sm">
                <thead>
                  <tr>
                    <th>参数</th>
                    <th>类型</th>
                    <th>必填</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono">page</td>
                    <td>int</td>
                    <td>否</td>
                    <td>页码，默认 1</td>
                  </tr>
                  <tr>
                    <td className="font-mono">pageSize</td>
                    <td>int</td>
                    <td>否</td>
                    <td>每页数量，默认 20</td>
                  </tr>
                  <tr>
                    <td className="font-mono">status</td>
                    <td>string</td>
                    <td>否</td>
                    <td>online/offline/maintenance</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="preview" className="vms-card p-6">
            <h2 className="text-xl font-bold text-white font-mono mb-4">实时预览与云台控制</h2>
            <p className="text-vms-text mb-4">控制设备云台方向、变焦、聚焦。</p>
            <div className="relative">
              <button
                onClick={() => handleCopy(codeBlocks.ptz, 'ptz')}
                className="absolute top-2 right-2 p-1.5 rounded hover:bg-vms-surface text-vms-text-muted hover:text-vms-text"
              >
                {copied === 'ptz' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto text-sm font-mono text-vms-text border border-vms-border">
                {codeBlocks.ptz}
              </pre>
            </div>
          </section>

          <section id="alerts" className="vms-card p-6">
            <h2 className="text-xl font-bold text-white font-mono mb-4">告警中心</h2>
            <p className="text-vms-text mb-4">获取告警事件列表、确认告警、配置告警规则。</p>
            <ul className="space-y-2 text-sm text-vms-text">
              <li><code className="font-mono text-vms-primary">GET /api/alerts</code> - 获取告警列表</li>
              <li><code className="font-mono text-vms-primary">PUT /api/alerts/:id/acknowledge</code> - 确认告警</li>
              <li><code className="font-mono text-vms-primary">GET /api/alerts/rules</code> - 获取告警规则</li>
              <li><code className="font-mono text-vms-primary">POST /api/alerts/rules</code> - 创建告警规则</li>
            </ul>
          </section>

          <section id="recordings" className="vms-card p-6">
            <h2 className="text-xl font-bold text-white font-mono mb-4">录像检索</h2>
            <p className="text-vms-text mb-4">按时间范围、设备、AI 标签检索录像片段。</p>
            <div className="relative">
              <button
                onClick={() => handleCopy(codeBlocks.js, 'js')}
                className="absolute top-2 right-2 p-1.5 rounded hover:bg-vms-surface text-vms-text-muted hover:text-vms-text"
              >
                {copied === 'js' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto text-sm font-mono text-vms-text border border-vms-border">
                {codeBlocks.js}
              </pre>
            </div>
          </section>

          <section id="error" className="vms-card p-6">
            <h2 className="text-xl font-bold text-white font-mono mb-4">错误码说明</h2>
            <div className="overflow-x-auto">
              <table className="vms-table text-sm">
                <thead>
                  <tr>
                    <th>HTTP 状态码</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono text-emerald-400">200</td>
                    <td>请求成功</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-amber-400">400</td>
                    <td>请求参数错误</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-amber-400">401</td>
                    <td>未授权或 Token 过期</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-amber-400">403</td>
                    <td>权限不足</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-amber-400">404</td>
                    <td>资源不存在</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-red-400">500</td>
                    <td>服务器内部错误</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
