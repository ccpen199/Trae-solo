import { create } from "zustand";
import type {
  User,
  Pet,
  VoiceprintAnalysis,
  Photo,
  CommunityPost,
  TrainingRecord,
  WeeklyReport,
  VoiceprintSample,
  ModelVersion,
  ContentReviewItem,
  FeedingPlan,
} from "../../shared/types";

interface AppState {
  currentUser: User;
  pets: Pet[];
  analyses: VoiceprintAnalysis[];
  photos: Photo[];
  posts: CommunityPost[];
  trainingRecords: TrainingRecord[];
  weeklyReport: WeeklyReport | null;
  samples: VoiceprintSample[];
  modelVersions: ModelVersion[];
  reviewItems: ContentReviewItem[];
  feedingPlans: FeedingPlan[];
  selectedPetId: string | null;
  currentTab: string;

  setSelectedPetId: (id: string | null) => void;
  setCurrentTab: (tab: string) => void;
  addPet: (pet: Pet) => void;
  updatePet: (pet: Pet) => void;
  addAnalysis: (analysis: VoiceprintAnalysis) => void;
  updateAnalysis: (analysis: VoiceprintAnalysis) => void;
  addPhoto: (photo: Photo) => void;
  updatePhoto: (photo: Photo) => void;
  addTrainingRecord: (record: TrainingRecord) => void;
  addPost: (post: CommunityPost) => void;
  updateSampleStatus: (
    id: string,
    status: VoiceprintSample["status"],
    finalAnnotation: string | null
  ) => void;
  updateReviewStatus: (
    id: string,
    status: ContentReviewItem["status"]
  ) => void;
  triggerFineTune: () => void;
}

const localGeneratedImage = (url: string) =>
  url.replace("https://trae-api-cn.mchost.guru", "");

const mockUser: User = {
  id: "u1",
  name: "小林",
  email: "xiaolin@example.com",
  avatar:
    "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20of%20a%20friendly%20young%20asian%20pet%20owner%20woman%20warm%20smile%20soft%20lighting%20pastel%20colors&image_size=square",
  role: "user",
  createdAt: "2025-12-01",
};

const mockPets: Pet[] = [
  {
    id: "p1",
    userId: "u1",
    name: "豆豆",
    species: "dog",
    breed: "柴犬",
    age: 3,
    gender: "male",
    personalityTags: ["活泼", "贪吃", "亲人"],
    avatar:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=adorable%20shiba%20inu%20dog%20portrait%20fluffy%20orange%20fur%20happy%20face%20white%20background%20soft%20studio%20lighting&image_size=square",
    healthRecords: [
      {
        id: "h1",
        type: "vaccination",
        date: "2026-05-10",
        description: "狂犬疫苗接种",
      },
      {
        id: "h2",
        type: "checkup",
        date: "2026-04-20",
        description: "年度体检，各项指标正常",
      },
    ],
    createdAt: "2025-12-10",
  },
  {
    id: "p2",
    userId: "u1",
    name: "奶茶",
    species: "cat",
    breed: "布偶猫",
    age: 2,
    gender: "female",
    personalityTags: ["温柔", "粘人", "安静"],
    avatar:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20ragdoll%20cat%20portrait%20blue%20eyes%20fluffy%20cream%20fur%20elegant%20pose%20soft%20pastel%20background&image_size=square",
    healthRecords: [
      {
        id: "h3",
        type: "vaccination",
        date: "2026-05-15",
        description: "猫三联疫苗",
      },
    ],
    createdAt: "2026-01-20",
  },
];

const mockAnalyses: VoiceprintAnalysis[] = [
  {
    id: "a1",
    petId: "p1",
    audioUrl: "/audio/demo1.wav",
    emotion: "happy",
    emotionLabel: "开心",
    confidence: 0.92,
    semanticText: "主人回来啦！我超级开心，快摸摸我！",
    voiceprintReport: {
      frequency: 450,
      duration: 1.8,
      intensity: 0.78,
      pattern: "高频短促连续吠叫",
    },
    createdAt: "2026-06-14 18:23",
    reviewStatus: "approved",
    reviewNote: "情绪识别准确，声纹特征匹配柴犬开心吠叫模式",
    reviewHistory: [
      { status: "pending", at: "2026-06-14 18:23", by: "系统" },
      { status: "approved", note: "情绪识别准确，声纹特征匹配柴犬开心吠叫模式", at: "2026-06-14 18:25", by: "小林" },
    ],
  },
  {
    id: "a2",
    petId: "p2",
    audioUrl: "/audio/demo2.wav",
    emotion: "hungry",
    emotionLabel: "饥饿",
    confidence: 0.87,
    semanticText: "肚子好饿呀，小鱼干什么时候才来呢？",
    voiceprintReport: {
      frequency: 320,
      duration: 2.4,
      intensity: 0.55,
      pattern: "拖长音的轻柔喵叫",
    },
    createdAt: "2026-06-14 08:15",
    reviewStatus: "pending",
    reviewHistory: [
      { status: "pending", at: "2026-06-14 08:15", by: "系统" },
    ],
  },
  {
    id: "a3",
    petId: "p1",
    audioUrl: "/audio/demo3.wav",
    emotion: "playful",
    emotionLabel: "想玩耍",
    confidence: 0.88,
    semanticText: "球球呢？我们来玩捡球游戏好不好！",
    voiceprintReport: {
      frequency: 520,
      duration: 1.2,
      intensity: 0.82,
      pattern: "跳跃式激动吠叫",
    },
    createdAt: "2026-06-13 16:40",
    reviewStatus: "rejected",
    reviewNote: "声纹强度偏高，实际更像是兴奋吠叫而非玩耍邀请",
    reviewHistory: [
      { status: "pending", at: "2026-06-13 16:40", by: "系统" },
      { status: "rejected", note: "声纹强度偏高，实际更像是兴奋吠叫而非玩耍邀请", at: "2026-06-13 17:00", by: "小林" },
    ],
  },
  {
    id: "a4",
    petId: "p2",
    audioUrl: "/audio/demo4.wav",
    emotion: "curious",
    emotionLabel: "好奇",
    confidence: 0.83,
    semanticText: "那个奇怪的盒子里面有什么？让我看看！",
    voiceprintReport: {
      frequency: 480,
      duration: 0.9,
      intensity: 0.45,
      pattern: "短促升调颤音喵叫",
    },
    createdAt: "2026-06-13 11:05",
  },
  {
    id: "a5",
    petId: "p1",
    audioUrl: "/audio/demo5.wav",
    emotion: "anxious",
    emotionLabel: "焦虑",
    confidence: 0.79,
    semanticText: "怎么还不回家...我好担心你在外面...",
    voiceprintReport: {
      frequency: 380,
      duration: 3.2,
      intensity: 0.62,
      pattern: "低频持续呜咽声",
    },
    createdAt: "2026-06-12 20:15",
  },
  {
    id: "a6",
    petId: "p2",
    audioUrl: "/audio/demo6.wav",
    emotion: "sleepy",
    emotionLabel: "困倦",
    confidence: 0.91,
    semanticText: "好困呀...让我再睡五分钟嘛...",
    voiceprintReport: {
      frequency: 220,
      duration: 1.5,
      intensity: 0.3,
      pattern: "低沉拖长的呼噜喵叫",
    },
    createdAt: "2026-06-12 14:30",
  },
  {
    id: "a7",
    petId: "p1",
    audioUrl: "/audio/demo7.wav",
    emotion: "hungry",
    emotionLabel: "饥饿",
    confidence: 0.85,
    semanticText: "饭碗空了！快点给我加狗粮！",
    voiceprintReport: {
      frequency: 490,
      duration: 2.0,
      intensity: 0.75,
      pattern: "中高频急促反复吠叫",
    },
    createdAt: "2026-06-12 07:50",
  },
  {
    id: "a8",
    petId: "p2",
    audioUrl: "/audio/demo8.wav",
    emotion: "playful",
    emotionLabel: "想玩耍",
    confidence: 0.84,
    semanticText: "逗猫棒在哪里？我要追着它跑！",
    voiceprintReport: {
      frequency: 560,
      duration: 0.7,
      intensity: 0.68,
      pattern: "快速升调啁啾式喵叫",
    },
    createdAt: "2026-06-11 19:20",
  },
];

const mockPhotos: Photo[] = [
  {
    id: "ph1",
    petId: "p1",
    imageUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=happy%20shiba%20inu%20playing%20with%20yellow%20ball%20in%20sunny%20park%20green%20grass%20vibrant%20colors&image_size=portrait_4_3",
    thumbnailUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=happy%20shiba%20inu%20playing%20with%20yellow%20ball%20in%20sunny%20park%20green%20grass%20vibrant%20colors&image_size=square",
    autoTags: ["playing"],
    userTags: ["公园", "周末"],
    filterApplied: "warm",
    bubbleTemplate: "cloud",
    bubbleText: "我要接住！",
    createdAt: "2026-06-14 15:30",
    tagEvidence: { playing: "检测到球类物体+张嘴兴奋表情+四肢离地姿态，置信度92%" },
    availableFilters: ["warm", "vivid", "soft", "retro"],
  },
  {
    id: "ph2",
    petId: "p2",
    imageUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20ragdoll%20cat%20sleeping%20peacefully%20on%20fluffy%20blanket%20sunlight%20cozy%20bedroom%20warm%20tones&image_size=portrait_4_3",
    thumbnailUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20ragdoll%20cat%20sleeping%20peacefully%20on%20fluffy%20blanket%20sunlight%20cozy%20bedroom%20warm%20tones&image_size=square",
    autoTags: ["sleeping"],
    userTags: ["午觉", "治愈"],
    filterApplied: "soft",
    bubbleTemplate: "round",
    bubbleText: "zzZ...梦里有小鱼干",
    createdAt: "2026-06-13 14:20",
    tagEvidence: { sleeping: "检测到闭眼姿态+蜷缩体态+柔软卧垫场景，置信度96%" },
    availableFilters: ["soft", "dreamy", "warm", "pastel"],
  },
  {
    id: "ph3",
    petId: "p1",
    imageUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shiba%20inu%20eating%20delicious%20dog%20food%20from%20bowl%20excited%20happy%20wooden%20floor%20kitchen&image_size=portrait_4_3",
    thumbnailUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shiba%20inu%20eating%20delicious%20dog%20food%20from%20bowl%20excited%20happy%20wooden%20floor%20kitchen&image_size=square",
    autoTags: ["eating"],
    userTags: ["晚餐"],
    filterApplied: "warm",
    bubbleTemplate: "cloud",
    bubbleText: "今天的狗粮超香！",
    createdAt: "2026-06-13 19:00",
    tagEvidence: { eating: "【置信度89%】检测到食盆物体+低头进食姿态+舌头伸出动作+咀嚼频率匹配进食特征" },
    availableFilters: ["warm", "vivid", "natural"],
    aiReport: {
      tagConfidence: { eating: 0.89, playing: 0.12, sleeping: 0.05, walking: 0.08, bathing: 0.02 },
      detectionObjects: ["不锈钢食盆", "狗粮颗粒", "木质地板", "厨房踢脚线"],
      sceneDetection: "室内厨房晚餐场景，暖黄色灯光",
      emotionDetection: "兴奋满足，尾巴快速摆动，耳朵朝前",
      filterRecommendation: "warm",
      filterReason: "暖色调+橙色增强匹配室内晚餐温馨氛围，提升食物的食欲感",
      bubbleTemplateSuggestion: "cloud",
      bubbleTemplateReason: "云朵气泡柔和圆润，契合狗狗满足的表情",
      bubbleTextSuggestion: "今天的狗粮超香！",
      bubbleTextReason: "结合进食场景+兴奋表情+尾巴摆动，推测狗狗对食物很满意",
      modelVersion: "PetVision v3.1.0",
      processedAt: "2026-06-13 19:00",
    },
  },
  {
    id: "ph4",
    petId: "p2",
    imageUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ragdoll%20cat%20walking%20exploring%20garden%20butterflies%20curious%20expression%20flowers%20nature&image_size=portrait_4_3",
    thumbnailUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ragdoll%20cat%20walking%20exploring%20garden%20butterflies%20curious%20expression%20flowers%20nature&image_size=square",
    autoTags: ["walking"],
    userTags: ["探险"],
    filterApplied: "vivid",
    bubbleTemplate: "shout",
    bubbleText: "那是什么？！",
    createdAt: "2026-06-12 10:15",
    tagEvidence: { walking: "检测到四足行走姿态+户外植被背景+耳朵前竖警觉表情，置信度85%" },
    availableFilters: ["vivid", "warm", "natural", "fresh"],
  },
  {
    id: "ph5",
    petId: "p1",
    imageUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shiba%20inu%20taking%20a%20bath%20in%20yellow%20rubber%20duck%20bubbles%20cute%20funny%20bathroom&image_size=portrait_4_3",
    thumbnailUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shiba%20inu%20taking%20a%20bath%20in%20yellow%20rubber%20duck%20bubbles%20cute%20funny%20bathroom&image_size=square",
    autoTags: ["bathing"],
    userTags: ["洗澡日"],
    filterApplied: null,
    bubbleTemplate: null,
    bubbleText: null,
    createdAt: "2026-06-11 20:00",
    tagEvidence: { bathing: "检测到水泡物体+浴室瓷砖背景+湿毛状态，置信度91%" },
    availableFilters: ["fresh", "soft", "bright"],
  },
  {
    id: "ph6",
    petId: "p1",
    imageUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=playful%20shiba%20inu%20with%20teddy%20bear%20toy%20tug%20war%20game%20living%20room%20happy%20expression&image_size=portrait_4_3",
    thumbnailUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=playful%20shiba%20inu%20with%20teddy%20bear%20toy%20tug%20war%20game%20living%20room%20happy%20expression&image_size=square",
    autoTags: ["playing"],
    userTags: [],
    filterApplied: null,
    bubbleTemplate: null,
    bubbleText: null,
    createdAt: "2026-06-10 17:45",
    tagEvidence: { playing: "检测到玩具物体+拉扯互动动作+兴奋张嘴表情，置信度88%" },
    availableFilters: ["warm", "vivid", "retro"],
  },
  {
    id: "ph7",
    petId: "p2",
    imageUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20ragdoll%20cat%20eating%20wet%20food%20from%20bowl%20content%20expression%20kitchen%20floor&image_size=portrait_4_3",
    thumbnailUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20ragdoll%20cat%20eating%20wet%20food%20from%20bowl%20content%20expression%20kitchen%20floor&image_size=square",
    autoTags: ["eating"],
    userTags: ["罐头时间"],
    filterApplied: "natural",
    bubbleTemplate: "cloud",
    bubbleText: "这个罐头真好吃！",
    createdAt: "2026-06-10 18:30",
    tagEvidence: { eating: "【置信度93%】检测到食盆+低头舔食姿态+满足微闭眼表情+胡须沾湿+舌头连续舔舐动作" },
    availableFilters: ["natural", "warm", "vivid"],
    aiReport: {
      tagConfidence: { eating: 0.93, sleeping: 0.15, playing: 0.08, walking: 0.04, bathing: 0.01 },
      detectionObjects: ["陶瓷食盆", "湿粮罐头", "厨房地砖", "猫粮残渣"],
      sceneDetection: "室内厨房傍晚场景，柔和自然光",
      emotionDetection: "满足愉悦，胡须放松，微闭眼享受状",
      filterRecommendation: "natural",
      filterReason: "自然滤镜保持真实感，不破坏布偶猫毛发的柔美光泽",
      bubbleTemplateSuggestion: "cloud",
      bubbleTemplateReason: "云朵气泡轻盈柔和，配合猫咪优雅进食姿态",
      bubbleTextSuggestion: "这个罐头真好吃！",
      bubbleTextReason: "检测到舔食频率高+胡须沾湿+微闭眼满足，推测猫咪非常喜爱这个食物",
      modelVersion: "PetVision v3.1.0",
      processedAt: "2026-06-10 18:30",
    },
  },
  {
    id: "ph8",
    petId: "p1",
    imageUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shiba%20inu%20sleeping%20on%20cozy%20bed%20curled%20up%20peaceful%20soft%20blanket%20bedroom%20warm&image_size=portrait_4_3",
    thumbnailUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shiba%20inu%20sleeping%20on%20cozy%20bed%20curled%20up%20peaceful%20soft%20blanket%20bedroom%20warm&image_size=square",
    autoTags: ["sleeping"],
    userTags: ["午休"],
    filterApplied: "warm",
    bubbleTemplate: "round",
    bubbleText: "不要叫醒我...",
    createdAt: "2026-06-09 13:10",
    tagEvidence: { sleeping: "检测到蜷缩卧姿+闭眼+呼吸平稳体态，置信度97%" },
    availableFilters: ["warm", "soft", "dreamy", "pastel"],
  },
  {
    id: "ph9",
    petId: "p2",
    imageUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ragdoll%20cat%20playing%20with%20feather%20toy%20wand%20jumping%20excited%20living%20room&image_size=portrait_4_3",
    thumbnailUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ragdoll%20cat%20playing%20with%20feather%20toy%20wand%20jumping%20excited%20living%20room&image_size=square",
    autoTags: ["playing"],
    userTags: ["逗猫棒"],
    filterApplied: "vivid",
    bubbleTemplate: "shout",
    bubbleText: "我抓到啦！",
    createdAt: "2026-06-08 16:45",
    tagEvidence: { playing: "检测到逗猫棒+跳跃离地姿态+瞳孔放大兴奋表情，置信度90%" },
    availableFilters: ["vivid", "warm", "fresh"],
  },
  {
    id: "ph10",
    petId: "p1",
    imageUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shiba%20inu%20eating%20treat%20biscuit%20sitting%20obedient%20reward%20training%20indoor&image_size=portrait_4_3",
    thumbnailUrl:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shiba%20inu%20eating%20treat%20biscuit%20sitting%20obedient%20reward%20training%20indoor&image_size=square",
    autoTags: ["eating"],
    userTags: ["训练奖励"],
    filterApplied: "warm",
    bubbleTemplate: "round",
    bubbleText: "奖励饼干超级好吃！",
    createdAt: "2026-06-08 11:20",
    tagEvidence: { eating: "【置信度86%】检测到零食物体+坐姿等待+张嘴接食动作+快速咀嚼吞咽" },
    availableFilters: ["warm", "natural", "soft"],
    aiReport: {
      tagConfidence: { eating: 0.86, playing: 0.22, walking: 0.1, sleeping: 0.04, bathing: 0.02 },
      detectionObjects: ["狗饼干", "训练垫", "室内地毯", "狗狗爪子"],
      sceneDetection: "室内训练场景，明亮自然光",
      emotionDetection: "期待兴奋，坐姿端正，眼神聚焦饼干",
      filterRecommendation: "warm",
      filterReason: "暖色调增强训练奖励的温馨感，突出狗狗开心的表情",
      bubbleTemplateSuggestion: "round",
      bubbleTemplateReason: "圆形气泡简洁可爱，符合训练奖励的欢快氛围",
      bubbleTextSuggestion: "奖励饼干超级好吃！",
      bubbleTextReason: "检测到坐姿等待+快速接食+兴奋表情，推测狗狗非常喜欢这个奖励",
      modelVersion: "PetVision v3.1.0",
      processedAt: "2026-06-08 11:20",
    },
  },
];

const mockPosts: CommunityPost[] = [
  {
    id: "po1",
    authorId: "vet1",
    authorName: "王医生",
    authorAvatar:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20veterinarian%20doctor%20portrait%20in%20white%20coat%20friendly%20smile%20clinic%20background&image_size=square",
    isVetCertified: true,
    title: "【兽医科普】夏季狗狗常见皮肤病的预防与识别",
    content:
      "随着气温升高，狗狗的皮肤问题开始增多。本期为大家讲解夏季常见的3种皮肤病：1. 真菌感染（狗癣）：表现为圆形脱毛斑，边缘有鳞屑；2. 细菌性皮炎：皮肤红肿、有脓性分泌物；3. 寄生虫性皮炎：剧烈瘙痒，尤其是耳后和腹部。建议：保持环境干燥，定期驱虫，发现异常及时就医。",
    category: "vet-article",
    tags: ["兽医科普", "皮肤病", "夏季护理"],
    likes: 328,
    comments: 56,
    createdAt: "2026-06-12 09:30",
  },
  {
    id: "po2",
    authorId: "u2",
    authorName: "豆豆妈",
    authorAvatar:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20woman%20pet%20owner%20casual%20style%20warm%20smile%20natural%20portrait&image_size=square",
    isVetCertified: false,
    title: "柴犬豆豆学会握手啦！训练心得分享～",
    content:
      "训练了两个星期，豆豆终于会握手了！分享一下我的心得：1. 选对时机：最好在饭前15分钟开始，狗狗有动力；2. 每次不超过10分钟，避免厌倦；3. 用小零食作为奖励，完成就给；4. 口令要统一，家人之间要配合。最重要的是耐心！毛孩子不会说，但能感受到你的爱❤️",
    category: "story",
    tags: ["训练日记", "柴犬", "经验分享"],
    likes: 256,
    comments: 89,
    createdAt: "2026-06-11 21:15",
  },
  {
    id: "po3",
    authorId: "vet2",
    authorName: "李医生",
    authorAvatar:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20female%20veterinarian%20portrait%20caring%20expression%20professional%20coat%20pet%20clinic&image_size=square",
    isVetCertified: true,
    title: "猫咪尿血怎么办？兽医解读可能的3个原因",
    content:
      "尿血是猫咪常见的泌尿系统问题，可能原因包括：1. 尿结石：结晶在膀胱或尿道形成结石；2. 尿路感染：细菌感染引起黏膜出血；3. 特发性膀胱炎：应激引起的膀胱黏膜炎症。发现尿血请立即就医，不要自行用药！平时鼓励多喝水，有助于预防。",
    category: "vet-article",
    tags: ["兽医科普", "泌尿系统", "猫咪健康"],
    likes: 512,
    comments: 124,
    createdAt: "2026-06-10 14:20",
  },
  {
    id: "po4",
    authorId: "u3",
    authorName: "新手铲屎官",
    authorAvatar:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20man%20casual%20portrait%20friendly%20smile%20natural%20light%20warm%20atmosphere&image_size=square",
    isVetCertified: false,
    title: "【求助】刚接回家的布偶猫不吃东西，正常吗？",
    content:
      "昨天刚接回一只2岁的布偶猫，到家后一直躲在沙发底下，给它放的猫粮和水都没动过。是不是生病了？还是只是不适应新环境？有没有有经验的铲屎官能告诉我该怎么办...",
    category: "question",
    tags: ["新手求助", "布偶猫", "新猫到家"],
    likes: 45,
    comments: 78,
    createdAt: "2026-06-09 18:40",
  },
];

const mockTrainingRecords: TrainingRecord[] = [
  {
    id: "t1",
    petId: "p1",
    userId: "u1",
    trainingType: "基础指令-坐下",
    date: "2026-06-14",
    duration: 15,
    improvement: 25,
    notes: "今天表现很好，听到口令90%能坐下，奖励了鸡胸肉。",
  },
  {
    id: "t2",
    petId: "p1",
    userId: "u1",
    trainingType: "基础指令-握手",
    date: "2026-06-13",
    duration: 12,
    improvement: 18,
    notes: "握手练习，开始能主动伸爪子了。",
  },
  {
    id: "t3",
    petId: "p1",
    userId: "u1",
    trainingType: "禁止扑人",
    date: "2026-06-12",
    duration: 20,
    improvement: 10,
    notes: "看到陌生人还是会兴奋，需要继续加强。",
  },
  {
    id: "t4",
    petId: "p1",
    userId: "u1",
    trainingType: "基础指令-坐下",
    date: "2026-06-11",
    duration: 10,
    improvement: 20,
    notes: "配合度不错，巩固训练。",
  },
  {
    id: "t5",
    petId: "p2",
    userId: "u1",
    trainingType: "使用猫抓板",
    date: "2026-06-10",
    duration: 8,
    improvement: 30,
    notes: "用猫薄荷引导后，开始主动抓板了！",
  },
];

const mockWeeklyReport: WeeklyReport = {
  weekStart: "2026-06-08",
  weekEnd: "2026-06-14",
  totalSessions: 5,
  totalDuration: 65,
  averageImprovement: 20.6,
  improvements: [
    { category: "基础指令", score: 78 },
    { category: "社交礼仪", score: 52 },
    { category: "日常习惯", score: 65 },
  ],
  suggestions: [
    "豆豆在基础指令方面进步明显，可增加'趴下'、'等待'等新指令学习",
    "社交礼仪还需加强，建议带它去公园多接触其他狗狗",
    "奶茶使用猫抓板的习惯已养成，可考虑购买更多款式",
  ],
};

const mockSamples: VoiceprintSample[] = [
  {
    id: "s1",
    userId: "u2",
    userName: "金毛爸爸",
    audioUrl: "/audio/sample1.wav",
    petType: "dog",
    status: "pending",
    autoAnnotation: null,
    finalAnnotation: null,
    submittedAt: "2026-06-15 10:23",
  },
  {
    id: "s2",
    userId: "u3",
    userName: "三花饲养员",
    audioUrl: "/audio/sample2.wav",
    petType: "cat",
    status: "auto-annotated",
    autoAnnotation: "警告/防御性哈气",
    finalAnnotation: null,
    submittedAt: "2026-06-15 09:45",
  },
  {
    id: "s3",
    userId: "u4",
    userName: "边牧爱好者",
    audioUrl: "/audio/sample3.wav",
    petType: "dog",
    status: "reviewed",
    autoAnnotation: "兴奋吠叫",
    finalAnnotation: "玩耍时的兴奋短吠",
    submittedAt: "2026-06-14 22:10",
  },
  {
    id: "s4",
    userId: "u5",
    userName: "蓝白英短家",
    audioUrl: "/audio/sample4.wav",
    petType: "cat",
    status: "auto-annotated",
    autoAnnotation: "求抚摸/撒娇喵",
    finalAnnotation: null,
    submittedAt: "2026-06-14 20:30",
  },
  {
    id: "s5",
    userId: "u6",
    userName: "柯基小短腿",
    audioUrl: "/audio/sample5.wav",
    petType: "dog",
    status: "rejected",
    autoAnnotation: null,
    finalAnnotation: "背景噪音过大，无法识别",
    submittedAt: "2026-06-14 18:15",
  },
];

const mockModelVersions: ModelVersion[] = [
  {
    id: "m1",
    version: "v2.3.0",
    accuracy: 0.892,
    trainingSamples: 15420,
    status: "deployed",
    createdAt: "2026-06-01",
  },
  {
    id: "m2",
    version: "v2.2.1",
    accuracy: 0.876,
    trainingSamples: 12850,
    status: "completed",
    createdAt: "2026-05-15",
  },
  {
    id: "m3",
    version: "v2.4.0-beta",
    accuracy: 0,
    trainingSamples: 18230,
    status: "training",
    createdAt: "2026-06-14",
  },
];

const mockReviewItems: ContentReviewItem[] = [
  {
    id: "r1",
    contentType: "post",
    content: "【偏方】狗狗拉稀不用看医生，用大蒜煮水喝三次就好！亲测有效...",
    status: "pending",
    flaggedReason: ["疑似虚假医疗建议", "偏方推荐无科学依据"],
    submitterName: "热心网友A",
    submittedAt: "2026-06-15 11:05",
  },
  {
    id: "r2",
    contentType: "text",
    content: "出家养繁育折耳猫，保证纯种，价格私聊...",
    status: "pending",
    flaggedReason: ["违规繁殖交易"],
    submitterName: "后院猫舍",
    submittedAt: "2026-06-15 10:40",
  },
  {
    id: "r3",
    contentType: "image",
    content: "[图片URL: /uploads/review/img_003.jpg]",
    status: "pending",
    flaggedReason: ["暴力/虐待嫌疑图像"],
    submitterName: "用户X",
    submittedAt: "2026-06-15 09:55",
  },
  {
    id: "r4",
    contentType: "post",
    content: "【重要】这几个致命食物千万别给猫吃！1. 葡萄/葡萄干 2. 洋葱大蒜...",
    status: "pending",
    flaggedReason: [],
    submitterName: "科普达人",
    submittedAt: "2026-06-15 09:30",
  },
];

const mockFeedingPlans: FeedingPlan[] = [
  {
    id: "f1",
    petName: "豆豆",
    dailyCalories: 720,
    mealsPerDay: 2,
    recommendedFoods: ["优质无谷狗粮", "水煮鸡胸肉", "胡萝卜", "南瓜"],
    avoidFoods: ["巧克力", "葡萄", "洋葱", "木糖醇"],
    supplements: ["深海鱼油", "关节宝", "益生菌"],
  },
  {
    id: "f2",
    petName: "奶茶",
    dailyCalories: 280,
    mealsPerDay: 3,
    recommendedFoods: ["全价主食罐", "冻干鸡胸", "化毛膏", "猫草"],
    avoidFoods: ["牛奶", "生鱼", "鸡骨头", "咖啡因"],
    supplements: ["牛磺酸", "赖氨酸", "卵磷脂"],
  },
];

export const useAppStore = create<AppState>((set) => ({
  currentUser: { ...mockUser, avatar: localGeneratedImage(mockUser.avatar) },
  pets: mockPets.map((pet) => ({
    ...pet,
    avatar: localGeneratedImage(pet.avatar),
  })),
  analyses: mockAnalyses,
  photos: mockPhotos.map((photo) => ({
    ...photo,
    imageUrl: localGeneratedImage(photo.imageUrl),
    thumbnailUrl: localGeneratedImage(photo.thumbnailUrl),
  })),
  posts: mockPosts.map((post) => ({
    ...post,
    authorAvatar: localGeneratedImage(post.authorAvatar),
  })),
  trainingRecords: mockTrainingRecords,
  weeklyReport: mockWeeklyReport,
  samples: mockSamples,
  modelVersions: mockModelVersions,
  reviewItems: mockReviewItems,
  feedingPlans: mockFeedingPlans,
  selectedPetId: null,
  currentTab: "dashboard",

  setSelectedPetId: (id) => set({ selectedPetId: id }),
  setCurrentTab: (tab) => set({ currentTab: tab }),

  addPet: (pet) => set((s) => ({ pets: [...s.pets, pet] })),
  updatePet: (pet) =>
    set((s) => ({ pets: s.pets.map((p) => (p.id === pet.id ? pet : p)) })),

  addAnalysis: (analysis) =>
    set((s) => ({ analyses: [analysis, ...s.analyses] })),

  updateAnalysis: (analysis) =>
    set((s) => ({
      analyses: s.analyses.map((a) => (a.id === analysis.id ? analysis : a)),
    })),

  addPhoto: (photo) => set((s) => ({ photos: [photo, ...s.photos] })),
  updatePhoto: (photo) =>
    set((s) => ({
      photos: s.photos.map((p) => (p.id === photo.id ? photo : p)),
    })),

  addTrainingRecord: (record) =>
    set((s) => ({ trainingRecords: [record, ...s.trainingRecords] })),

  addPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),

  updateSampleStatus: (id, status, finalAnnotation) =>
    set((s) => ({
      samples: s.samples.map((sample) =>
        sample.id === id ? { ...sample, status, finalAnnotation } : sample
      ),
    })),

  updateReviewStatus: (id, status) =>
    set((s) => ({
      reviewItems: s.reviewItems.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    })),

  triggerFineTune: () =>
    set((s) => ({
      modelVersions: [
        {
          id: "m" + Date.now(),
          version: `v${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}-beta`,
          accuracy: 0,
          trainingSamples: s.samples.filter((x) => x.status === "reviewed").length * 1000,
          status: "training",
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...s.modelVersions,
      ],
    })),
}));
