import { useState, useMemo } from "react";
import {
  Stethoscope, Dog, Cat, ChevronRight, ChevronLeft, RotateCcw,
  AlertCircle, CalendarClock, Pill, Droplets, Thermometer,
  Sparkles, HeartPulse, ArrowRight,
} from "lucide-react";
import type { Species, Diagnosis } from "../../shared/types";
import { DOG_TREE, CAT_TREE, SEVERITY_CONFIG } from "../data/symptomTrees";

export default function SymptomCheck() {
  const [species, setSpecies] = useState<Species>("dog");
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const [path, setPath] = useState(["start"]);

  const tree = species === "dog" ? DOG_TREE : CAT_TREE;
  const currentNode = tree[currentNodeId];
  const diagnosis = currentNode?.diagnosis;
  const progress = Math.min((path.length - 1) / 4, 1);

  const totalNodes = useMemo(() => {
    const ids = Object.keys(tree);
    const leafIds = ids.filter((id) => tree[id].diagnosis);
    let maxSteps = 2;
    leafIds.forEach((leafId) => {
      const visited = new Set<string>();
      let id = leafId, steps = 0;
      while (id && !visited.has(id)) {
        visited.add(id);
        const parent = ids.find((pid) => tree[pid].options.some((o) => o.nextNodeId === id));
        if (!parent) break;
        id = parent; steps++;
      }
      maxSteps = Math.max(maxSteps, steps);
    });
    return maxSteps;
  }, [tree]);

  const handleSelect = (nextId: string | null) => {
    if (!nextId) return;
    setCurrentNodeId(nextId);
    setPath((p) => [...p, nextId]);
  };

  const handleBack = () => {
    if (path.length <= 1) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
    setCurrentNodeId(newPath[newPath.length - 1]);
  };

  const handleReset = () => { setCurrentNodeId("start"); setPath(["start"]); };

  const handleSwitchSpecies = (s: Species) => {
    if (s === species) return;
    setSpecies(s); setCurrentNodeId("start"); setPath(["start"]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-warm-brown flex items-center justify-center gap-3 mb-2">
          <HeartPulse className="w-7 h-7 text-brand-orange" />
          AI 症状自查 <Sparkles className="w-6 h-6 text-accent-sunny" />
        </h1>
        <p className="text-warm-gray">通过简单几步，了解爱宠的健康状况</p>
      </div>

      <SpeciesSwitcher species={species} onSwitch={handleSwitchSpecies} />

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3 text-sm text-warm-gray">
          <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4" />自查进度</div>
          <div>第 <span className="text-brand-orange font-semibold">{path.length - 1}</span> / {totalNodes} 步</div>
        </div>
        <div className="h-3 bg-cream-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-orange via-brand-orange-light to-brand-mint rounded-full transition-all duration-500"
               style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {diagnosis ? (
        <DiagnosisResult diagnosis={diagnosis} onReset={handleReset} />
      ) : (
        <QuestionStep
          question={currentNode?.question ?? ""}
          options={currentNode?.options ?? []}
          species={species}
          canBack={path.length > 1}
          onBack={handleBack}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}

function SpeciesSwitcher({ species, onSwitch }: { species: Species; onSwitch: (s: Species) => void }) {
  const items: { key: Species; name: string; sub: string; activeColor: string; iconColor: string }[] = [
    { key: "dog", name: "狗狗", sub: "柴犬·豆豆", activeColor: "from-brand-orange/15 to-brand-orange-light/15 border-brand-orange/40",
      iconColor: "text-brand-orange-dark" },
    { key: "cat", name: "猫咪", sub: "布偶·奶茶", activeColor: "from-brand-mint/15 to-brand-mint-light/15 border-brand-mint/40",
      iconColor: "text-brand-mint-dark" },
  ];
  return (
    <div className="flex justify-center gap-4 mb-8">
      {items.map((it) => {
        const Icon = it.key === "dog" ? Dog : Cat;
        const active = species === it.key;
        return (
          <button key={it.key} onClick={() => onSwitch(it.key)}
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl border-2 transition-all duration-300 ${
              active ? `bg-gradient-to-r ${it.activeColor} shadow-soft scale-[1.02]` : "bg-white border-cream-100 hover:border-cream-200"
            }`}>
            <Icon className={`w-8 h-8 ${active ? (it.key === "dog" ? "text-brand-orange" : "text-brand-mint-dark") : "text-warm-gray"}`} />
            <div className="text-left">
              <div className={`font-display text-lg ${active ? it.iconColor : "text-warm-brown"}`}>{it.name}</div>
              <div className="text-xs text-warm-gray">{it.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function QuestionStep({
  question, options, species, canBack, onBack, onSelect,
}: {
  question: string; options: { label: string; nextNodeId: string | null }[];
  species: Species; canBack: boolean; onBack: () => void;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="card animate-slide-up">
      {canBack && (
        <button onClick={onBack}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-cream-100 transition text-warm-gray mb-2 text-xs">
          <ChevronLeft className="w-4 h-4" />返回上一步
        </button>
      )}
      <h2 className="font-display text-2xl text-warm-brown mb-6 flex items-start gap-3">
        <span className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          species === "dog" ? "bg-brand-orange/15 text-brand-orange" : "bg-brand-mint/15 text-brand-mint-dark"
        }`}><Droplets className="w-5 h-5" /></span>
        {question}
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {options.map((opt, idx) => (
          <button key={idx} onClick={() => onSelect(opt.nextNodeId)}
            className="group flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-cream-50 to-white border-2 border-cream-100 hover:border-brand-orange/30 hover:from-brand-orange/5 hover:to-brand-mint/5 hover:shadow-soft transition-all duration-300 text-left animate-slide-up"
            style={{ animationDelay: `${idx * 80}ms` }}>
            <span className="font-medium text-warm-brown group-hover:text-brand-orange-dark transition">{opt.label}</span>
            <ChevronRight className="w-5 h-5 text-warm-gray group-hover:text-brand-orange group-hover:translate-x-1 transition-all duration-300" />
          </button>
        ))}
      </div>
      <div className="mt-8 pt-6 border-t border-cream-100">
        <div className="flex items-center gap-2 text-xs text-warm-gray/70">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>本工具仅提供初步参考，遇到持续加重、剧烈疼痛、出血等紧急情况，请立即就医</span>
        </div>
      </div>
    </div>
  );
}

function DiagnosisResult({ diagnosis, onReset }: { diagnosis: Diagnosis; onReset: () => void }) {
  const cfg = SEVERITY_CONFIG[diagnosis.severity];
  const Icon = cfg.icon;
  return (
    <div className={`card bg-gradient-to-br ${cfg.bg} border ${cfg.border} animate-slide-up`}>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-3xl bg-white/80 backdrop-blur flex items-center justify-center flex-shrink-0 shadow-sm">
          <Icon className={`w-9 h-9 ${cfg.titleColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h2 className={`font-display text-2xl ${cfg.titleColor}`}>初步诊断结果</h2>
            <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
            {diagnosis.recommendVisit && (
              <span className="badge bg-brand-orange/15 text-brand-orange-dark gap-1">
                <CalendarClock className="w-3 h-3" />建议就医
              </span>
            )}
          </div>
          <div className="text-sm text-warm-gray/90 leading-relaxed">
            以下为基于症状的辅助参考，不能替代专业兽医诊断
          </div>
        </div>
      </div>
      <div className="bg-white/70 backdrop-blur rounded-3xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-warm-brown">
          <Thermometer className="w-4 h-4 text-brand-orange" />可能的情况
        </div>
        <div className="flex flex-wrap gap-2">
          {diagnosis.possibleConditions.map((c) => (
            <span key={c} className="px-4 py-2 rounded-xl bg-gradient-to-r from-cream-100 to-cream-50 text-sm text-warm-brown border border-cream-100 font-medium">
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="bg-white/70 backdrop-blur rounded-3xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-warm-brown">
          <Pill className="w-4 h-4 text-brand-mint-dark" />护理建议
        </div>
        <ol className="space-y-3">
          {diagnosis.suggestions.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-warm-gray/90 leading-relaxed">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                diagnosis.severity === "severe" ? "bg-brand-orange/15 text-brand-orange-dark" :
                diagnosis.severity === "moderate" ? "bg-accent-sunny/30 text-amber-700" :
                "bg-brand-mint/15 text-brand-mint-dark"
              }`}>{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {diagnosis.recommendVisit && (
          <button className="btn-primary flex-1">
            <CalendarClock className="w-5 h-5" />立即预约兽医<ArrowRight className="w-4 h-4" />
          </button>
        )}
        <button onClick={onReset} className={diagnosis.recommendVisit ? "btn-ghost flex-1" : "btn-primary flex-1"}>
          <RotateCcw className="w-5 h-5" />重新自查
        </button>
      </div>
    </div>
  );
}
