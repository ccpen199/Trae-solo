import { useState, useEffect } from "react";
import { Watch, Bluetooth, Search, CheckCircle, XCircle, Battery, RefreshCw, Trash2, Wifi, Signal, Shield, FileText, Download, Clock, Database, Zap, Award, Lock, FileCheck, ChevronDown, ChevronUp, Heart, Moon, Activity, Wind, Droplets, User, Calendar, X } from "lucide-react";
import { useHealthStore } from "../store/useHealthStore";
import { api } from "../utils/api";
import { cn } from "../lib/utils";
import type { Device, ScanResult, SleepRecord, ExerciseRecord, VitalRecord } from "../../shared/types";

type BindState = "idle" | "scanning" | "selecting" | "pairing" | "syncing" | "done";

const BIND_STEPS = ["scanning", "selecting", "pairing", "syncing"];
const STEP_LABELS = ["扫描", "选择", "配对", "同步"];

const SUPPORTED_BRANDS = [
  { name: "小米", brand: "Xiaomi", protocol: "BLE/GATT/HRS", models: "Mi Band 7-9, Redmi Band 2" },
  { name: "华为", brand: "Huawei", protocol: "BLE/GATT/HRS", models: "Watch GT3-4, Watch 4 Pro" },
  { name: "Apple", brand: "Apple", protocol: "BLE/GATT/HRS", models: "Watch Series 8-9, Ultra" },
  { name: "通用", brand: "Generic", protocol: "标准 BLE HRS", models: "*" },
];

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("card-bg rounded-2xl p-6 border border-emerald-500/10", className)}>{children}</div>
);

type StatusBadgeVariant = "green" | "blue" | "purple" | "amber";

const StatusBadge = ({ status, variant = "green" }: { status: string; variant?: StatusBadgeVariant }) => {
  const variants = {
    green: "bg-vital-green-500/20 text-vital-green-400 border-vital-green-500/30",
    blue: "bg-deep-sea-300/20 text-deep-sea-200 border-deep-sea-300/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    amber: "bg-warning-amber-500/20 text-warning-amber-500 border-warning-amber-500/30",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border", variants[variant])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status}
    </span>
  );
};

const StatItem = ({ label, value, icon: Icon, iconColor = "text-vital-green-400" }: { label: string; value: string; icon?: React.ElementType; iconColor?: string }) => (
  <div className="flex items-center gap-2">
    {Icon && <Icon className={cn("w-4 h-4", iconColor)} />}
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  </div>
);

const getSignalBars = (s: number) => (s >= -50 ? 4 : s >= -60 ? 3 : s >= -80 ? 2 : 1);

const SignalBars = ({ strength }: { strength: number }) => {
  const bars = getSignalBars(strength);
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={cn("w-1 rounded-sm", i <= bars ? "bg-emerald-400" : "bg-gray-600")} style={{ height: `${i * 25}%` }} />
      ))}
    </div>
  );
};

const BrandIcon = ({ brand }: { brand: string }) => {
  const n = brand.toLowerCase();
  if (n.includes("apple")) return <Watch className="w-6 h-6" />;
  if (n.includes("huawei")) return <Wifi className="w-6 h-6" />;
  if (n.includes("xiaomi")) return <Bluetooth className="w-6 h-6" />;
  return <Watch className="w-6 h-6" />;
};

export default function Devices() {
  const { devices, sleepRecords, exerciseRecords, setSleepRecords, setExerciseRecords, setDevices, addDevice, removeDevice, updateDevice, setLoading } = useHealthStore();
  const [bindState, setBindState] = useState<BindState>("idle");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ScanResult | null>(null);
  const [archiveExpanded, setArchiveExpanded] = useState(false);
  const getLoading = (key: string) => useHealthStore.getState().loading[key];

  useEffect(() => {
    (async () => {
      setLoading("devices", true);
      try {
        setDevices((await api.devices.list()) as Device[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading("devices", false);
      }
    })();
  }, [setDevices, setLoading]);

  useEffect(() => {
    if (archiveExpanded) {
      (async () => {
        try {
          const [sleeps, exercises] = await Promise.all([
            api.health.sleep("30d") as Promise<SleepRecord[]>,
            api.health.exercise("30d") as Promise<ExerciseRecord[]>,
          ]);
          setSleepRecords(sleeps);
          setExerciseRecords(exercises);
        } catch (e) {
          console.error(e);
        }
      })();
    }
  }, [archiveExpanded, setSleepRecords, setExerciseRecords]);

  const handleScan = async () => {
    setBindState("scanning");
    setScanResults([]);
    try {
      setScanResults((await api.devices.scan()) as ScanResult[]);
      setBindState("selecting");
    } catch (e) {
      console.error(e);
      setBindState("idle");
    }
  };

  const handleBind = async (device: ScanResult) => {
    setSelectedDevice(device);
    setBindState("pairing");
    try {
      const bound = (await api.devices.bind({
        brand: device.brand,
        model: device.name,
        name: device.name,
        deviceId: device.deviceId,
      })) as Device;
      addDevice(bound);
      setBindState("syncing");
      const synced = (await api.devices.sync(bound.id)) as Device;
      if (synced) updateDevice(synced);
      setBindState("done");
      setTimeout(() => {
        setBindState("idle");
        setSelectedDevice(null);
      }, 1500);
    } catch (e) {
      console.error(e);
      setBindState("idle");
    }
  };

  const handleUnbind = async (id: string) => {
    setLoading("unbind", true);
    try {
      await api.devices.unbind(id);
      removeDevice(id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading("unbind", false);
    }
  };

  const handleSync = async (id: string) => {
    setLoading(`sync-${id}`, true);
    try {
      updateDevice((await api.devices.sync(id)) as Device);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(`sync-${id}`, false);
    }
  };

  const handleToggleConnection = async (device: Device) => {
    const newStatus = device.connectionStatus === "connected" ? "disconnected" : "connected";
    setLoading(`conn-${device.id}`, true);
    try {
      updateDevice((await api.devices.setConnection(device.id, newStatus)) as Device);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(`conn-${device.id}`, false);
    }
  };

  const getStepStatus = (idx: number) => {
    const currentIdx = BIND_STEPS.indexOf(bindState);
    if (bindState === "done") return "done";
    if (idx < currentIdx) return "done";
    if (idx === currentIdx) return "active";
    return "pending";
  };

  const primaryDevice = devices[0] || null;

  const syncStatusText = {
    idle: "待机中",
    syncing: "同步中",
    completed: "同步成功",
    failed: "同步失败",
  };

  const abstractionStatusText = {
    pending: "待适配",
    adapted: "已适配",
    unsupported: "不支持",
    partial: "部分支持",
  };

  const privacyStatusText = {
    not_processed: "未处理",
    masked: "已脱敏",
    encrypted: "已加密",
    anonymized: "已匿名化",
  };

  const archiveStatusText = {
    not_generated: "未生成",
    generating: "生成中",
    completed: "已生成",
    failed: "生成失败",
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "--";
    const d = new Date(isoString);
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-emerald-400 glow-text">设备管理中心</h1>
        <button onClick={handleScan} disabled={bindState !== "idle"} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50">
          <Search className="w-4 h-4" /> 扫描设备
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-vital-green-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-vital-green-500/20 flex items-center justify-center">
                <Signal className="w-5 h-5 text-vital-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">信号同步结果</h3>
                <p className="text-xs text-gray-500">
                  {primaryDevice ? primaryDevice.name : "暂无设备"}
                </p>
              </div>
            </div>
            <StatusBadge 
              status={primaryDevice ? syncStatusText[primaryDevice.syncStatus] : "无数据"} 
              variant="green" 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatItem 
              label="同步记录" 
              value={primaryDevice?.lastSyncResult ? `${primaryDevice.lastSyncResult.recordsSynced} 条` : "--"} 
              icon={Database} 
              iconColor="text-vital-green-400" 
            />
            <StatItem 
              label="失败数" 
              value={primaryDevice?.lastSyncResult ? `${primaryDevice.lastSyncResult.recordsFailed} 条` : "--"} 
              icon={XCircle} 
              iconColor="text-red-400" 
            />
            <StatItem 
              label="同步耗时" 
              value={primaryDevice?.lastSyncResult ? `${primaryDevice.lastSyncResult.syncDuration}s` : "--"} 
              icon={Clock} 
              iconColor="text-vital-green-400" 
            />
            <StatItem 
              label="完成时间" 
              value={formatTime(primaryDevice?.lastSyncResult?.completedAt)} 
              icon={CheckCircle} 
              iconColor="text-vital-green-400" 
            />
          </div>
        </Card>

        <Card className="border-l-4 border-l-deep-sea-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-deep-sea-300/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-deep-sea-200" />
              </div>
              <div>
                <h3 className="font-semibold text-white">多品牌适配状态</h3>
                <p className="text-xs text-gray-500">协议适配器运行状态</p>
              </div>
            </div>
            <StatusBadge 
              status={primaryDevice ? abstractionStatusText[primaryDevice.abstractionStatus] : "未适配"} 
              variant="blue" 
            />
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(primaryDevice?.supportedFeatures || ["--"]).map((feature) => (
                <span key={feature} className="px-2 py-0.5 text-xs bg-deep-sea-300/10 text-deep-sea-200 rounded-md">
                  {feature}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
              <span className="text-xs text-gray-500">协议版本</span>
              <span className="text-sm font-medium text-deep-sea-200">
                {primaryDevice?.protocolVersion || "--"}
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">脱敏存储标识</h3>
                <p className="text-xs text-gray-500">数据安全与隐私保护</p>
              </div>
            </div>
            <StatusBadge 
              status={primaryDevice ? privacyStatusText[primaryDevice.privacyStatus] : "未处理"} 
              variant="purple" 
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> 加密算法
              </span>
              <span className="text-sm font-medium text-purple-400">AES-256</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Award className="w-3 h-3" /> 脱敏等级
              </span>
              <span className="text-sm font-medium text-purple-400">高级</span>
            </div>
            <div className="pt-2 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 mb-2">符合标准</p>
              <div className="flex flex-wrap gap-1.5">
                {["HIPAA", "GDPR", "等保三级"].map((std) => (
                  <span key={std} className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20">
                    {std}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-warning-amber-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-amber-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-warning-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">标准化健康档案</h3>
                <p className="text-xs text-gray-500">健康档案输出状态</p>
              </div>
            </div>
            <StatusBadge 
              status={primaryDevice ? archiveStatusText[primaryDevice.archiveStatus] : "未生成"} 
              variant="amber" 
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
              <FileCheck className="w-4 h-4 text-warning-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {primaryDevice ? `最近同步数据档案` : "暂无档案"}
                </p>
                <p className="text-xs text-gray-500">
                  {primaryDevice?.lastSyncTime 
                    ? new Date(primaryDevice.lastSyncTime).toLocaleString("zh-CN") 
                    : "--"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">格式:</span>
                {["JSON", "PDF"].map((fmt) => (
                  <span key={fmt} className="text-xs px-1.5 py-0.5 bg-warning-amber-500/10 text-warning-amber-500 rounded">
                    {fmt}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500">移动健康终端规范</span>
            </div>
            <button 
              onClick={() => setArchiveExpanded(!archiveExpanded)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-warning-amber-500/20 text-warning-amber-500 rounded-lg hover:bg-warning-amber-500/30 transition-colors"
            >
              {archiveExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="text-sm font-medium">{archiveExpanded ? "收起档案" : "查看档案详情"}</span>
            </button>
          </div>
        </Card>
      </div>

      {archiveExpanded && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-warning-amber-500" />
              <h3 className="text-lg font-semibold text-white">标准化健康档案 · 符合《移动健康终端设备数据交互规范》</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-vital-green-500/10 text-vital-green-400 rounded border border-vital-green-500/20 flex items-center gap-1">
                <User className="w-3 h-3" /> 张三
              </span>
              <span className="text-xs px-2 py-1 bg-warning-amber-500/10 text-warning-amber-500 rounded border border-warning-amber-500/20 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date().toLocaleDateString("zh-CN")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="p-3 rounded-xl bg-deep-sea-700/50 border border-vital-green-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-alert-red-400" />
                <span className="text-sm font-medium text-deep-sea-100">心率监测</span>
              </div>
              <p className="text-2xl font-din text-alert-red-400">68 <span className="text-sm font-normal text-deep-sea-200/50">BPM</span></p>
              <p className="text-xs text-deep-sea-200/50 mt-1">静息心率正常，窦性心律</p>
            </div>
            <div className="p-3 rounded-xl bg-deep-sea-700/50 border border-vital-green-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-deep-sea-100">血氧饱和度</span>
              </div>
              <p className="text-2xl font-din text-blue-400">97 <span className="text-sm font-normal text-deep-sea-200/50">%</span></p>
              <p className="text-xs text-deep-sea-200/50 mt-1">夜间最低 94%，无低氧事件</p>
            </div>
            <div className="p-3 rounded-xl bg-deep-sea-700/50 border border-vital-green-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-deep-sea-100">睡眠总时长</span>
              </div>
              <p className="text-2xl font-din text-purple-400">
                {sleepRecords.length > 0 ? `${Math.round(sleepRecords[0].totalTime / 60 * 10) / 10}` : "7.3"}
                <span className="text-sm font-normal text-deep-sea-200/50"> 小时</span>
              </p>
              <p className="text-xs text-deep-sea-200/50 mt-1">深睡 {sleepRecords.length > 0 ? Math.round(sleepRecords[0].deepSleep / 60 * 10) / 10 : 1.6}h · REM {sleepRecords.length > 0 ? Math.round(sleepRecords[0].remSleep / 60 * 10) / 10 : 1.4}h</p>
            </div>
            <div className="p-3 rounded-xl bg-deep-sea-700/50 border border-vital-green-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-vital-green-400" />
                <span className="text-sm font-medium text-deep-sea-100">运动记录</span>
              </div>
              <p className="text-2xl font-din text-vital-green-400">
                {exerciseRecords.length} <span className="text-sm font-normal text-deep-sea-200/50">次/30天</span>
              </p>
              <p className="text-xs text-deep-sea-200/50 mt-1">
                总时长 {exerciseRecords.reduce((a, b) => a + b.duration, 0)} 分钟
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <div className="p-4 rounded-xl bg-deep-sea-600/30 border border-deep-sea-400/20">
              <h4 className="text-sm font-semibold text-deep-sea-100 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-vital-green-400" /> 生理指标摘要
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-deep-sea-200/60">静息心率基线</span><span className="text-deep-sea-100">65 BPM</span></div>
                <div className="flex justify-between"><span className="text-deep-sea-200/60">HRV (平均)</span><span className="text-deep-sea-100">55 ms</span></div>
                <div className="flex justify-between"><span className="text-deep-sea-200/60">压力指数 (平均)</span><span className="text-deep-sea-100">32</span></div>
                <div className="flex justify-between"><span className="text-deep-sea-200/60">睡眠质量评分</span><span className="text-deep-sea-100">{sleepRecords.length > 0 ? sleepRecords[0].qualityScore : 78} 分</span></div>
                <div className="flex justify-between"><span className="text-deep-sea-200/60">今日步数</span><span className="text-deep-sea-100">8,432 步</span></div>
                <div className="flex justify-between"><span className="text-deep-sea-200/60">今日卡路里</span><span className="text-deep-sea-100">420 kcal</span></div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-deep-sea-600/30 border border-deep-sea-400/20">
              <h4 className="text-sm font-semibold text-deep-sea-100 mb-3 flex items-center gap-2">
                <Wind className="w-4 h-4 text-warning-amber-500" /> 风险评估
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-deep-sea-200/60">心血管风险</span>
                  <span className="px-2 py-0.5 rounded bg-vital-green-500/10 text-vital-green-400">低</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-deep-sea-200/60">睡眠呼吸暂停风险</span>
                  <span className="px-2 py-0.5 rounded bg-vital-green-500/10 text-vital-green-400">低</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-deep-sea-200/60">压力相关风险</span>
                  <span className="px-2 py-0.5 rounded bg-vital-green-500/10 text-vital-green-400">低</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-deep-sea-200/60">运动不足风险</span>
                  <span className="px-2 py-0.5 rounded bg-warning-amber-500/10 text-warning-amber-500">中</span>
                </div>
              </div>
              <p className="text-xs text-deep-sea-200/40 mt-3 pt-3 border-t border-deep-sea-400/20">
                * 风险评估仅供参考，如有疑虑请咨询专业医生
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-300">本档案已脱敏存储 · AES-256 加密 · 符合 HIPAA/GDPR/等保三级</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs rounded-lg bg-vital-green-500/10 text-vital-green-400 hover:bg-vital-green-500/20 flex items-center gap-1 transition-colors">
                <Download className="w-3.5 h-3.5" /> 导出 JSON
              </button>
              <button className="px-3 py-1.5 text-xs rounded-lg bg-warning-amber-500/10 text-warning-amber-500 hover:bg-warning-amber-500/20 flex items-center gap-1 transition-colors">
                <Download className="w-3.5 h-3.5" /> 导出 PDF
              </button>
              <button onClick={() => { window.location.hash = "#/records"; }} className="px-3 py-1.5 text-xs rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 flex items-center gap-1 transition-colors">
                <Calendar className="w-3.5 h-3.5" /> 预约挂号
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold mb-4 text-white">绑定流程</h2>
        <div className="flex items-center justify-between max-w-2xl">
          {BIND_STEPS.map((_, idx) => {
            const status = getStepStatus(idx);
            return (
              <div key={idx} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", status === "done" && "bg-emerald-500 text-white", status === "active" && "bg-emerald-500/30 text-emerald-400 ring-2 ring-emerald-400/50", status === "pending" && "bg-gray-700 text-gray-400")}>
                    {status === "done" ? <CheckCircle className="w-5 h-5" /> : <span>{idx + 1}</span>}
                  </div>
                  <span className="mt-2 text-sm text-gray-300">{STEP_LABELS[idx]}</span>
                </div>
                {idx < BIND_STEPS.length - 1 && <div className={cn("w-16 h-0.5 mx-2", getStepStatus(idx + 1) !== "pending" ? "bg-emerald-500" : "bg-gray-700")} />}
              </div>
            );
          })}
        </div>
      </Card>

      {bindState !== "idle" && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-white">设备扫描</h2>
          {bindState === "scanning" ? (
            <div className="flex flex-col items-center py-8">
              <div className="radar-container flex items-center justify-center">
                <div className="radar-sweep" />
                <Bluetooth className="w-8 h-8 text-emerald-400 relative z-10" />
              </div>
              <p className="mt-4 text-gray-400">正在扫描附近设备...</p>
            </div>
          ) : scanResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scanResults.map((device) => (
                <div key={device.deviceId} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <BrandIcon brand={device.brand} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{device.name}</h3>
                        <p className="text-sm text-gray-400">{device.brand}</p>
                      </div>
                    </div>
                    <SignalBars strength={device.signalStrength} />
                  </div>
                  <p className="text-xs text-gray-500 mb-3">协议: {device.supportedProtocols.join(", ")}</p>
                  <button onClick={() => handleBind(device)} disabled={bindState !== "selecting"} className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50">
                    {bindState === "pairing" && selectedDevice?.deviceId === device.deviceId ? "配对中..." : "绑定"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">未扫描到设备</p>
          )}
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold mb-4 text-white">已绑定设备 ({devices.length})</h2>
        {devices.length === 0 ? (
          <p className="text-center text-gray-400 py-8">暂无绑定设备</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div key={device.id} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <BrandIcon brand={device.brand} />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{device.name}</h3>
                      <p className="text-sm text-gray-400">{device.brand} {device.model}</p>
                      <p className="text-xs text-gray-500">固件: {device.firmwareVersion}</p>
                    </div>
                  </div>
                  <button onClick={() => handleUnbind(device.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400 flex items-center gap-1"><Battery className="w-4 h-4" /> 电量</span>
                    <span className="text-white">{device.batteryLevel}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className={cn("h-full progress-glow", device.batteryLevel > 20 ? "bg-emerald-500" : "bg-red-500")} style={{ width: `${device.batteryLevel}%` }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleConnection(device)} disabled={getLoading(`conn-${device.id}`)} className={cn("flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm", device.connectionStatus === "connected" ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-gray-700 text-gray-300 hover:bg-gray-600")}>
                    {device.connectionStatus === "connected" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {device.connectionStatus === "connected" ? "已连接" : "连接"}
                  </button>
                  <button onClick={() => handleSync(device.id)} disabled={getLoading(`sync-${device.id}`)} className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50">
                    <RefreshCw className={cn("w-4 h-4", getLoading(`sync-${device.id}`) && "animate-spin")} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4 text-white">支持品牌与协议</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SUPPORTED_BRANDS.map((brand) => (
            <div key={brand.brand} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <BrandIcon brand={brand.brand} />
              </div>
              <h3 className="font-medium text-white mb-1">{brand.name}</h3>
              <p className="text-xs text-gray-400 mb-2">{brand.protocol}</p>
              <p className="text-xs text-gray-500">{brand.models}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
