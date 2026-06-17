import { useState } from "react";
import { motion as m } from "framer-motion";
import {
  Zap,
  Sparkles,
  Wrench,
  HeartPulse,
  Baby,
  Scissors,
  Leaf,
  Clock,
  Calendar,
  History,
  Minus,
  Plus,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { Card, CardContent, Button, Modal, Badge, CountUp } from "@/components/ui";
import { cn, generateId, formatDate } from "@/utils";
import type { ExchangeService, ExchangeRecord } from "@/types";

const iconMap: Record<string, any> = {
  sparkles: Sparkles,
  wrench: Wrench,
  "heart-pulse": HeartPulse,
  baby: Baby,
  scissors: Scissors,
  leaf: Leaf,
};

const statusMap = {
  pending: { label: "待确认", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "已确认", color: "bg-primary-100 text-primary-700" },
  completed: { label: "已完成", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "已取消", color: "bg-slate-100 text-slate-600" },
};

export default function EnergyExchange() {
  const { exchangeServices, creditScore, exchangeRecords, addExchangeRecord, currentUser } = useAppStore();
  const [selectedService, setSelectedService] = useState<ExchangeService | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [appointmentTime, setAppointmentTime] = useState("");

  const handleExchange = () => {
    if (!selectedService || !appointmentTime) return;
    const totalCost = selectedService.energyCost * quantity;
    if (creditScore.energy < totalCost) return;

    addExchangeRecord({
      id: generateId(),
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      energyCost: selectedService.energyCost,
      quantity,
      ownerId: currentUser.ownerId || "",
      exchangeTime: new Date().toISOString(),
      appointmentTime,
      status: "pending",
    });
    setShowExchangeModal(false);
    setSelectedService(null);
    setQuantity(1);
    setAppointmentTime("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-trust-50/50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">能量兑换中心</h1>
          <p className="text-slate-500">用邻里能量兑换社区便民服务，共建温馨社区</p>
        </m.div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-8">
          <Card className="bg-gradient-to-br from-trust-500 to-blue-500 text-white border-0 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-trust-100 font-medium mb-1">我的邻里能量</p>
                    <div className="flex items-baseline gap-2">
                      <CountUp end={creditScore.energy} className="text-5xl font-bold text-white" />
                      <span className="text-trust-100 text-lg">能量</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-bold text-white/20 mb-2">⚡</div>
                  <p className="text-trust-100 text-sm">能量可通过参与社区活动获得</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">可兑换服务</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exchangeServices.map((service, index) => {
              const Icon = iconMap[service.icon] || Sparkles;
              return (
                <m.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                  whileHover={service.available ? { y: -4 } : undefined}
                  className={cn(
                    "rounded-2xl shadow-card overflow-hidden",
                    service.available ? "bg-white hover:shadow-card-hover cursor-pointer" : "bg-slate-50 opacity-60"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center",
                        service.available ? "bg-gradient-to-br from-trust-400 to-blue-500" : "bg-slate-300"
                      )}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      {!service.available && <Badge variant="secondary">暂不可用</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{service.name}</h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-trust-600">
                        <Zap className="w-4 h-4" />
                        <span className="font-bold">{service.energyCost}</span>
                        <span className="text-sm">能量 / {service.unit}</span>
                      </div>
                      <Button
                        size="sm"
                        disabled={!service.available}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                          setShowExchangeModal(true);
                        }}
                        className={cn(service.available && "bg-trust-500 hover:bg-trust-600")}
                      >
                        立即兑换
                      </Button>
                    </div>
                  </CardContent>
                </m.div>
              );
            })}
          </div>
        </m.div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-trust-500" />
            兑换记录
          </h2>
          <Card>
            <CardContent className="p-0">
              {exchangeRecords.length === 0 ? (
                <div className="p-12 text-center">
                  <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">暂无兑换记录</p>
                  <p className="text-sm text-slate-400 mt-1">兑换服务后记录将显示在这里</p>
                </div>
              ) : (
                exchangeRecords.map((record, index) => {
                  const statusInfo = statusMap[record.status];
                  return (
                    <div
                      key={record.id}
                      className={cn(
                        "flex items-center gap-4 p-5",
                        index !== exchangeRecords.length - 1 && "border-b border-slate-100"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-trust-100 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-trust-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-800">{record.serviceName}</h4>
                          <Badge className={cn(statusInfo.color, "text-xs")}>{statusInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(record.exchangeTime, "YYYY-MM-DD HH:mm")}
                          </span>
                          {record.appointmentTime && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              预约：{formatDate(record.appointmentTime, "YYYY-MM-DD HH:mm")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-trust-600">
                          <Zap className="w-4 h-4" />
                          <span className="font-bold">-{record.energyCost * record.quantity}</span>
                          <span className="text-sm">能量</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">x{record.quantity}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </m.div>

        <Modal
          isOpen={showExchangeModal}
          onClose={() => setShowExchangeModal(false)}
          title="兑换服务"
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1 text-trust-600">
                <Zap className="w-5 h-5" />
                <span className="text-xl font-bold">{selectedService ? selectedService.energyCost * quantity : 0}</span>
                <span className="text-sm">能量</span>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowExchangeModal(false)}>取消</Button>
                <Button
                  onClick={handleExchange}
                  disabled={!appointmentTime || creditScore.energy < (selectedService ? selectedService.energyCost * quantity : 0)}
                  className="bg-trust-500 hover:bg-trust-600"
                >
                  确认兑换
                </Button>
              </div>
            </div>
          }
        >
          {selectedService && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-trust-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const Icon = iconMap[selectedService.icon] || Sparkles;
                    return <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}><Icon className="w-7 h-7 text-white" /></m.div>;
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{selectedService.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{selectedService.description}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">兑换数量</label>
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="secondary" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus className="w-4 h-4" /></Button>
                  <span className="text-2xl font-bold text-slate-800 w-16 text-center">{quantity}</span>
                  <Button size="icon" variant="secondary" onClick={() => setQuantity(quantity + 1)}><Plus className="w-4 h-4" /></Button>
                  <span className="text-sm text-slate-500">（{selectedService.unit}/份）</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2"><Calendar className="w-4 h-4 inline mr-1" />预约时间</label>
                <input type="datetime-local" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} min={new Date().toISOString().slice(0, 16)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trust-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-trust-50 rounded-xl">
                <span className="text-slate-600">当前能量余额</span>
                <div className="flex items-center gap-1 text-trust-600"><Zap className="w-5 h-5" /><span className="font-bold">{creditScore.energy}</span><span className="text-sm">能量</span></div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
