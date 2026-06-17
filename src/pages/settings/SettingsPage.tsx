import { useState } from "react";
import { motion as m } from "framer-motion";
import {
  Settings, Bell, Shield, Info, Lock, Eye, EyeOff, Camera,
  Monitor, Smartphone, Trash2, ChevronRight, FileText, ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Tabs, TabPanel } from "@/components/ui";
import { cn } from "@/utils";

const tabList = [
  { key: "basic", label: "基本设置", icon: <Settings className="w-4 h-4" /> },
  { key: "notify", label: "通知设置", icon: <Bell className="w-4 h-4" /> },
  { key: "security", label: "安全设置", icon: <Shield className="w-4 h-4" /> },
  { key: "about", label: "关于系统", icon: <Info className="w-4 h-4" /> },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        checked ? "bg-primary-600" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

const mockDevices = [
  { id: "d1", name: "MacBook Pro", location: "上海市浦东新区", lastLogin: "2025-06-17 09:30", icon: Monitor },
  { id: "d2", name: "iPhone 15 Pro", location: "上海市浦东新区", lastLogin: "2025-06-17 08:15", icon: Smartphone },
  { id: "d3", name: "iPad Air", location: "上海市徐汇区", lastLogin: "2025-06-15 19:22", icon: Smartphone },
];

const mockLoginLogs = [
  { time: "2025-06-17 09:30", ip: "116.228.xxx.xxx", device: "MacBook Pro", result: "成功" },
  { time: "2025-06-17 08:15", ip: "116.228.xxx.xxx", device: "iPhone 15 Pro", result: "成功" },
  { time: "2025-06-16 14:22", ip: "180.168.xxx.xxx", device: "MacBook Pro", result: "成功" },
  { time: "2025-06-15 19:22", ip: "101.86.xxx.xxx", device: "iPad Air", result: "成功" },
  { time: "2025-06-14 10:05", ip: "116.228.xxx.xxx", device: "未知设备", result: "失败" },
];

const basicFields = [
  { key: "communityName", label: "小区名称" },
  { key: "address", label: "小区地址" },
  { key: "totalUnits", label: "总住户数" },
  { key: "councilTerm", label: "业委会届数" },
  { key: "propertyPhone", label: "物业联系电话" },
  { key: "servicePhone", label: "物业服务电话" },
];

const notifyItems: { key: keyof typeof defaultNotify; label: string; desc: string }[] = [
  { key: "newMotion", label: "新议案通知", desc: "有新议案提交时通知您" },
  { key: "voteReminder", label: "投票提醒", desc: "投票即将结束时提醒" },
  { key: "approvalReminder", label: "审批提醒", desc: "有待审批事项时提醒" },
  { key: "ticketReminder", label: "工单提醒", desc: "有新工单提交时提醒" },
  { key: "financeNotify", label: "财务通知", desc: "财务收支变动时通知" },
  { key: "streetInstruction", label: "街道指令通知", desc: "收到街道指令时通知" },
];

const defaultNotify = {
  newMotion: true, voteReminder: true, approvalReminder: true,
  ticketReminder: false, financeNotify: true, streetInstruction: true,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("basic");
  const [basicForm, setBasicForm] = useState({
    communityName: "阳光花园小区", address: "上海市浦东新区阳光路888号",
    totalUnits: "1200", councilTerm: "3",
    propertyPhone: "021-5888-6666", servicePhone: "400-888-9999",
  });
  const [notifySettings, setNotifySettings] = useState(defaultNotify);
  const [pwdForm, setPwdForm] = useState({ current: "", newPwd: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });

  const pwdLabels = { current: "当前密码", newPwd: "新密码", confirm: "确认密码" };

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">系统设置</h2>
      <Tabs tabs={tabList} activeTab={activeTab} onChange={setActiveTab} variant="line">
        {/* 基本设置 */}
        <TabPanel tabKey="basic" activeKey={activeTab}>
          <Card>
            <CardHeader><CardTitle>基本设置</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {basicFields.map((field) => (
                <div key={field.key}>
                  <label className="text-sm text-slate-500 mb-1 block">{field.label}</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={basicForm[field.key as keyof typeof basicForm]}
                    onChange={(e) => setBasicForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
              <Button variant="primary" size="sm">保存设置</Button>
            </CardContent>
          </Card>
        </TabPanel>

        {/* 通知设置 */}
        <TabPanel tabKey="notify" activeKey={activeTab}>
          <Card>
            <CardHeader><CardTitle>通知设置</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              {notifyItems.map((item, idx) => (
                <div key={item.key} className={cn("flex items-center justify-between py-4", idx < 5 && "border-b border-slate-100")}>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle checked={notifySettings[item.key]} onChange={(v) => setNotifySettings((s) => ({ ...s, [item.key]: v }))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabPanel>

        {/* 安全设置 */}
        <TabPanel tabKey="security" activeKey={activeTab}>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>修改密码</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {(["current", "newPwd", "confirm"] as const).map((field) => (
                  <div key={field}>
                    <label className="text-sm text-slate-500 mb-1 block">{pwdLabels[field]}</label>
                    <div className="relative">
                      <input
                        type={showPwd[field] ? "text" : "password"}
                        className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={pwdForm[field]}
                        onChange={(e) => setPwdForm((f) => ({ ...f, [field]: e.target.value }))}
                      />
                      <button type="button" onClick={() => setShowPwd((s) => ({ ...s, [field]: !s[field] }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPwd[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <Button variant="primary" size="sm" leftIcon={<Lock className="w-4 h-4" />}>修改密码</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>人脸认证</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="success" dot>已认证</Badge>
                  <span className="text-sm text-slate-500">认证时间：2025-01-15</span>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Camera className="w-4 h-4" />}>重新认证</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>登录设备管理</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {mockDevices.map((device) => {
                  const Icon = device.icon;
                  return (
                    <div key={device.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Icon className="w-4 h-4 text-slate-600" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{device.name}</p>
                          <p className="text-xs text-slate-400">{device.location} · {device.lastLogin}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />} className="text-rose-500 hover:text-rose-600">移除</Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>登录日志</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 text-slate-500 font-medium">时间</th>
                      <th className="text-left py-2 text-slate-500 font-medium">IP</th>
                      <th className="text-left py-2 text-slate-500 font-medium">设备</th>
                      <th className="text-left py-2 text-slate-500 font-medium">结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLoginLogs.map((log, idx) => (
                      <tr key={idx} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 text-slate-700">{log.time}</td>
                        <td className="py-2 text-slate-700 font-mono text-xs">{log.ip}</td>
                        <td className="py-2 text-slate-700">{log.device}</td>
                        <td className="py-2"><Badge variant={log.result === "成功" ? "success" : "danger"} size="sm">{log.result}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        {/* 关于系统 */}
        <TabPanel tabKey="about" activeKey={activeTab}>
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-500/20">治</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">业委会数字化治理系统</h3>
                  <p className="text-sm text-slate-500">版本 v1.0.0</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-4">
                {[
                  { label: "系统版本", value: "v1.0.0", link: false },
                  { label: "技术支持", value: "support@community-gov.cn", link: false },
                  { label: "用户协议", value: "查看协议", link: true, icon: <FileText className="w-3.5 h-3.5" /> },
                  { label: "隐私政策", value: "查看政策", link: true, icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{item.label}</span>
                    {item.link ? (
                      <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">{item.icon}{item.value}<ChevronRight className="w-3.5 h-3.5" /></button>
                    ) : (
                      <span className="text-sm font-medium text-slate-700">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400 text-center">© 2025 业委会数字化治理平台 · 基于区块链存证技术</p>
              </div>
            </CardContent>
          </Card>
        </TabPanel>
      </Tabs>
    </m.div>
  );
}
