import { useState } from "react";
import { DollarSign, Navigation, MapPin, CheckCircle, Truck, ArrowRight, AlertTriangle, ScanLine, PenLine, ChevronRight } from "lucide-react";

type Priority = "high" | "medium" | "low";
type StepLabel = "接取任务" | "前往货架拣货" | "确认取货" | "开始配送" | "送达确认";

const steps: StepLabel[] = ["接取任务", "前往货架拣货", "确认取货", "开始配送", "送达确认"];

const taskPool = [
  { id: "T2001", items: "清风抽纸×2, 洗衣液×1", address: "桃李苑3号楼502", priority: "high" as Priority, fee: 6, pickList: ["C区-01号架 ×2", "C区-03号架 ×1"] },
  { id: "T2002", items: "元气森林×4, 薯片×1", address: "银杏苑1号楼203", priority: "medium" as Priority, fee: 5, pickList: ["B区-02号架 ×4", "A区-03号架 ×1"] },
  { id: "T2003", items: "中性笔×5, 笔记本×2", address: "梅园宿舍108", priority: "low" as Priority, fee: 4, pickList: ["D区-01号架 ×5", "D区-03号架 ×2"] },
  { id: "T2004", items: "坚果×1, 咖啡×2", address: "竹园7号楼415", priority: "high" as Priority, fee: 7, pickList: ["A区-09号架 ×1", "B区-06号架 ×2"] },
  { id: "T2005", items: "牙膏×1, 抽纸×1", address: "松园2号楼310", priority: "medium" as Priority, fee: 5, pickList: ["C区-05号架 ×1", "C区-01号架 ×1"] },
];

const activeTasks = [
  { id: "T1998", items: "乐事薯片×3, 辣条×2", address: "桃李苑6号楼301", route: ["超市A区", "桃李苑6号楼"], pickList: ["A区-03号架 ×3", "A区-05号架 ×2"] },
  { id: "T1999", items: "矿泉水×6, 酸奶×2", address: "银杏苑3号楼518", route: ["超市B区", "银杏苑3号楼"], pickList: ["B区-01号架 ×6", "B区-05号架 ×2"] },
];

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: "紧急", color: "text-[#E63946]", bg: "bg-[#E63946]/10" },
  medium: { label: "普通", color: "text-[#FF6B35]", bg: "bg-[#FF6B35]/10" },
  low: { label: "宽松", color: "text-[#2EC4B6]", bg: "bg-[#2EC4B6]/10" },
};

export default function StoreDeliverer() {
  const [pickedTasks, setPickedTasks] = useState<string[]>([]);
  const [acceptedSteps, setAcceptedSteps] = useState<Record<string, number>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean[]>>({});
  const [showDelivery, setShowDelivery] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [signed, setSigned] = useState(false);

  const handlePick = (id: string) => {
    if (!pickedTasks.includes(id)) {
      setPickedTasks([...pickedTasks, id]);
      setAcceptedSteps((prev) => ({ ...prev, [id]: 0 }));
      const task = taskPool.find((t) => t.id === id);
      if (task) setCheckedItems((prev) => ({ ...prev, [id]: task.pickList.map(() => false) }));
    }
  };

  const advanceStep = (id: string) => {
    setAcceptedSteps((prev) => {
      const cur = prev[id] ?? 0;
      if (cur < steps.length - 1) return { ...prev, [id]: cur + 1 };
      return prev;
    });
  };

  const toggleCheck = (taskId: string, idx: number) => {
    setCheckedItems((prev) => {
      const arr = [...(prev[taskId] || [])];
      arr[idx] = !arr[idx];
      return { ...prev, [taskId]: arr };
    });
  };

  const allChecked = (taskId: string) => (checkedItems[taskId] || []).every(Boolean);

  const startDeliveryConfirm = (id: string) => {
    setShowDelivery(id);
    setScanned(false);
    setSigned(false);
  };

  const confirmDelivery = (id: string) => {
    setAcceptedSteps((prev) => ({ ...prev, [id]: 4 }));
    setShowDelivery(null);
  };

  const acceptedFromPool = pickedTasks.filter((id) => (acceptedSteps[id] ?? 0) < 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#1B3A5C] to-[#2EC4B6] px-4 pt-4 pb-8">
        <h1 className="text-white text-lg font-bold mb-4">筋斗云配送员工作台</h1>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <CheckCircle className="w-5 h-5 text-[#2EC4B6] mx-auto mb-1" />
            <p className="text-white text-xl font-bold">18</p>
            <p className="text-white/80 text-xs">今日完成</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <Truck className="w-5 h-5 text-[#FFC857] mx-auto mb-1" />
            <p className="text-white text-xl font-bold">{2 + acceptedFromPool.length}</p>
            <p className="text-white/80 text-xs">进行中</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <DollarSign className="w-5 h-5 text-[#FF6B35] mx-auto mb-1" />
            <p className="text-white text-xl font-bold">¥86</p>
            <p className="text-white/80 text-xs">今日收入</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-md mb-4">
          <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">当前任务</h2>
          {activeTasks.map((task) => (
            <div key={task.id} className="border border-gray-100 rounded-xl p-3 mb-2 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{task.id}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#2EC4B6]/10 text-[#2EC4B6]">配送中</span>
              </div>
              <p className="text-sm text-[#1B3A5C] font-medium mb-1">{task.items}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <MapPin className="w-3 h-3" />
                <span>{task.address}</span>
              </div>
              <div className="bg-[#1B3A5C]/5 rounded-lg p-2">
                <div className="flex items-center gap-2 text-xs">
                  {task.route.map((point, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-[#FF6B35] text-white" : "bg-[#2EC4B6] text-white"}`}>
                        {i === 0 ? "起" : "终"}
                      </span>
                      <span className="text-[#1B3A5C]">{point}</span>
                      {i < task.route.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <p className="text-[10px] text-gray-400 mb-1.5">拣货清单</p>
                {task.pickList.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <button onClick={() => {
                      const key = `active-${task.id}`;
                      setCheckedItems((prev) => {
                        const arr = [...(prev[key] || task.pickList.map(() => true))];
                        arr[i] = !arr[i];
                        return { ...prev, [key]: arr };
                      });
                    }} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${((checkedItems[`active-${task.id}`] || task.pickList.map(() => true))[i]) ? "bg-[#2EC4B6] border-[#2EC4B6]" : "border-gray-300 bg-white"}`}>
                      {((checkedItems[`active-${task.id}`] || task.pickList.map(() => true))[i]) && <CheckCircle className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`text-xs ${((checkedItems[`active-${task.id}`] || task.pickList.map(() => true))[i]) ? "text-gray-400 line-through" : "text-[#1B3A5C]"}`}>{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => startDeliveryConfirm(task.id)} className="flex-1 py-2 bg-[#2EC4B6] text-white text-xs font-medium rounded-lg hover:bg-[#28b0a3] transition flex items-center justify-center gap-1">
                  <Navigation className="w-3 h-3" /> 确认送达
                </button>
              </div>
            </div>
          ))}
        </div>

        {acceptedFromPool.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-md mb-4">
            <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">已接单待取货</h2>
            {acceptedFromPool.map((id) => {
              const task = taskPool.find((t) => t.id === id);
              if (!task) return null;
              const step = acceptedSteps[id] ?? 0;
              const items = checkedItems[id] || task.pickList.map(() => false);
              return (
                <div key={id} className="border border-gray-100 rounded-xl p-3 mb-2 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{id}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${step < 2 ? "bg-[#FFC857]/10 text-[#FFC857]" : step < 4 ? "bg-[#2EC4B6]/10 text-[#2EC4B6]" : "bg-green-50 text-green-600"}`}>
                      {steps[step]}
                    </span>
                  </div>
                  <p className="text-sm text-[#1B3A5C] font-medium mb-1">{task.items}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{task.address}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {steps.map((_, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition ${i <= step ? "bg-[#2EC4B6] text-white" : "bg-gray-100 text-gray-400"}`}>
                          {i < step ? "✓" : i + 1}
                        </span>
                        {i < steps.length - 1 && <div className={`w-3 h-0.5 ${i < step ? "bg-[#2EC4B6]" : "bg-gray-200"}`} />}
                      </span>
                    ))}
                  </div>
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 mb-1.5">拣货清单</p>
                    {task.pickList.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <button onClick={() => toggleCheck(id, i)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${items[i] ? "bg-[#2EC4B6] border-[#2EC4B6]" : "border-gray-300 bg-white"}`}>
                          {items[i] && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                        <span className={`text-xs ${items[i] ? "text-gray-400 line-through" : "text-[#1B3A5C]"}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {step === 0 && (
                      <button onClick={() => advanceStep(id)} className="flex-1 py-2 bg-[#FF6B35] text-white text-xs font-medium rounded-lg hover:bg-[#e55e2e] transition flex items-center justify-center gap-1">
                        前往货架拣货 <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    {step === 1 && (
                      <button onClick={() => { if (allChecked(id)) advanceStep(id); }} disabled={!allChecked(id)} className={`flex-1 py-2 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-1 ${allChecked(id) ? "bg-[#FF6B35] hover:bg-[#e55e2e]" : "bg-gray-300 cursor-not-allowed"}`}>
                        确认取货 <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    {step === 2 && (
                      <button onClick={() => advanceStep(id)} className="flex-1 py-2 bg-[#2EC4B6] text-white text-xs font-medium rounded-lg hover:bg-[#28b0a3] transition flex items-center justify-center gap-1">
                        开始配送 <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    {step === 3 && (
                      <button onClick={() => startDeliveryConfirm(id)} className="flex-1 py-2 bg-[#1B3A5C] text-white text-xs font-medium rounded-lg hover:bg-[#142d48] transition flex items-center justify-center gap-1">
                        <ScanLine className="w-3 h-3" /> 送达确认
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">任务大厅</h2>
          {taskPool.map((task) => {
            const cfg = priorityConfig[task.priority];
            const isPicked = pickedTasks.includes(task.id);
            return (
              <div key={task.id} className={`border rounded-xl p-3 mb-2 last:mb-0 transition-all ${isPicked ? "border-[#2EC4B6]/30 bg-[#2EC4B6]/5" : "border-gray-100"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{task.id}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <span className="text-sm font-bold text-[#FF6B35]">+¥{task.fee}</span>
                </div>
                <p className="text-sm text-[#1B3A5C] font-medium">{task.items}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{task.address}</span>
                  </div>
                  {isPicked ? (
                    <span className="text-xs text-[#2EC4B6] flex items-center gap-0.5 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> 已接取
                    </span>
                  ) : (
                    <button onClick={() => handlePick(task.id)} className="text-xs bg-[#1B3A5C] text-white px-3 py-1 rounded-full hover:bg-[#142d48] transition">
                      接取
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">路线总览</h2>
          <div className="h-28 bg-gradient-to-br from-[#1B3A5C]/5 to-[#2EC4B6]/10 rounded-xl relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 300 100">
              <path d="M30 50 Q80 20 130 40 Q180 60 230 35 Q260 25 280 50" stroke="#FF6B35" strokeWidth="2" fill="none" strokeDasharray="6,4" opacity="0.6" />
              <circle cx="30" cy="50" r="6" fill="#FF6B35" opacity="0.8" />
              <circle cx="130" cy="40" r="4" fill="#2EC4B6" opacity="0.6" />
              <circle cx="230" cy="35" r="4" fill="#2EC4B6" opacity="0.6" />
              <circle cx="280" cy="50" r="6" fill="#E63946" opacity="0.8" />
            </svg>
            <div className="absolute bottom-2 right-3 flex items-center gap-1 text-[10px] text-[#1B3A5C]/60">
              <AlertTriangle className="w-3 h-3" /> 2个配送点
            </div>
          </div>
        </div>
      </div>

      {showDelivery && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowDelivery(null)}>
          <div className="bg-white rounded-t-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1B3A5C]">交付确认</h2>
              <button onClick={() => setShowDelivery(null)} className="text-gray-400 text-sm">✕</button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">步骤1：扫码验证</p>
                <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition ${scanned ? "border-[#2EC4B6] bg-[#2EC4B6]/5" : "border-gray-200"}`}>
                  {scanned ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="w-10 h-10 text-[#2EC4B6] mb-2" />
                      <span className="text-sm font-medium text-[#2EC4B6]">扫码验证通过</span>
                    </div>
                  ) : (
                    <button onClick={() => setScanned(true)} className="flex flex-col items-center gap-2 text-[#1B3A5C]">
                      <ScanLine className="w-10 h-10 text-[#FF6B35]" />
                      <span className="text-xs font-medium">点击模拟扫码</span>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">步骤2：收件人签名确认</p>
                <div className={`border-2 border-dashed rounded-xl p-4 transition ${signed ? "border-[#2EC4B6] bg-[#2EC4B6]/5" : "border-gray-200"}`}>
                  {signed ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-[#2EC4B6]" />
                      <span className="text-sm font-medium text-[#2EC4B6]">签名已确认</span>
                    </div>
                  ) : (
                    <button onClick={() => setSigned(true)} disabled={!scanned} className={`w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${scanned ? "bg-[#1B3A5C] text-white hover:bg-[#142d48]" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                      <PenLine className="w-4 h-4" /> 点击模拟签名
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => confirmDelivery(showDelivery)} disabled={!scanned || !signed} className={`w-full py-3 rounded-xl text-sm font-semibold transition ${scanned && signed ? "bg-[#FF6B35] text-white hover:bg-[#e55e2e] shadow-lg shadow-[#FF6B35]/30" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                确认交付完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
