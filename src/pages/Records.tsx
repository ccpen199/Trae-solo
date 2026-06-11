import { useState } from "react";
import { FileText, Download, Calendar, Clock, Shield, Check, X, Plus, Building2, UserCheck, Key, Link2, ExternalLink } from "lucide-react";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import ProgressRing from "../components/ui/ProgressRing";
import { useHealthStore } from "../store/useHealthStore";
import { api } from "../utils/api";
import type { HealthArchive, HISDepartment, HISDoctor, HISAppointment, DataAuthorization } from "../../shared/types";

type Tab = "export" | "apt" | "auth";
type Step = "dept" | "doc" | "time";

const DTO = [{k:"vitals",l:"生理数据"},{k:"sleep",l:"睡眠"},{k:"exercise",l:"运动"},{k:"alerts",l:"预警"}];
const fmt = (d: string) => new Date(d).toLocaleDateString("zh-CN");
const lbl = (k: string) => DTO.find(o => o.k === k)?.l ?? k;

export function Records() {
  const { archives, hisDepartments: depts, hisDoctors: docs, hisAppointments: apts, authorizations: auths, addArchive, addAppointment, addAuthorization, removeAuthorization, setLoading } = useHealthStore();
  const [tab, setTab] = useState<Tab>("export");
  const [ds, setDs] = useState(""), [de_, setDe] = useState(""), [st, setSt] = useState<string[]>([]), [fmt_, setFmt] = useState<"json" | "pdf">("json");
  const [step, setStep] = useState<Step>("dept"), [selDept, setSelDept] = useState<string | null>(null), [selDoc, setSelDoc] = useState<HISDoctor | null>(null), [selSlot, setSelSlot] = useState<string | null>(null);
  const [pName, setPName] = useState(""), [pPhone, setPPhone] = useState(""), [org, setOrg] = useState(""), [scope, setScope] = useState<string[]>([]), [exp, setExp] = useState("");
  const fDocs = selDept ? docs.filter(d => d.departmentId === selDept) : [];
  const wrap = async (k: string, fn: () => Promise<void>) => { setLoading(k, true); try { await fn(); } catch (e) { console.error(`${k}失败:`, e); } finally { setLoading(k, false); } };
  const gen = () => wrap("archive", async () => {
    if (!ds || !de_ || st.length === 0) return;
    const a = (await api.archives.generate({ dateStart: ds, dateEnd: de_, dataTypes: st, format: fmt_ })) as HealthArchive;
    addArchive(a); setDs(""); setDe(""); setSt([]);
  });
  const toggle = (k: string, set: React.Dispatch<React.SetStateAction<string[]>>) => set(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const book = () => wrap("apt", async () => {
    if (!selDoc || !selSlot || !pName || !pPhone) return;
    const a = (await api.archives.createAppointment({ doctorId: selDoc.id, departmentId: selDoc.departmentId, date: selSlot.split(" ")[0], timeSlot: selSlot, patientName: pName, patientPhone: pPhone })) as HISAppointment;
    addAppointment(a); setStep("dept"); setSelDept(null); setSelDoc(null); setSelSlot(null); setPName(""); setPPhone("");
  });
  const createAuth = () => wrap("auth", async () => {
    if (!org || scope.length === 0 || !exp) return;
    const a = (await api.archives.createAuthorization({ targetOrg: org, targetOrgName: org, scope, expiresAt: exp })) as DataAuthorization;
    addAuthorization(a); setOrg(""); setScope([]); setExp("");
  });
  const revoke = (id: string) => wrap("revoke", async () => { await api.archives.revokeAuthorization(id); removeAuthorization(id); });

  const tabs = [{k:"export" as Tab,l:"档案导出",i:<FileText className="w-4 h-4"/>},{k:"apt" as Tab,l:"HIS预约",i:<Calendar className="w-4 h-4"/>},{k:"auth" as Tab,l:"数据授权",i:<Shield className="w-4 h-4"/>}];
  const steps = [{k:"dept" as Step,l:"选择科室"},{k:"doc" as Step,l:"选择医生"},{k:"time" as Step,l:"选择时段"}];
  const btn = "px-4 py-2 rounded-lg text-sm font-medium transition-all", on = "bg-vital-green-500/20 text-vital-green-400 border border-vital-green-500/50", off = "bg-deep-sea-600/50 text-deep-sea-200/70 border border-vital-green-500/20";
  const input = "w-full px-4 py-2 bg-deep-sea-600/50 border border-vital-green-500/20 rounded-lg text-deep-sea-100 focus:border-vital-green-500/50 focus:outline-none";
  const pri = "w-full py-3 bg-vital-green-500/20 text-vital-green-400 border border-vital-green-500/50 rounded-xl font-medium hover:bg-vital-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const card = "p-4 rounded-xl bg-deep-sea-600/30 border border-vital-green-500/10 hover:border-vital-green-500/30 transition-all";
  const badge = (s: string) => {
    const c: Record<string, string> = { completed: "bg-vital-green-500/20 text-vital-green-400", generating: "bg-warning-amber-500/20 text-warning-amber-400", failed: "bg-alert-red-500/20 text-alert-red-400", confirmed: "bg-vital-green-500/20 text-vital-green-400", pending: "bg-warning-amber-500/20 text-warning-amber-400", cancelled: "bg-alert-red-500/20 text-alert-red-400" };
    const l: Record<string, string> = { completed: "已完成", generating: "生成中", failed: "失败", confirmed: "已确认", pending: "待确认", cancelled: "已取消" };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${c[s]}`}>{l[s]}</span>;
  };
  const Icon = ({i,c="text-vital-green-400",s="w-5 h-5"}:{i:React.ReactNode;c?:string;s?:string}) => <span className={`${c} ${s}`}>{i}</span>;
  const H = ({icon,title}:{icon:React.ReactNode;title:string}) => <h3 className="text-lg font-semibold text-deep-sea-100 mb-4 flex items-center gap-2"><Icon i={icon}/>{title}</h3>;
  const Empty = ({icon,text}:{icon:React.ReactNode;text:string}) => <div className="text-center py-8 text-deep-sea-200/50">{icon}<p>{text}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-deep-sea-50 glow-text">健康档案</h1>
        <div className="flex bg-deep-sea-600/50 rounded-xl p-1 border border-vital-green-500/20">
          {tabs.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.k ? "bg-vital-green-500/20 text-vital-green-400" : "text-deep-sea-200/60 hover:text-deep-sea-100"}`}>
              {t.i} {t.l}
            </button>
          ))}
        </div>
      </div>

      {tab === "export" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <H icon={<FileText/>} title="生成健康档案"/>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-deep-sea-200/70 mb-1 block">开始日期</label><input type="date" value={ds} onChange={e => setDs(e.target.value)} className={input}/></div>
                <div><label className="text-sm text-deep-sea-200/70 mb-1 block">结束日期</label><input type="date" value={de_} onChange={e => setDe(e.target.value)} className={input}/></div>
              </div>
              <div>
                <label className="text-sm text-deep-sea-200/70 mb-2 block">数据类型</label>
                <div className="flex flex-wrap gap-2">{DTO.map(o => <button key={o.k} onClick={() => toggle(o.k, setSt)} className={`${btn} ${st.includes(o.k) ? on : off}`}>{o.l}</button>)}</div>
              </div>
              <div>
                <label className="text-sm text-deep-sea-200/70 mb-2 block">导出格式</label>
                <div className="flex gap-2">{["json", "pdf"].map(f => <button key={f} onClick={() => setFmt(f as "json" | "pdf")} className={`${btn} uppercase ${fmt_ === f ? on : off}`}>{f}</button>)}</div>
              </div>
              <button onClick={gen} disabled={!ds || !de_ || st.length === 0} className={pri}><Plus className="w-4 h-4"/> 生成档案</button>
            </div>
          </Card>
          <Card className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-vital-green-500/10 flex items-center justify-center"><Icon i={<Shield/>} s="w-6 h-6"/></div>
              <div><h3 className="text-lg font-semibold text-deep-sea-100">数据标准</h3><p className="text-xs text-deep-sea-200/60">符合国家规范</p></div>
            </div>
            <div className="space-y-3 text-sm text-deep-sea-200/70">
              {["《移动健康终端设备数据交互规范》", "支持HL7 FHIR标准格式导出", "数据加密传输与存储", "符合《个人信息保护法》要求"].map(t => (
                <p key={t} className="flex items-start gap-2"><Check className="w-4 h-4 text-vital-green-400 flex-shrink-0 mt-0.5"/>{t}</p>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-vital-green-500/10"><ProgressRing value={85} label="标准合规度" size={80}/></div>
          </Card>
          <Card className="lg:col-span-3">
            <H icon={<FileText/>} title="已有档案"/>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archives.map(a => (
                <div key={a.id} className={card}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 rounded bg-vital-green-500/20 text-vital-green-400 text-xs font-medium uppercase">{a.format}</span>
                    {badge(a.status)}
                  </div>
                  <p className="text-deep-sea-100 font-medium mb-1">{fmt(a.dateStart)} - {fmt(a.dateEnd)}</p>
                  <p className="text-xs text-deep-sea-200/60 mb-2">{a.dataTypes.map(lbl).join(" · ")}</p>
                  <p className="text-xs text-deep-sea-200/50 mb-3 flex items-center gap-1"><Clock className="w-3 h-3"/>{fmt(a.generatedAt)} · {a.standard}</p>
                  <a href={api.archives.download(a.id)} className="flex items-center justify-center gap-2 w-full py-2 bg-vital-green-500/10 text-vital-green-400 rounded-lg text-sm font-medium hover:bg-vital-green-500/20 transition-all"><Download className="w-4 h-4"/> 下载</a>
                </div>
              ))}
              {archives.length === 0 && <Empty icon={<FileText className="w-12 h-12 mx-auto mb-2 opacity-50"/>} text="暂无档案记录"/>}
            </div>
          </Card>
        </div>
      )}

      {tab === "apt" && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-center gap-4 mb-6">
              {steps.map((s, i) => (
                <div key={s.k} className="flex items-center">
                  <div className={`flex items-center gap-2 ${step === s.k ? "text-vital-green-400" : "text-deep-sea-200/60"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s.k ? on : off}`}>{i + 1}</div>
                    <span className="text-sm font-medium">{s.l}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`w-12 h-0.5 mx-4 ${steps.findIndex(st => st.k === step) > i ? "bg-vital-green-500" : "bg-vital-green-500/20"}`}/>}
                </div>
              ))}
            </div>
            {step === "dept" && (
              <div>
                <H icon={<Building2/>} title="选择科室"/>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {depts.map(d => (
                    <button key={d.id} onClick={() => { setSelDept(d.id); setStep("doc"); }} className={`${card} text-left`}>
                      <p className="text-deep-sea-100 font-medium">{d.name}</p>
                      <p className="text-xs text-deep-sea-200/60 mt-1">{d.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === "doc" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <H icon={<UserCheck/>} title="选择医生"/>
                  <button onClick={() => setStep("dept")} className="text-sm text-deep-sea-200/60 hover:text-vital-green-400 transition-colors">返回上一步</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fDocs.map(d => (
                    <div key={d.id} className={`${card} ${selDoc?.id === d.id ? "bg-vital-green-500/10 border-vital-green-500/50" : ""}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-deep-sea-100 font-medium text-lg">{d.name}</p>
                          <p className="text-xs text-vital-green-400">{d.title}</p>
                          <p className="text-xs text-deep-sea-200/60 mt-1">{d.department}</p>
                        </div>
                        {selDoc?.id === d.id && <div className="w-6 h-6 rounded-full bg-vital-green-500/20 flex items-center justify-center"><Check className="w-4 h-4 text-vital-green-400"/></div>}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {d.availableSlots.slice(0, 3).map(s => <span key={s} className="px-2 py-0.5 rounded bg-deep-sea-600/50 text-deep-sea-200/60 text-xs">{s}</span>)}
                        {d.availableSlots.length > 3 && <span className="px-2 py-0.5 rounded bg-deep-sea-600/50 text-deep-sea-200/60 text-xs">+{d.availableSlots.length - 3}</span>}
                      </div>
                      <button onClick={() => { setSelDoc(d); setStep("time"); }} className="w-full py-2 bg-vital-green-500/10 text-vital-green-400 rounded-lg text-sm font-medium hover:bg-vital-green-500/20 transition-all">选择此医生</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step === "time" && selDoc && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <H icon={<Clock/>} title="选择时段"/>
                  <button onClick={() => setStep("doc")} className="text-sm text-deep-sea-200/60 hover:text-vital-green-400 transition-colors">返回上一步</button>
                </div>
                <div className="mb-6">
                  <p className="text-deep-sea-100 font-medium mb-2">{selDoc.name} · {selDoc.title}</p>
                  <div className="flex flex-wrap gap-2">{selDoc.availableSlots.map(s => <button key={s} onClick={() => setSelSlot(s)} className={`${btn} ${selSlot === s ? on : off}`}>{s}</button>)}</div>
                </div>
                <div className={card}>
                  <h4 className="text-deep-sea-100 font-medium mb-4">预约确认</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm text-deep-sea-200/70 mb-1 block">患者姓名</label><input type="text" value={pName} onChange={e => setPName(e.target.value)} placeholder="请输入患者姓名" className={input}/></div>
                      <div><label className="text-sm text-deep-sea-200/70 mb-1 block">联系电话</label><input type="tel" value={pPhone} onChange={e => setPPhone(e.target.value)} placeholder="请输入联系电话" className={input}/></div>
                    </div>
                    <button onClick={book} disabled={!selSlot || !pName || !pPhone} className={pri}><Check className="w-4 h-4"/> 确认预约</button>
                  </div>
                </div>
              </div>
            )}
          </Card>
          <Card>
            <H icon={<Calendar/>} title="我的预约"/>
            <div className="space-y-3">
              {apts.map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-deep-sea-600/30 border border-vital-green-500/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-vital-green-500/10 flex items-center justify-center"><Icon i={<Calendar/>} s="w-6 h-6"/></div>
                    <div><p className="text-deep-sea-100 font-medium">{a.patientName}</p><p className="text-sm text-deep-sea-200/60">{a.date} {a.timeSlot}</p></div>
                  </div>
                  {badge(a.status)}
                </div>
              ))}
              {apts.length === 0 && <Empty icon={<Calendar className="w-12 h-12 mx-auto mb-2 opacity-50"/>} text="暂无预约记录"/>}
            </div>
          </Card>
        </div>
      )}

      {tab === "auth" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <H icon={<Plus/>} title="新建授权"/>
            <div className="space-y-4">
              <div><label className="text-sm text-deep-sea-200/70 mb-1 block flex items-center gap-1"><Building2 className="w-3 h-3"/> 机构名称</label><input type="text" value={org} onChange={e => setOrg(e.target.value)} placeholder="请输入授权机构名称" className={input}/></div>
              <div>
                <label className="text-sm text-deep-sea-200/70 mb-2 block flex items-center gap-1"><Key className="w-3 h-3"/> 数据范围</label>
                <div className="space-y-2">
                  {DTO.map(o => (
                    <label key={o.k} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={scope.includes(o.k)} onChange={() => toggle(o.k, setScope)} className="w-4 h-4 rounded border-vital-green-500/30 bg-deep-sea-600/50 text-vital-green-500 focus:ring-vital-green-500/50"/>
                      <span className="text-sm text-deep-sea-200/70">{o.l}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div><label className="text-sm text-deep-sea-200/70 mb-1 block flex items-center gap-1"><Clock className="w-3 h-3"/> 有效期至</label><input type="date" value={exp} onChange={e => setExp(e.target.value)} className={input}/></div>
              <button onClick={createAuth} disabled={!org || scope.length === 0 || !exp} className={pri}><Link2 className="w-4 h-4"/> 创建授权</button>
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <H icon={<Shield/>} title="授权列表"/>
            <div className="space-y-3">
              {auths.map(a => (
                <div key={a.id} className={card}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${a.revoked ? "bg-alert-red-500/10" : "bg-vital-green-500/10"}`}><Building2 className={`w-6 h-6 ${a.revoked ? "text-alert-red-400" : "text-vital-green-400"}`}/></div>
                      <div>
                        <p className="text-deep-sea-100 font-medium flex items-center gap-2">{a.targetOrgName}<a href="#" className="text-vital-green-400 hover:text-vital-green-300"><ExternalLink className="w-3 h-3"/></a></p>
                        <p className="text-sm text-deep-sea-200/60">{a.scope.map(lbl).join(" · ")}</p>
                        <p className="text-xs text-deep-sea-200/50 mt-1">有效期至: {fmt(a.expiresAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${a.revoked ? "bg-alert-red-500/20 text-alert-red-400" : "bg-vital-green-500/20 text-vital-green-400"}`}>
                        {a.revoked ? <><X className="w-3 h-3"/> 已撤销</> : <><Check className="w-3 h-3"/> 有效</>}
                      </span>
                      {!a.revoked && <button onClick={() => revoke(a.id)} className="px-3 py-1 rounded-lg text-xs font-medium bg-alert-red-500/10 text-alert-red-400 hover:bg-alert-red-500/20 transition-all">撤销</button>}
                    </div>
                  </div>
                </div>
              ))}
              {auths.length === 0 && <Empty icon={<Shield className="w-12 h-12 mx-auto mb-2 opacity-50"/>} text="暂无授权记录"/>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
