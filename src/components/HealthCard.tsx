import { Pill, BookOpen, Dumbbell, ChevronRight } from "lucide-react";
import type { MedicineReminder, Recipe, Exercise } from "@/types";
import LargeButton from "./LargeButton";
import VoiceButton from "./VoiceButton";

interface HealthCardProps {
  medicineReminders?: MedicineReminder[];
  recommendedRecipe?: Recipe;
  recommendedExercise?: Exercise;
}

const defaultReminders: MedicineReminder[] = [
  {
    id: "1",
    name: "降压药",
    dosage: "1片",
    times: ["08:00", "20:00"],
    enabled: true,
    takenToday: [true, false],
    instructions: "饭后服用",
    sideEffects: [],
  },
  {
    id: "2",
    name: "维生素D",
    dosage: "1粒",
    times: ["12:00"],
    enabled: true,
    takenToday: [false],
    instructions: "随餐服用",
    sideEffects: [],
  },
];

const defaultRecipe: Recipe = {
  id: "r1",
  name: "山药排骨汤",
  description: "健脾养胃，适合老年人食用",
  image: "",
  suitableDiseases: ["hypertension", "gastric"],
  suitableAges: "老年人",
  ingredients: [
    { name: "山药", amount: "300g" },
    { name: "排骨", amount: "500g" },
    { name: "生姜", amount: "3片" },
  ],
  steps: [
    { step: 1, description: "排骨焯水去腥" },
    { step: 2, description: "山药去皮切块" },
    { step: 3, description: "一起炖煮1小时" },
  ],
  nutritionTags: ["高蛋白", "低脂肪", "养胃"],
  cookTime: "90分钟",
  difficulty: "easy",
};

const defaultExercise: Exercise = {
  id: "e1",
  name: "八段锦",
  description: "传统养生功法，强身健体",
  thumbnail: "",
  videoUrl: "",
  duration: "15分钟",
  moves: [
    { name: "两手托天理三焦", description: "双手交叉上举" },
    { name: "左右开弓似射雕", description: "扩胸展臂" },
  ],
  benefits: ["疏通经络", "增强体质", "调节气血"],
  suitableFor: "老年人、体质虚弱者",
};

export default function HealthCard({
  medicineReminders = defaultReminders,
  recommendedRecipe = defaultRecipe,
  recommendedExercise = defaultExercise,
}: HealthCardProps) {
  const summaryText = `今日健康提醒。用药提醒：${medicineReminders.map((m) => `${m.name}${m.dosage}，${m.times.join("、")}`).join("；")}。推荐食谱：${recommendedRecipe.name}，${recommendedRecipe.description}。推荐运动：${recommendedExercise.name}，${recommendedExercise.duration}。`;

  return (
    <div className="a11y-card animate-slide-up">
      <h2 className="text-a11y-xl font-bold a11y-text mb-6">今日健康</h2>

      <div className="mb-6 p-4 rounded-a11y" style={{ backgroundColor: "rgba(49, 130, 206, 0.08)" }}>
        <h3 className="text-a11y-lg font-bold a11y-text mb-3 flex items-center gap-2">
          <Pill className="w-6 h-6 text-blue-600" />
          用药提醒
        </h3>
        <div className="space-y-3">
          {medicineReminders.map((med) => (
            <div
              key={med.id}
              className="flex items-center justify-between p-3 rounded-a11y"
              style={{ backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-border)" }}
            >
              <div>
                <p className="font-bold a11y-text">{med.name}</p>
                <p className="text-a11y-sm a11y-text-secondary">
                  {med.dosage} · {med.times.join("、")} · {med.instructions}
                </p>
              </div>
              <div className="flex gap-2">
                {med.takenToday.map((taken, idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      taken ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {taken ? "✓" : idx + 1}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <button
          className="w-full a11y-btn a11y-btn-ghost justify-between p-4"
          aria-label={`查看推荐食谱：${recommendedRecipe.name}`}
        >
          <span className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-orange-600" />
            <span className="text-left">
              <span className="block font-bold a11y-text">推荐食谱</span>
              <span className="block text-a11y-sm a11y-text-secondary">
                {recommendedRecipe.name} · {recommendedRecipe.cookTime}
              </span>
            </span>
          </span>
          <ChevronRight className="w-6 h-6 a11y-text-secondary" />
        </button>

        <button
          className="w-full a11y-btn a11y-btn-ghost justify-between p-4"
          aria-label={`查看推荐运动：${recommendedExercise.name}`}
        >
          <span className="flex items-center gap-3">
            <Dumbbell className="w-6 h-6 text-green-600" />
            <span className="text-left">
              <span className="block font-bold a11y-text">运动建议</span>
              <span className="block text-a11y-sm a11y-text-secondary">
                {recommendedExercise.name} · {recommendedExercise.duration}
              </span>
            </span>
          </span>
          <ChevronRight className="w-6 h-6 a11y-text-secondary" />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 justify-end">
        <LargeButton variant="primary" size="normal" icon={<Pill className="w-5 h-5" />}>
          管理用药
        </LargeButton>
        <VoiceButton text={summaryText} label="播报健康" />
      </div>
    </div>
  );
}
