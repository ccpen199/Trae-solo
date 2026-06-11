import { useState } from "react";
import { MapPin, Clock, Send, Award, CheckCircle } from "lucide-react";

const SKILLS = ["React", "Python", "数据分析", "Java", "SQL", "机器学习", "Figma", "Vue"];

const INTERNSHIPS = [
  { id: 1, company: "字节跳动", position: "前端开发实习生", score: 92, schedule: "每周3天·3个月", skills: ["React", "Vue", "Python"], credit: true, location: "北京" },
  { id: 2, company: "腾讯科技", position: "数据分析实习生", score: 87, schedule: "每周4天·2个月", skills: ["Python", "SQL", "数据分析"], credit: true, location: "深圳" },
  { id: 3, company: "阿里巴巴", position: "Java后端实习生", score: 78, schedule: "每周3天·6个月", skills: ["Java", "SQL"], credit: false, location: "杭州" },
  { id: 4, company: "美团", position: "产品经理实习生", score: 71, schedule: "每周2天·3个月", skills: ["Figma", "数据分析"], credit: true, location: "北京" },
  { id: 5, company: "华为技术", position: "AI算法实习生", score: 95, schedule: "每周5天·3个月", skills: ["Python", "机器学习"], credit: true, location: "深圳" },
  { id: 6, company: "网易", position: "UI设计实习生", score: 64, schedule: "每周3天·2个月", skills: ["Figma"], credit: false, location: "杭州" },
];

const TIMELINE = [
  { day: "周一", slots: [0, 0, 1, 1, 1, 1, 0, 0, 0, 0] },
  { day: "周二", slots: [0, 0, 0, 0, 0, 0, 1, 1, 1, 0] },
  { day: "周三", slots: [0, 0, 1, 1, 0, 0, 0, 0, 0, 0] },
  { day: "周四", slots: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0] },
  { day: "周五", slots: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1] },
];

function ScoreRing({ score }: { score: number }) {
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 90 ? "#2EC4B6" : score >= 75 ? "#FFC857" : score >= 60 ? "#FF6B35" : "#E63946";
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function SocialIntern() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">实习岗位智能匹配</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {INTERNSHIPS.map((intern) => (
              <div key={intern.id} className={`bg-white rounded-xl p-5 shadow-sm border-2 transition-colors cursor-pointer ${selected === intern.id ? "border-[#FF6B35]" : "border-gray-100 hover:border-[#FF6B35]/40"}`} onClick={() => setSelected(intern.id)}>
                <div className="flex items-start gap-4">
                  <ScoreRing score={intern.score} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[#1B3A5C]">{intern.position}</h3>
                      {intern.credit && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#2EC4B6]/10 text-[#2EC4B6]">
                          <Award size={12} />
                          学分认定
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{intern.company}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><MapPin size={12} />{intern.location}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{intern.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {intern.skills.map((skill) => {
                        const matched = SKILLS.includes(skill);
                        return (
                          <span key={skill} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${matched ? "bg-[#2EC4B6]/10 text-[#2EC4B6]" : "bg-gray-100 text-gray-500"}`}>
                            {matched && <CheckCircle size={10} />}
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <button className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#e55d2b] transition-colors">
                    <Send size={14} />
                    投递
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-[#1B3A5C] mb-4">我的技能标签</h3>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <span key={skill} className="text-xs px-3 py-1.5 rounded-full bg-[#1B3A5C] text-white">{skill}</span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-[#1B3A5C] mb-4">空闲时间表</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs text-gray-400 pl-10">
                  {["8", "9", "10", "11", "12", "14", "16", "18", "20", "22"].map((h) => (
                    <div key={h} className="w-5 text-center">{h}</div>
                  ))}
                </div>
                {TIMELINE.map((row) => (
                  <div key={row.day} className="flex items-center gap-1">
                    <span className="w-8 text-xs text-gray-500 shrink-0">{row.day}</span>
                    {row.slots.map((slot, i) => (
                      <div key={i} className={`w-5 h-5 rounded-sm ${slot ? "bg-[#2EC4B6]" : "bg-gray-100"}`} />
                    ))}
                  </div>
                ))}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-[#2EC4B6]" />空闲</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gray-100" />有课</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
