import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UtensilsCrossed,
  Activity,
  Pill,
  Clock,
  Flame,
  Users,
  Heart,
  Droplets,
  ChefHat,
} from "lucide-react";

export default function Health() {
  const navigate = useNavigate();
  const [selectedAge, setSelectedAge] = useState<string>("all");
  const [selectedDisease, setSelectedDisease] = useState<string>("all");

  const ageGroups = [
    { id: "all", label: "全部" },
    { id: "55-65", label: "55-65岁" },
    { id: "65-75", label: "65-75岁" },
    { id: "75+", label: "75岁以上" },
  ];

  const diseases = [
    { id: "all", label: "全部" },
    { id: "hypertension", label: "高血压" },
    { id: "diabetes", label: "糖尿病" },
    { id: "hyperlipidemia", label: "高血脂" },
  ];

  const recipes = [
    {
      id: 1,
      title: "冬瓜薏米排骨汤",
      description: "清热利湿，适合夏季食用",
      suitableFor: ["高血压", "高血脂"],
      cookTime: "90分钟",
      calories: "280千卡",
      image:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20winter%20melon%20and%20barley%20pork%20rib%20soup%20in%20a%20white%20ceramic%20pot%20on%20a%20wooden%20table&image_size=square_hd",
    },
    {
      id: 2,
      title: "清蒸鲈鱼",
      description: "高蛋白低脂肪，营养丰富",
      suitableFor: ["糖尿病", "高血脂"],
      cookTime: "25分钟",
      calories: "180千卡",
      image:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=steamed%20sea%20bass%20with%20scallions%20and%20ginger%20on%20a%20white%20plate%20chinese%20cuisine&image_size=square_hd",
    },
    {
      id: 3,
      title: "燕麦南瓜粥",
      description: "养胃健脾，控糖好选择",
      suitableFor: ["糖尿病", "高血压"],
      cookTime: "40分钟",
      calories: "150千卡",
      image:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oatmeal%20and%20pumpkin%20porridge%20in%20a%20bowl%20healthy%20breakfast&image_size=square_hd",
    },
    {
      id: 4,
      title: "凉拌黑木耳",
      description: "清血管降血脂，爽口开胃",
      suitableFor: ["高血压", "高血脂"],
      cookTime: "15分钟",
      calories: "80千卡",
      image:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20cold%20black%20fungus%20salad%20with%20coriander%20and%20garlic%20on%20a%20plate&image_size=square_hd",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <ArrowLeft size={36} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center text-[32px] font-bold text-gray-800">
            健康知识
          </h1>
          <div className="w-14" />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate("/exercise")}
            className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center active:scale-98 transition-transform border-2 border-transparent hover:border-green-300"
          >
            <div className="bg-orange-500 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <Activity size={48} className="text-white" />
            </div>
            <p className="text-[26px] font-bold text-gray-800">八段锦教学</p>
            <p className="text-[20px] text-gray-500 mt-2">强身健体</p>
          </button>
          <button
            onClick={() => navigate("/medication")}
            className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center active:scale-98 transition-transform border-2 border-transparent hover:border-blue-300"
          >
            <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <Pill size={48} className="text-white" />
            </div>
            <p className="text-[26px] font-bold text-gray-800">用药提醒</p>
            <p className="text-[20px] text-gray-500 mt-2">按时服药</p>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-8">
          <h2 className="text-[28px] font-bold text-gray-800 mb-6">筛选条件</h2>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Users size={28} className="text-gray-600" />
              <p className="text-[22px] font-bold text-gray-700">年龄段</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {ageGroups.map((age) => (
                <button
                  key={age.id}
                  onClick={() => setSelectedAge(age.id)}
                  className={`px-8 py-4 rounded-xl text-[22px] font-bold transition-all ${
                    selectedAge === age.id
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {age.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Heart size={28} className="text-gray-600" />
              <p className="text-[22px] font-bold text-gray-700">慢性病</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {diseases.map((disease) => (
                <button
                  key={disease.id}
                  onClick={() => setSelectedDisease(disease.id)}
                  className={`px-8 py-4 rounded-xl text-[22px] font-bold transition-all ${
                    selectedDisease === disease.id
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {disease.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-[28px] font-bold text-gray-800 mb-6">
          <span className="flex items-center gap-3">
            <ChefHat size={36} className="text-orange-500" />
            食谱推荐
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => navigate(`/recipe/${recipe.id}`)}
              className="bg-white rounded-2xl overflow-hidden active:scale-98 transition-transform text-left"
            >
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-[26px] font-bold text-gray-900 mb-2">
                  {recipe.title}
                </h3>
                <p className="text-[20px] text-gray-600 mb-4">
                  {recipe.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {recipe.suitableFor.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-[18px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-6 text-[20px] text-gray-500">
                  <span className="flex items-center gap-2">
                    <Clock size={24} />
                    {recipe.cookTime}
                  </span>
                  <span className="flex items-center gap-2">
                    <Flame size={24} />
                    {recipe.calories}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
