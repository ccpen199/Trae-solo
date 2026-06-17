import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PawPrint,
  Plus,
  X,
  Heart,
  Syringe,
  Stethoscope,
  Calendar,
  Dog,
  Cat,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Pet, Species, Gender } from "../../shared/types";

const healthIconMap: Record<string, typeof Syringe> = {
  vaccination: Syringe,
  checkup: Stethoscope,
  illness: Heart,
  surgery: Heart,
};

const speciesAvatarMap: Record<Species, string> = {
  dog: "/api/ide/v1/text_to_image?prompt=adorable%20golden%20retriever%20puppy%20portrait%20fluffy%20happy%20face%20soft%20studio%20lighting&image_size=square",
  cat: "/api/ide/v1/text_to_image?prompt=cute%20british%20shorthair%20cat%20portrait%20round%20face%20big%20eyes%20soft%20pastel%20background&image_size=square",
};

export default function Pets() {
  const navigate = useNavigate();
  const { pets, addPet, currentUser } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    species: "dog" as Species,
    breed: "",
    age: 1,
    gender: "male" as Gender,
    personalityTags: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.breed) return;

    const newPet: Pet = {
      id: "p" + Date.now(),
      userId: currentUser.id,
      name: form.name,
      species: form.species,
      breed: form.breed,
      age: form.age,
      gender: form.gender,
      personalityTags: form.personalityTags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      avatar: speciesAvatarMap[form.species],
      healthRecords: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    addPet(newPet);
    setShowModal(false);
    setForm({
      name: "",
      species: "dog",
      breed: "",
      age: 1,
      gender: "male",
      personalityTags: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-display text-warm-brown flex items-center gap-2">
            <PawPrint className="w-8 h-8 text-brand-orange" />
            宠物档案
          </h1>
          <p className="text-warm-gray mt-1">管理你的毛孩子们，记录每一份陪伴</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-orange to-brand-orange-light text-white rounded-2xl font-medium shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          新增宠物
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {pets.map((pet, idx) => (
          <div
            key={pet.id}
            onClick={() => navigate(`/pets/${pet.id}`)}
            className={`group cursor-pointer bg-white rounded-3xl shadow-soft hover:shadow-hover transition-all duration-500 overflow-hidden animate-stagger-${
              (idx % 4) + 1
            } hover:-translate-y-1`}
          >
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-cream-100 to-cream-200">
              <img
                src={pet.avatar}
                alt={pet.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full flex items-center gap-1.5 shadow-soft">
                {pet.species === "dog" ? (
                  <Dog className="w-4 h-4 text-brand-orange" />
                ) : (
                  <Cat className="w-4 h-4 text-brand-mint" />
                )}
                <span className="text-xs font-medium text-warm-brown">
                  {pet.gender === "male" ? "♂ 男孩" : "♀ 女孩"}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-display text-warm-brown">
                    {pet.name}
                  </h3>
                  <p className="text-sm text-warm-gray flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent-sunny" />
                    {pet.breed} · {pet.age}岁
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-warm-gray opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {pet.personalityTags.map((tag, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      i % 2 === 0
                        ? "bg-brand-orange/10 text-brand-orange-dark"
                        : "bg-brand-mint/10 text-brand-mint-dark"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                {pet.personalityTags.length === 0 && (
                  <span className="text-xs text-warm-gray">暂无性格标签</span>
                )}
              </div>

              <div className="pt-4 border-t border-cream-200">
                {pet.healthRecords.length > 0 ? (
                  <div className="space-y-2">
                    {pet.healthRecords.slice(0, 1).map((hr) => {
                      const Icon = healthIconMap[hr.type] || Stethoscope;
                      return (
                        <div
                          key={hr.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-7 h-7 rounded-xl bg-brand-mint/10 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5 text-brand-mint-dark" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-warm-brown truncate font-medium">
                              {hr.description}
                            </p>
                            <p className="text-xs text-warm-gray flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {hr.date}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {pet.healthRecords.length > 1 && (
                      <p className="text-xs text-warm-gray pl-9">
                        还有 {pet.healthRecords.length - 1} 条健康记录
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-warm-gray">
                    <Heart className="w-4 h-4 text-brand-orange-light" />
                    <span>暂无健康记录，点击添加</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-brown/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-hover animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-cream-200 bg-gradient-to-r from-cream-100 to-cream-50">
              <h2 className="text-xl font-display text-warm-brown flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-orange" />
                添加新成员
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-white text-warm-gray transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-warm-brown">名字</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="如：豆豆"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all text-warm-brown"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-warm-brown">品种</label>
                  <input
                    type="text"
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    placeholder="如：柴犬"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all text-warm-brown"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-warm-brown">
                    物种
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, species: "dog" })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${
                        form.species === "dog"
                          ? "border-brand-orange bg-brand-orange/5 text-brand-orange-dark"
                          : "border-cream-200 text-warm-gray hover:border-cream-200"
                      }`}
                    >
                      <Dog className="w-4 h-4" />
                      狗狗
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, species: "cat" })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${
                        form.species === "cat"
                          ? "border-brand-mint bg-brand-mint/5 text-brand-mint-dark"
                          : "border-cream-200 text-warm-gray hover:border-cream-200"
                      }`}
                    >
                      <Cat className="w-4 h-4" />
                      猫猫
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-warm-brown">
                    年龄
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={form.age}
                    onChange={(e) =>
                      setForm({ ...form, age: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all text-warm-brown"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-warm-brown">性别</label>
                <div className="flex gap-2">
                  {(["male", "female"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm({ ...form, gender: g })}
                      className={`flex-1 py-2.5 rounded-xl border-2 transition-all font-medium ${
                        form.gender === g
                          ? g === "male"
                            ? "border-brand-orange bg-brand-orange/5 text-brand-orange-dark"
                            : "border-accent-pink bg-accent-pink/20 text-pink-600"
                          : "border-cream-200 text-warm-gray"
                      }`}
                    >
                      {g === "male" ? "♂ 公" : "♀ 母"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-warm-brown">
                  性格标签
                  <span className="text-xs text-warm-gray ml-1">
                    （逗号分隔）
                  </span>
                </label>
                <input
                  type="text"
                  value={form.personalityTags}
                  onChange={(e) =>
                    setForm({ ...form, personalityTags: e.target.value })
                  }
                  placeholder="如：活泼, 贪吃, 亲人"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all text-warm-brown"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-cream-200 text-warm-gray font-medium hover:bg-cream-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-orange-light text-white font-medium shadow-soft hover:shadow-hover transition-all"
                >
                  提交档案
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
