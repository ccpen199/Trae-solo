import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Clock,
  Flame,
  ChefHat,
  Check,
} from "lucide-react";

export default function RecipeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recipes: Record<
    string,
    {
      title: string;
      description: string;
      cookTime: string;
      calories: string;
      image: string;
      ingredients: { name: string; amount: string }[];
      steps: string[];
      tips: string[];
    }
  > = {
    "1": {
      title: "冬瓜薏米排骨汤",
      description: "清热利湿，适合夏季食用，对高血压、高血脂患者友好",
      cookTime: "90分钟",
      calories: "280千卡/份",
      image:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20winter%20melon%20and%20barley%20pork%20rib%20soup%20in%20a%20white%20ceramic%20pot%20on%20a%20wooden%20table%20steam%20rising&image_size=landscape_16_9",
      ingredients: [
        { name: "猪排骨", amount: "500克" },
        { name: "冬瓜", amount: "400克" },
        { name: "薏米", amount: "50克" },
        { name: "生姜", amount: "3片" },
        { name: "葱段", amount: "2段" },
        { name: "盐", amount: "适量" },
        { name: "料酒", amount: "1勺" },
      ],
      steps: [
        "薏米提前浸泡2小时，冬瓜去皮切大块",
        "排骨冷水下锅，加料酒焯水去腥，捞出冲洗干净",
        "锅中放入排骨、薏米、生姜、葱段，加足量清水",
        "大火煮沸后转小火炖煮60分钟",
        "加入冬瓜块继续炖煮20分钟",
        "最后加适量盐调味即可",
      ],
      tips: [
        "薏米性寒，脾胃虚寒者可少量食用",
        "冬瓜去皮不要去瓤，瓜瓤营养更丰富",
        "炖煮时不要过早加盐，以免肉质变硬",
      ],
    },
    "2": {
      title: "清蒸鲈鱼",
      description: "高蛋白低脂肪，营养丰富，适合糖尿病、高血脂患者",
      cookTime: "25分钟",
      calories: "180千卡/份",
      image:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=steamed%20sea%20bass%20with%20scallions%20and%20ginger%20on%20a%20white%20plate%20chinese%20cuisine%20soy%20sauce&image_size=landscape_16_9",
      ingredients: [
        { name: "鲈鱼", amount: "1条（约500克）" },
        { name: "大葱", amount: "2根" },
        { name: "生姜", amount: "1块" },
        { name: "蒸鱼豉油", amount: "3勺" },
        { name: "料酒", amount: "1勺" },
        { name: "食用油", amount: "2勺" },
      ],
      steps: [
        "鲈鱼处理干净，两面各划3刀，抹上料酒腌制10分钟",
        "大葱切丝，生姜一半切片一半切丝",
        "盘底铺上姜片和部分葱丝，放上鲈鱼",
        "水烧开后，将鱼放入蒸锅，大火蒸8-10分钟",
        "取出蒸好的鱼，倒掉盘中汤汁，铺上葱丝和姜丝",
        "淋上蒸鱼豉油，烧热油浇在葱丝上即可",
      ],
      tips: [
        "蒸鱼时间根据鱼的大小调整，8分钟后可用筷子检查",
        "鱼眼凸出表示鱼已蒸熟",
        "选择新鲜活鱼，口感最佳",
      ],
    },
    "3": {
      title: "燕麦南瓜粥",
      description: "养胃健脾，控糖好选择，适合糖尿病、高血压患者",
      cookTime: "40分钟",
      calories: "150千卡/份",
      image:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oatmeal%20and%20pumpkin%20porridge%20in%20a%20ceramic%20bowl%20healthy%20breakfast%20with%20pumpkin%20cubes&image_size=landscape_16_9",
      ingredients: [
        { name: "燕麦片", amount: "80克" },
        { name: "南瓜", amount: "300克" },
        { name: "大米", amount: "30克" },
        { name: "清水", amount: "1000毫升" },
        { name: "枸杞", amount: "适量（可选）" },
      ],
      steps: [
        "南瓜去皮去籽，切成小块",
        "大米淘洗干净，燕麦片准备好",
        "锅中加水烧开，放入大米煮10分钟",
        "加入南瓜块继续煮15分钟至南瓜软烂",
        "加入燕麦片搅拌均匀，再煮10分钟",
        "期间不断搅拌防止粘锅，煮至粘稠即可",
      ],
      tips: [
        "选择无糖纯燕麦片，不要用速溶麦片",
        "南瓜本身有甜味，不需要加糖",
        "枸杞最后放，煮2分钟即可",
      ],
    },
    "4": {
      title: "凉拌黑木耳",
      description: "清血管降血脂，爽口开胃，适合高血压、高血脂患者",
      cookTime: "15分钟",
      calories: "80千卡/份",
      image:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20cold%20black%20fungus%20salad%20with%20coriander%20garlic%20and%20chili%20on%20a%20white%20plate&image_size=landscape_16_9",
      ingredients: [
        { name: "干黑木耳", amount: "30克" },
        { name: "香菜", amount: "2根" },
        { name: "大蒜", amount: "3瓣" },
        { name: "生抽", amount: "2勺" },
        { name: "香醋", amount: "1勺" },
        { name: "香油", amount: "少许" },
      ],
      steps: [
        "干黑木耳用温水泡发20分钟，去蒂洗净",
        "香菜切段，大蒜切末备用",
        "锅中烧水，水开后放入木耳焯水2分钟",
        "捞出木耳过凉水，沥干水分",
        "大碗中放入木耳、香菜、蒜末",
        "加入生抽、香醋、香油拌匀即可",
      ],
      tips: [
        "干木耳泡发时间不宜过长，最多4小时",
        "焯水时间不要太长，保持爽脆口感",
        "可根据口味加少许辣椒提味",
      ],
    },
  };

  const recipe = recipes[id || "1"] || recipes["1"];

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    } else {
      const text = `${recipe.title}。${recipe.description}。食材：${recipe.ingredients
        .map((i) => `${i.name}${i.amount}`)
        .join("，")}。做法步骤：${recipe.steps
        .map((s, i) => `第${i + 1}步，${s}`)
        .join("。")}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis?.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <ArrowLeft size={36} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center text-[32px] font-bold text-gray-800">
            食谱详情
          </h1>
          <div className="w-14" />
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-lg mb-8">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[36px] font-bold text-gray-900 mb-2">
                  {recipe.title}
                </h2>
                <p className="text-[22px] text-gray-600">{recipe.description}</p>
              </div>
              <button
                onClick={handleSpeak}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                  isSpeaking
                    ? "bg-red-500 text-white"
                    : "bg-orange-500 text-white"
                }`}
              >
                {isSpeaking ? (
                  <VolumeX size={36} />
                ) : (
                  <Volume2 size={36} />
                )}
              </button>
            </div>
            <div className="flex items-center gap-8 text-[22px] text-gray-600">
              <span className="flex items-center gap-3">
                <Clock size={28} className="text-orange-500" />
                {recipe.cookTime}
              </span>
              <span className="flex items-center gap-3">
                <Flame size={28} className="text-red-500" />
                {recipe.calories}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <ChefHat size={32} className="text-white" />
            </div>
            <h2 className="text-[28px] font-bold text-gray-800">食材清单</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipe.ingredients.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-green-50 rounded-xl p-4"
              >
                <span className="text-[22px] text-gray-800">{item.name}</span>
                <span className="text-[22px] font-bold text-green-600">
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <Check size={32} className="text-white" />
            </div>
            <h2 className="text-[28px] font-bold text-gray-800">做法步骤</h2>
          </div>
          <div className="space-y-6">
            {recipe.steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-6 bg-blue-50 rounded-xl p-6"
              >
                <span className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-[24px] font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <p className="text-[24px] text-gray-700 leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6">
          <h2 className="text-[26px] font-bold text-yellow-800 mb-4">
            💡 小贴士
          </h2>
          <ul className="space-y-3">
            {recipe.tips.map((tip, index) => (
              <li
                key={index}
                className="text-[22px] text-yellow-900 flex items-start gap-3"
              >
                <span className="text-yellow-600">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {isSpeaking && (
          <div className="fixed bottom-8 left-0 right-0 px-6">
            <div className="max-w-4xl mx-auto bg-red-500 text-white rounded-2xl p-6 flex items-center justify-between">
              <p className="text-[24px] font-bold">🔊 正在语音播报...</p>
              <button
                onClick={handleSpeak}
                className="bg-white text-red-500 px-8 py-3 rounded-xl text-[22px] font-bold active:scale-95 transition-transform"
              >
                停止
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
