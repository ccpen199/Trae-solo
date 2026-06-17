import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion as m } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Wrench,
  Send,
  UserCheck,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn, formatDate, getTicketStatusLabel, getPriorityLabel, getTimeRemaining } from "@/utils";
import type { RepairTicket } from "@/types";

const timelineSteps = [
  { key: "submit", label: "提交", icon: Send },
  { key: "assign", label: "派单", icon: UserCheck },
  { key: "accept", label: "接单", icon: CheckCircle2 },
  { key: "process", label: "处理", icon: Wrench },
  { key: "complete", label: "完成", icon: CheckCircle2 },
  { key: "rate", label: "评价", icon: Star },
];
const stepOrder = ["submit", "assign", "accept", "process", "complete", "rate"];

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { repairTickets, maintenanceStaff } = useAppStore();
  const [photoIndex, setPhotoIndex] = useState(0);

  const ticket = useMemo(() => repairTickets.find((t) => t.id === id), [repairTickets, id]);
  const staff = useMemo(
    () => (ticket?.assignee ? maintenanceStaff.find((s) => s.id === ticket.assignee) : null),
    [maintenanceStaff, ticket?.assignee]
  );

  if (!ticket) {
    return (
      <div className="p-6">
        <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>返回列表</Button>
        <div className="mt-10 text-center"><p className="text-slate-500">工单不存在</p></div>
      </div>
    );
  }

  const p = getPriorityLabel(ticket.priority);
  const s = getTicketStatusLabel(ticket.status);

  const getCurrentStep = (t: RepairTicket) => {
    if (t.rating) return "rate";
    if (t.status === "completed") return "complete";
    if (t.status === "processing") return "process";
    if (t.acceptTime) return "accept";
    if (t.assignTime) return "assign";
    return "submit";
  };

  const getStepStatus = (key: string) => {
    const current = stepOrder.indexOf(getCurrentStep(ticket));
    const idx = stepOrder.indexOf(key);
    return idx < current ? "done" : idx === current ? "active" : "pending";
  };

  const getTimeText = (t: RepairTicket) => {
    if (t.status === "escalated" && t.superviseRecord?.deadline) {
      const r = getTimeRemaining(t.superviseRecord.deadline);
      return `剩余 ${r.hours}小时${r.minutes}分钟`;
    }
    return "";
  };

  const isOverdue = ticket.status === "pending_assign" && Date.now() - new Date(ticket.submitTime).getTime() > 2 * 60 * 60 * 1000;

  return (
    <div className="p-6 space-y-6">
      <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>返回列表</Button>
      </m.div>

      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-800">{ticket.title}</h1>
                  <Badge className={cn(p.bgColor, p.color)}>{p.label}</Badge>
                  <Badge className={cn(s.bgColor, s.color)}>{s.label}</Badge>
                  {ticket.status === "escalated" && <Badge variant="danger" dot><AlertTriangle className="w-3 h-3" />已督办</Badge>}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" />提交人：{ticket.submitterName}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDate(ticket.submitTime, "YYYY-MM-DD HH:mm")}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{ticket.location}</span>
                  {isOverdue && <span className="text-rose-600 font-medium animate-pulse">已超时</span>}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </m.div>

      <div className="grid grid-cols-2 gap-6">
        <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold text-slate-800">报修内容</h2></CardHeader>
            <CardContent><p className="text-slate-600">{ticket.description}</p></CardContent>
          </Card>

          {ticket.photos.length > 0 && (
            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-slate-800">现场照片</h2></CardHeader>
              <CardContent>
                <div className="relative h-64 bg-slate-100 rounded-xl overflow-hidden">
                  <m.div key={photoIndex} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="w-full h-full">
                    <img src={ticket.photos[photoIndex]} alt="" className="w-full h-full object-contain" />
                  </m.div>
                  {ticket.photos.length > 1 && (
                    <>
                      <button onClick={() => setPhotoIndex((prev) => (prev - 1 + ticket.photos.length) % ticket.photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={() => setPhotoIndex((prev) => (prev + 1) % ticket.photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {ticket.photos.map((_, i) => (
                          <div key={i} className={cn("w-2 h-2 rounded-full transition-colors", i === photoIndex ? "bg-primary-600" : "bg-white/50")} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><h2 className="text-lg font-semibold text-slate-800">位置地图</h2></CardHeader>
            <CardContent>
              <div className="h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p>{ticket.location}</p>
                  <p className="text-sm">地图占位示意图</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {ticket.status === "completed" && ticket.completionProof && (
            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-slate-800">完成凭证</h2></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {ticket.completionProof.map((photo, i) => (
                    <img key={i} src={photo} alt="" className="w-full h-24 object-cover rounded-lg" />
                  ))}
                </div>
                {ticket.rating && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("w-5 h-5", i < ticket.rating! ? "text-amber-400 fill-amber-400" : "text-slate-300")} />
                      ))}
                    </div>
                    {ticket.ratingComment && <p className="text-sm text-slate-600">{ticket.ratingComment}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </m.div>

        <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
          {ticket.status === "processing" && staff && (
            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-slate-800">维修人员信息</h2></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{staff.name}</p>
                    <p className="text-sm text-slate-500">{staff.phone}</p>
                    <p className="text-sm text-slate-400">{staff.skills.join("、")}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressBar value={65} showLabel striped animatedStripes />
                  <p className="text-sm text-slate-500 mt-2">处理进度：正在维修中</p>
                </div>
              </CardContent>
            </Card>
          )}

          {ticket.status === "escalated" && ticket.superviseRecord && (
            <Card className="border-rose-300 bg-rose-50/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h2 className="text-lg font-semibold text-rose-800">督办记录</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">督办人</span>
                  <span className="font-medium">{ticket.superviseRecord.officerName}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-600">督办指令</span>
                  <p className="mt-1 p-3 bg-white rounded-lg text-slate-700">{ticket.superviseRecord.instruction}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">截止时间</span>
                  <span className="text-rose-600 font-medium animate-pulse">{getTimeText(ticket)}</span>
                </div>
                {ticket.superviseRecord.feedback && (
                  <div>
                    <span className="text-sm text-slate-600">反馈内容</span>
                    <p className="mt-1 p-3 bg-white rounded-lg text-slate-700">{ticket.superviseRecord.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><h2 className="text-lg font-semibold text-slate-800">处理流程</h2></CardHeader>
            <CardContent>
              <div className="relative">
                {timelineSteps.map((step, i) => {
                  const status = getStepStatus(step.key);
                  const Icon = step.icon;
                  return (
                    <m.div key={step.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="flex gap-4 pb-6 last:pb-0">
                      <div className="relative flex flex-col items-center">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 z-10",
                          status === "done" ? "bg-emerald-500 border-emerald-500 text-white" :
                          status === "active" ? "bg-primary-500 border-primary-500 text-white" :
                          "bg-white border-slate-300 text-slate-400"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {i < timelineSteps.length - 1 && (
                          <div className={cn("absolute top-10 w-0.5 h-full -translate-x-1/2", status === "done" ? "bg-emerald-500" : "bg-slate-200")} />
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <p className={cn("font-medium", status === "pending" ? "text-slate-400" : "text-slate-800")}>{step.label}</p>
                        {ticket.processLog[i] && (
                          <>
                            <p className="text-sm text-slate-500 mt-1">{formatDate(ticket.processLog[i].time, "YYYY-MM-DD HH:mm")}</p>
                            <p className="text-sm text-slate-600">{ticket.processLog[i].operator} - {ticket.processLog[i].remark}</p>
                          </>
                        )}
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold text-slate-800">处理日志</h2></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ticket.processLog.map((log, i) => (
                  <m.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">{log.action}</span>
                      <span className="text-sm text-slate-400">{formatDate(log.time, "YYYY-MM-DD HH:mm")}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">操作人：{log.operator}</p>
                    {log.remark && <p className="text-sm text-slate-600 mt-1">{log.remark}</p>}
                  </m.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </m.div>
      </div>
    </div>
  );
}
