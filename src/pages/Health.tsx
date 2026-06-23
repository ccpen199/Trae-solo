import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Volume2,
  BookOpen,
  Dumbbell,
  Pill,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Clock,
  Users,
  Check,
  X,
  AlertCircle,
  ChefHat,
  Flame,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "@/store/dataStore";
import { recipes as recipeData } from "@/data/recipes";
import { exercises as exerciseData } from "@/data/exercises";
import { medicineReminders } from "@/data/medicines";
import LargeButton from "@/components/LargeButton";
import VoiceButton from "@/components/VoiceButton";
import { cn } from "@/lib/utils";
import type { ChronicDisease } from "@/types";

type DiseaseFilter = ChronicDisease | "all";
type HealthTab = "recipe" | "exercise" | "medicine";

const diseaseOptions: { value: DiseaseFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "diabetes", label: "糖尿病" },
  { value: "hypertension", label: "高血压" },
  { value: "heart_disease", label: "心脏病" },
  { value: "gastric", label: "胃病" },
];

const tabOptions: { value: HealthTab; label: string; icon: typeof BookOpen }[] = [
  { value: "recipe", label: "食谱推荐", icon: BookOpen },
  { value: "exercise", label: "八段锦教学", icon: Dumbbell },
  { value: "medicine", label: "用药提醒", icon: Pill },
];

export default function Health() {
  const navigate = useNavigate();
  const [diseaseFilter, setDiseaseFilter] = useState<DiseaseFilter>("all");
  const [activeTab, setActiveTab] = useState<HealthTab>("recipe");
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(true);

  const {
    recipes,
    exercises,
    medicines,
    setRecipes,
    setExercises,
    setMedicines,
    toggleMedicineTaken,
  } = useDataStore();

  useEffect(() => {
    if (recipes.length === 0) setRecipes(recipeData);
    if (exercises.length === 0) setExercises(exerciseData);
    if (medicines.length === 0) setMedicines(medicineReminders);
  }, [recipes.length, exercises.length, medicines.length, setRecipes, setExercises, setMedicines]);

  const filteredRecipes =
    diseaseFilter === "all"
      ? recipes
      : recipes.filter((r) => r.suitableDiseases.includes(diseaseFilter));

  const baduanjin = exercises.find((e) => e.id === "e001");

  const pageTitle = "健康中心";
  const summaryText = `${pageTitle}。当前筛选：${diseaseOptions.find((d) => d.value === diseaseFilter)?.label}。${
    activeTab === "recipe"
      ? `食谱推荐，共${filteredRecipes.length}道菜谱。`
      : activeTab === "exercise"
      ? `八段锦教学，共${baduanjin?.moves.length ?? 0}个动作。`
      : `用药提醒，共${medicines.filter((m) => m.enabled).length}种药品。`
  }`;

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: "var(--color-bg)" }}>
      <header className="sticky top-0 z-10 a11y-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="a11y-btn a11y-btn-ghost px-3 py-3"
            aria-label="返回"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-a11y-xl font-bold a11y-text flex-1 text-center">
            {pageTitle}
          </h1>
          <VoiceButton text={summaryText} label="播报" />
        </div>
      </header>

      <main className="container pt-6 space-y-6">
        <section className="a11y-card animate-slide-up">
          <h2 className="text-a11y-lg font-bold a11y-text mb-4">慢性病筛选</h2>
          <div className="flex flex-wrap gap-3">
            {diseaseOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDiseaseFilter(opt.value)}
                className={cn(
                  "a11y-btn text-a11y-lg px-8 py-4",
                  diseaseFilter === opt.value
                    ? "a11y-btn-primary"
                    : "a11y-btn-outline"
                )}
                aria-pressed={diseaseFilter === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="a11y-card animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tabOptions.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "a11y-btn text-a11y-lg py-6 px-6 flex-col gap-2",
                    isActive ? "a11y-btn-primary" : "a11y-btn-outline"
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className="w-8 h-8" />
                  <span className="font-bold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === "recipe" && (
          <section className="animate-fade-in space-y-4">
            <h2 className="text-a11y-lg font-bold a11y-text px-2 flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-orange-600" />
              食谱推荐
              <span className="text-a11y-sm a11y-text-secondary font-normal">
                （共 {filteredRecipes.length} 道）
              </span>
            </h2>
            {filteredRecipes.length === 0 ? (
              <div className="a11y-card text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto a11y-text-secondary mb-4" />
                <p className="text-a11y-lg a11y-text-secondary">暂无符合条件的食谱</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredRecipes.map((recipe) => {
                  const isExpanded = expandedRecipe === recipe.id;
                  return (
                    <article
                      key={recipe.id}
                      className="a11y-card overflow-hidden animate-slide-up"
                    >
                      <button
                        onClick={() =>
                          setExpandedRecipe(isExpanded ? null : recipe.id)
                        }
                        className="w-full text-left"
                        aria-expanded={isExpanded}
                        aria-label={`${recipe.name}，点击${isExpanded ? "收起" : "展开"}详情`}
                      >
                        <div className="relative">
                          <img
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-full h-52 object-cover rounded-a11y"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop";
                            }}
                          />
                        </div>
                        <div className="pt-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-a11y-xl font-bold a11y-text">
                              {recipe.name}
                            </h3>
                            <span className="flex items-center gap-1 text-a11y-sm a11y-text-secondary flex-shrink-0">
                              <Clock className="w-5 h-5" />
                              {recipe.cookTime}
                            </span>
                          </div>
                          <p className="text-a11y-base a11y-text-secondary">
                            {recipe.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {recipe.nutritionTags.map((tag) => (
                              <span
                                key={tag}
                                className="a11y-tag"
                                style={{
                                  backgroundColor: "rgba(255, 122, 69, 0.12)",
                                  color: "var(--color-primary)",
                                }}
                              >
                                <Flame className="w-4 h-4 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 text-a11y-sm a11y-text-secondary">
                            <Users className="w-5 h-5" />
                            <span>适合人群：{recipe.suitableAges}</span>
                          </div>
                          <div className="flex items-center justify-center pt-2 text-a11y-base font-medium" style={{ color: "var(--color-primary)" }}>
                            {isExpanded ? (
                              <>收起详情 <ChevronUp className="w-5 h-5 ml-1" /></>
                            ) : (
                              <>查看详情 <ChevronDown className="w-5 h-5 ml-1" /></>
                            )}
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-5 animate-fade-in" style={{ borderColor: "var(--color-border)" }}>
                          <div>
                            <h4 className="text-a11y-lg font-bold a11y-text mb-3 flex items-center gap-2">
                              <span className="w-2 h-6 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                              食材清单
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {recipe.ingredients.map((ing) => (
                                <div
                                  key={ing.name}
                                  className="flex items-center justify-between p-3 rounded-a11y"
                                  style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                                >
                                  <span className="a11y-text">{ing.name}</span>
                                  <span className="a11y-text-secondary font-medium">{ing.amount}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-a11y-lg font-bold a11y-text mb-3 flex items-center gap-2">
                              <span className="w-2 h-6 rounded-full" style={{ backgroundColor: "var(--color-secondary)" }} />
                              制作步骤
                            </h4>
                            <ol className="space-y-3">
                              {recipe.steps.map((s) => (
                                <li key={s.step} className="flex gap-4 p-3 rounded-a11y" style={{ backgroundColor: "rgba(44, 122, 123, 0.06)" }}>
                                  <span
                                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                                    style={{ backgroundColor: "var(--color-secondary)" }}
                                  >
                                    {s.step}
                                  </span>
                                  <p className="a11y-text text-a11y-base leading-relaxed pt-1">
                                    {s.description}
                                  </p>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === "exercise" && baduanjin && (
          <section className="animate-fade-in space-y-5">
            <h2 className="text-a11y-lg font-bold a11y-text px-2 flex items-center gap-2">
              <Dumbbell className="w-7 h-7 text-green-600" />
              八段锦教学
            </h2>

            <article className="a11y-card animate-slide-up">
              <div className="relative rounded-a11y overflow-hidden group">
                <img
                  src={baduanjin.thumbnail}
                  alt={baduanjin.name}
                  className="w-full h-72 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop";
                  }}
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <button
                    onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                    className="w-24 h-24 rounded-full bg-white/95 flex items-center justify-center shadow-a11y-hover transition-transform hover:scale-110 active:scale-95"
                    aria-label={isVideoPlaying ? "暂停播放" : "开始播放"}
                  >
                    {isVideoPlaying ? (
                      <Pause className="w-12 h-12 text-gray-800" fill="currentColor" />
                    ) : (
                      <Play className="w-12 h-12 text-gray-800 ml-1" fill="currentColor" />
                    )}
                  </button>
                </div>
                {isVideoPlaying && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full animate-pulse-soft"
                        style={{ width: "35%", backgroundColor: "var(--color-primary)" }}
                      />
                    </div>
                    <p className="text-white text-a11y-base mt-2 font-medium">
                      正在播放：{baduanjin.name} · {baduanjin.duration}
                    </p>
                  </div>
                )}
              </div>
              <div className="pt-5 space-y-3">
                <h3 className="text-a11y-xl font-bold a11y-text">{baduanjin.name}</h3>
                <p className="text-a11y-base a11y-text-secondary leading-relaxed">
                  {baduanjin.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {baduanjin.benefits.map((b) => (
                    <span
                      key={b}
                      className="a11y-tag"
                      style={{
                        backgroundColor: "rgba(56, 161, 105, 0.12)",
                        color: "#38a169",
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {b}
                    </span>
                  ))}
                </div>
                <p className="text-a11y-base a11y-text-secondary flex items-center gap-2 pt-1">
                  <Users className="w-5 h-5" />
                  适合人群：{baduanjin.suitableFor}
                </p>
              </div>
            </article>

            <article className="a11y-card animate-slide-up">
              <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                <h3 className="text-a11y-xl font-bold a11y-text flex items-center gap-2">
                  <span className="w-2 h-8 rounded-full" style={{ backgroundColor: "var(--color-secondary)" }} />
                  动作分解（{baduanjin.moves.length}式）
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-a11y-base a11y-text font-medium">每日练习提醒</span>
                  <button
                    onClick={() => setDailyReminder(!dailyReminder)}
                    className={cn(
                      "relative w-16 h-9 rounded-full transition-colors",
                      dailyReminder ? "bg-green-500" : "bg-gray-300"
                    )}
                    role="switch"
                    aria-checked={dailyReminder}
                    aria-label="每日练习提醒开关"
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-7 h-7 rounded-full bg-white shadow transition-transform",
                        dailyReminder ? "translate-x-8" : "translate-x-1"
                      )}
                    />
                  </button>
                </label>
              </div>
              <ol className="space-y-4">
                {baduanjin.moves.map((move, idx) => (
                  <li
                    key={idx}
                    className="p-4 rounded-a11y space-y-2"
                    style={{ backgroundColor: "rgba(44, 122, 123, 0.05)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-a11y-lg"
                        style={{ backgroundColor: "var(--color-secondary)" }}
                      >
                        {idx + 1}
                      </span>
                      <h4 className="text-a11y-lg font-bold a11y-text">{move.name}</h4>
                    </div>
                    <p className="text-a11y-base a11y-text leading-relaxed pl-14">
                      {move.description}
                    </p>
                    {move.tip && (
                      <div className="flex gap-2 pl-14 items-start">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--color-warning)" }} />
                        <p className="text-a11y-base" style={{ color: "var(--color-warning)" }}>
                          <span className="font-bold">要领提示：</span>
                          {move.tip}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </article>
          </section>
        )}

        {activeTab === "medicine" && (
          <section className="animate-fade-in space-y-5">
            <h2 className="text-a11y-lg font-bold a11y-text px-2 flex items-center gap-2">
              <Pill className="w-7 h-7 text-blue-600" />
              用药提醒
            </h2>

            <div className="space-y-4">
              {medicines.filter((m) => m.enabled).map((medicine) => (
                <article
                  key={medicine.id}
                  className="a11y-card animate-slide-up space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-a11y-xl font-bold a11y-text flex items-center gap-2">
                        <Pill className="w-6 h-6 text-blue-600" />
                        {medicine.name}
                      </h3>
                      <p className="text-a11y-base a11y-text-secondary">
                        剂量：{medicine.dosage}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {medicine.times.map((time, idx) => {
                      const taken = medicine.takenToday[idx];
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "p-5 rounded-a11y border-2 transition-all",
                            taken
                              ? "bg-green-50 border-green-400"
                              : "border-dashed"
                          )}
                          style={{
                            borderColor: taken ? undefined : "var(--color-border)",
                            backgroundColor: taken ? "rgba(56, 161, 105, 0.08)" : undefined,
                          }}
                        >
                          <p className="text-a11y-2xl font-bold a11y-text mb-2">
                            {time}
                          </p>
                          <button
                            onClick={() => toggleMedicineTaken(medicine.id, idx)}
                            className={cn(
                              "a11y-btn w-full py-3 text-a11y-base font-bold",
                              taken ? "a11y-btn-secondary" : "a11y-btn-primary"
                            )}
                            aria-pressed={taken}
                          >
                            {taken ? (
                              <>
                                <Check className="w-6 h-6" />
                                已服用
                              </>
                            ) : (
                              <>标记为已服用</>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t space-y-3" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex gap-2 items-start">
                      <BookOpen className="w-6 h-6 flex-shrink-0 mt-1 text-blue-600" />
                      <div>
                        <p className="text-a11y-base font-bold a11y-text">用药说明</p>
                        <p className="text-a11y-base a11y-text-secondary leading-relaxed">
                          {medicine.instructions}
                        </p>
                      </div>
                    </div>
                    {medicine.sideEffects.length > 0 && (
                      <div className="flex gap-2 items-start">
                        <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: "var(--color-warning)" }} />
                        <div>
                          <p className="text-a11y-base font-bold" style={{ color: "var(--color-warning)" }}>
                            注意事项
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {medicine.sideEffects.map((se) => (
                              <span
                                key={se}
                                className="a11y-tag"
                                style={{
                                  backgroundColor: "rgba(214, 158, 46, 0.12)",
                                  color: "var(--color-warning)",
                                }}
                              >
                                <X className="w-4 h-4 mr-1" />
                                {se}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="a11y-card animate-slide-up">
              <LargeButton
                variant="primary"
                size="xlarge"
                fullWidth
                icon={<Check className="w-7 h-7" />}
              >
                全部标记为已服用
              </LargeButton>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
