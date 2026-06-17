import type { SymptomNode, Severity } from "../../shared/types";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

export const SEVERITY_CONFIG: Record<
  Severity,
  {
    label: string;
    bg: string;
    border: string;
    badge: string;
    icon: typeof CheckCircle2;
    titleColor: string;
  }
> = {
  mild: {
    label: "轻微",
    bg: "from-brand-mint/20 to-brand-mint-light/20",
    border: "border-brand-mint/30",
    badge: "bg-brand-mint/15 text-brand-mint-dark",
    icon: CheckCircle2,
    titleColor: "text-brand-mint-dark",
  },
  moderate: {
    label: "中等",
    bg: "from-accent-sunny/20 to-amber-200/20",
    border: "border-accent-sunny/40",
    badge: "bg-accent-sunny/30 text-amber-700",
    icon: AlertTriangle,
    titleColor: "text-amber-700",
  },
  severe: {
    label: "严重",
    bg: "from-red-100 to-brand-orange/10",
    border: "border-brand-orange/30",
    badge: "bg-brand-orange/15 text-brand-orange-dark",
    icon: AlertCircle,
    titleColor: "text-brand-orange-dark",
  },
};

export const DOG_TREE: Record<string, SymptomNode> = {
  start: {
    id: "start",
    question: "豆豆主要有哪些不适症状？",
    options: [
      { label: "呕吐 / 腹泻", nextNodeId: "gastro" },
      { label: "食欲不振 / 精神差", nextNodeId: "appetite" },
      { label: "频繁抓挠 / 皮肤问题", nextNodeId: "skin" },
      { label: "咳嗽 / 打喷嚏", nextNodeId: "respiratory" },
    ],
  },
  gastro: {
    id: "gastro",
    question: "呕吐或腹泻的频率是？",
    options: [
      { label: "偶尔1-2次，精神还可以", nextNodeId: "gastro_mild" },
      { label: "一天3次以上，伴有血丝", nextNodeId: "gastro_severe" },
      { label: "持续超过24小时", nextNodeId: "gastro_moderate" },
    ],
  },
  gastro_mild: {
    id: "gastro_mild",
    question: "最近有没有吃特殊食物或异物？",
    options: [
      { label: "换了新粮 / 吃了零食", nextNodeId: "diag_gastro_diet" },
      { label: "可能吃了异物（玩具、塑料等）", nextNodeId: "diag_foreign" },
      { label: "没有，饮食正常", nextNodeId: "diag_gastro_virus" },
    ],
  },
  gastro_moderate: {
    id: "gastro_moderate",
    question: "是否伴有发热或明显脱水？",
    options: [
      { label: "有，牙龈干燥、眼窝凹陷", nextNodeId: "diag_gastro_severe" },
      { label: "没有，只是持续不适", nextNodeId: "diag_gastro_parasite" },
    ],
  },
  gastro_severe: {
    id: "gastro_severe",
    options: [],
    diagnosis: {
      possibleConditions: ["急性出血性胃肠炎", "细小病毒感染", "肠道异物梗阻"],
      severity: "severe",
      suggestions: [
        "立即停止喂食喂水，避免加重肠胃负担",
        "尽快带往最近的宠物医院急诊",
        "携带新鲜粪便样本便于化验",
        "注意保暖，避免颠簸",
      ],
      recommendVisit: true,
    },
  },
  appetite: {
    id: "appetite",
    question: "这种情况持续多久了？",
    options: [
      { label: "半天以内，可能只是挑食", nextNodeId: "diag_appetite_mild" },
      { label: "1-2天，精神有些萎靡", nextNodeId: "diag_appetite_moderate" },
      { label: "超过3天完全不吃", nextNodeId: "diag_appetite_severe" },
    ],
  },
  skin: {
    id: "skin",
    question: "皮肤问题的主要表现是？",
    options: [
      { label: "局部脱毛、皮屑、发红", nextNodeId: "diag_skin_fungus" },
      { label: "全身瘙痒、红疹、疙瘩", nextNodeId: "diag_skin_allergy" },
      { label: "耳后/腹部剧烈瘙痒，有结痂", nextNodeId: "diag_skin_parasite" },
    ],
  },
  respiratory: {
    id: "respiratory",
    question: "呼吸道症状持续多久？是否发热？",
    options: [
      { label: "刚出现，无发热，精神好", nextNodeId: "diag_resp_mild" },
      { label: "有发热，精神差，伴有脓鼻涕", nextNodeId: "diag_resp_severe" },
      { label: "咳嗽持续超过1周", nextNodeId: "diag_resp_kennel" },
    ],
  },
  diag_gastro_diet: {
    id: "diag_gastro_diet",
    options: [],
    diagnosis: {
      possibleConditions: ["饮食不耐受", "轻度消化不良"],
      severity: "mild",
      suggestions: [
        "禁食6-12小时，少量多次饮水",
        "恢复喂食时选择易消化的处方粮或白水煮鸡胸肉",
        "可补充益生菌调理肠胃",
        "观察24小时，如无改善请就医",
      ],
      recommendVisit: false,
    },
  },
  diag_foreign: {
    id: "diag_foreign",
    options: [],
    diagnosis: {
      possibleConditions: ["消化道异物", "肠道梗阻风险"],
      severity: "moderate",
      suggestions: [
        "密切观察是否有排便困难、持续呕吐",
        "切勿自行催吐（尖锐异物可能划伤食道）",
        "24小时内建议拍片检查异物位置",
        "如出现剧烈呕吐、腹痛需立即急诊",
      ],
      recommendVisit: true,
    },
  },
  diag_gastro_virus: {
    id: "diag_gastro_virus",
    options: [],
    diagnosis: {
      possibleConditions: ["病毒性胃肠炎", "寄生虫感染早期"],
      severity: "moderate",
      suggestions: [
        "禁食不禁水，密切观察精神状态",
        "建议24小时内就医做粪便常规和病毒检测",
        "家中其他宠物注意隔离消毒",
        "按时完成疫苗接种可有效预防",
      ],
      recommendVisit: true,
    },
  },
  diag_gastro_severe: {
    id: "diag_gastro_severe",
    options: [],
    diagnosis: {
      possibleConditions: ["严重脱水", "急性胰腺炎可能", "重度感染"],
      severity: "severe",
      suggestions: [
        "立即就医，需要静脉补液纠正脱水",
        "进行血常规、生化、胰腺炎检测",
        "避免自行喂药，尤其是人用止泻药",
        "住院观察可能需要",
      ],
      recommendVisit: true,
    },
  },
  diag_gastro_parasite: {
    id: "diag_gastro_parasite",
    options: [],
    diagnosis: {
      possibleConditions: ["肠道寄生虫感染", "慢性胃肠炎"],
      severity: "moderate",
      suggestions: [
        "带新鲜粪便样本就医做粪检",
        "确认寄生虫种类后对症驱虫",
        "定期驱虫（体内每1-3个月一次）",
        "环境清洁消毒，避免食入虫卵",
      ],
      recommendVisit: true,
    },
  },
  diag_appetite_mild: {
    id: "diag_appetite_mild",
    options: [],
    diagnosis: {
      possibleConditions: ["挑食行为", "情绪应激"],
      severity: "mild",
      suggestions: [
        "检查食物是否新鲜、温度是否适宜",
        "定时定量喂食，15分钟不吃就收走",
        "避免过度喂食零食影响正餐食欲",
        "排除环境变化、新成员等应激因素",
      ],
      recommendVisit: false,
    },
  },
  diag_appetite_moderate: {
    id: "diag_appetite_moderate",
    options: [],
    diagnosis: {
      possibleConditions: ["轻度感染", "牙齿问题", "消化功能紊乱"],
      severity: "moderate",
      suggestions: [
        "测量体温（正常38-39℃）",
        "检查口腔是否有溃疡、牙结石、牙龈红肿",
        "建议48小时内就医做基础检查",
        "可以尝试温热食物增强适口性",
      ],
      recommendVisit: true,
    },
  },
  diag_appetite_severe: {
    id: "diag_appetite_severe",
    options: [],
    diagnosis: {
      possibleConditions: ["严重内脏疾病", "全身性感染", "肿瘤可能"],
      severity: "severe",
      suggestions: [
        "立即就医，不可拖延",
        "需要全面检查：血检、影像、B超等",
        "期间可尝试用针管少量喂水防止脱水",
        "记录是否伴有其他症状供医生参考",
      ],
      recommendVisit: true,
    },
  },
  diag_skin_fungus: {
    id: "diag_skin_fungus",
    options: [],
    diagnosis: {
      possibleConditions: ["真菌感染（狗癣）", "细菌性皮炎"],
      severity: "mild",
      suggestions: [
        "就医做伍德氏灯或真菌培养确诊",
        "患处剃毛便于上药和观察",
        "按疗程使用抗真菌药浴+外用药",
        "环境消毒，注意人宠共患风险",
      ],
      recommendVisit: true,
    },
  },
  diag_skin_allergy: {
    id: "diag_skin_allergy",
    options: [],
    diagnosis: {
      possibleConditions: ["食物过敏", "特应性皮炎", "接触性皮炎"],
      severity: "moderate",
      suggestions: [
        "就医排查过敏原（食物/环境）",
        "可尝试低敏处方粮排除食物因素",
        "定期驱虫，跳蚤是常见过敏诱因",
        "避免过度洗澡破坏皮肤屏障",
      ],
      recommendVisit: true,
    },
  },
  diag_skin_parasite: {
    id: "diag_skin_parasite",
    options: [],
    diagnosis: {
      possibleConditions: ["疥螨感染", "跳蚤过敏性皮炎"],
      severity: "moderate",
      suggestions: [
        "立即就医做皮肤刮片检查",
        "进行针对性驱虫治疗",
        "环境彻底杀虫，包括床垫、沙发缝隙",
        "佩戴伊丽莎白圈防止抓挠继发感染",
      ],
      recommendVisit: true,
    },
  },
  diag_resp_mild: {
    id: "diag_resp_mild",
    options: [],
    diagnosis: {
      possibleConditions: ["普通感冒", "刺激性气味反应"],
      severity: "mild",
      suggestions: [
        "保持温暖，避免空调直吹",
        "保证饮水和营养摄入",
        "使用加湿器增加空气湿度",
        "观察3天，症状加重及时就医",
      ],
      recommendVisit: false,
    },
  },
  diag_resp_severe: {
    id: "diag_resp_severe",
    options: [],
    diagnosis: {
      possibleConditions: ["肺炎", "犬副流感", "严重细菌感染"],
      severity: "severe",
      suggestions: [
        "立即就医，可能需要X光检查肺部",
        "遵医嘱使用抗生素和支持治疗",
        "隔离其他宠物防止传染",
        "呼吸困难时保持呼吸道通畅，及时供氧",
      ],
      recommendVisit: true,
    },
  },
  diag_resp_kennel: {
    id: "diag_resp_kennel",
    options: [],
    diagnosis: {
      possibleConditions: ["犬窝咳（支气管炎）", "慢性呼吸道感染"],
      severity: "moderate",
      suggestions: [
        "就医确诊，可能需要止咳+抗生素治疗",
        "避免剧烈运动和冷空气刺激",
        "近期是否去过宠物店/寄养/狗公园",
        "完成每年疫苗加强可降低感染风险",
      ],
      recommendVisit: true,
    },
  },
};

export const CAT_TREE: Record<string, SymptomNode> = {
  start: {
    id: "start",
    question: "奶茶主要有哪些不适症状？",
    options: [
      { label: "呕吐 / 软便 / 腹泻", nextNodeId: "cat_gastro" },
      { label: "食欲下降 / 精神萎靡", nextNodeId: "cat_appetite" },
      { label: "尿血 / 尿频 / 排尿困难", nextNodeId: "cat_urine" },
      { label: "频繁抓耳 / 甩头 / 皮肤瘙痒", nextNodeId: "cat_skin" },
    ],
  },
  cat_gastro: {
    id: "cat_gastro",
    question: "呕吐物是什么样的？频率如何？",
    options: [
      { label: "吐毛球 / 食物，偶尔发生", nextNodeId: "diag_cat_hairball" },
      { label: "黄水/白沫，一天3次以上", nextNodeId: "diag_cat_gastro_severe" },
      { label: "软便持续超过3天", nextNodeId: "diag_cat_gastro_parasite" },
    ],
  },
  cat_appetite: {
    id: "cat_appetite",
    question: "是否还喝水？有没有其他异常？",
    options: [
      { label: "喝水正常，可能只是挑食", nextNodeId: "diag_cat_appetite_mild" },
      { label: "吃喝都少，超过24小时", nextNodeId: "diag_cat_appetite_moderate" },
      { label: "完全不吃超过3天 + 黄疸", nextNodeId: "diag_cat_liver" },
    ],
  },
  cat_urine: {
    id: "cat_urine",
    question: "排尿困难持续多久了？能尿出来吗？",
    options: [
      { label: "能尿但带血，尿频", nextNodeId: "diag_cat_flutd_mild" },
      { label: "完全尿不出，超过12小时", nextNodeId: "diag_cat_obstruction" },
      { label: "尿量明显增多，爱喝水", nextNodeId: "diag_cat_kidney" },
    ],
  },
  cat_skin: {
    id: "cat_skin",
    question: "主要症状是？",
    options: [
      { label: "耳朵黑褐色分泌物、发臭", nextNodeId: "diag_cat_ear" },
      { label: "面部/颈部脱毛、丘疹", nextNodeId: "diag_cat_allergy" },
      { label: "背部尾根粟粒样结痂", nextNodeId: "diag_cat_flea" },
    ],
  },
  diag_cat_hairball: {
    id: "diag_cat_hairball",
    options: [],
    diagnosis: {
      possibleConditions: ["毛球症", "轻度消化不良"],
      severity: "mild",
      suggestions: [
        "定期喂化毛膏或猫草帮助排毛",
        "每天梳毛减少死毛摄入",
        "可尝试换毛球控制处方粮",
        "频繁呕吐需就医排查其他原因",
      ],
      recommendVisit: false,
    },
  },
  diag_cat_gastro_severe: {
    id: "diag_cat_gastro_severe",
    options: [],
    diagnosis: {
      possibleConditions: ["急性胃肠炎", "胰腺炎", "异物风险"],
      severity: "severe",
      suggestions: [
        "立即停止喂食，少量多次喂水",
        "尽快就医检查血常规和生化",
        "警惕异物吞食（猫特别容易误食）",
        "需要静脉补液防止脱水",
      ],
      recommendVisit: true,
    },
  },
  diag_cat_gastro_parasite: {
    id: "diag_cat_gastro_parasite",
    options: [],
    diagnosis: {
      possibleConditions: ["肠道寄生虫", "慢性肠炎", "食物敏感"],
      severity: "moderate",
      suggestions: [
        "带粪便样本就医做粪检",
        "定期体内驱虫（每1-3个月）",
        "可尝试低敏粮排除食物因素",
        "补充益生菌调理肠道菌群",
      ],
      recommendVisit: true,
    },
  },
  diag_cat_appetite_mild: {
    id: "diag_cat_appetite_mild",
    options: [],
    diagnosis: {
      possibleConditions: ["挑食", "应激反应", "食物温度不适"],
      severity: "mild",
      suggestions: [
        "尝试加热食物增强香味",
        "提供多种口味供选择",
        "减少环境应激（噪音、陌生人）",
        "进食习惯突然改变要警惕疾病",
      ],
      recommendVisit: false,
    },
  },
  diag_cat_appetite_moderate: {
    id: "diag_cat_appetite_moderate",
    options: [],
    diagnosis: {
      possibleConditions: ["上呼吸道感染", "口腔问题", "早期内脏疾病"],
      severity: "moderate",
      suggestions: [
        "检查口腔是否有溃疡、牙结石",
        "观察是否有流涕、流泪、喷嚏",
        "建议48小时内就医检查",
        "可尝试手喂或流食保证营养",
      ],
      recommendVisit: true,
    },
  },
  diag_cat_liver: {
    id: "diag_cat_liver",
    options: [],
    diagnosis: {
      possibleConditions: ["脂肪肝风险", "严重肝胆疾病"],
      severity: "severe",
      suggestions: [
        "立即就医！猫咪脂肪肝不可逆发展很快",
        "需要强制喂食或鼻饲管营养支持",
        "进行全面血检和B超检查",
        "切勿自行用药，很多药对猫有毒性",
      ],
      recommendVisit: true,
    },
  },
  diag_cat_flutd_mild: {
    id: "diag_cat_flutd_mild",
    options: [],
    diagnosis: {
      possibleConditions: ["猫下泌尿道疾病（FLUTD）", "尿结晶/结石早期", "膀胱炎"],
      severity: "moderate",
      suggestions: [
        "鼓励大量饮水，湿粮为主",
        "就医做尿检确认结晶类型",
        "可能需要换泌尿处方粮",
        "观察是否发展为尿闭（紧急！）",
      ],
      recommendVisit: true,
    },
  },
  diag_cat_obstruction: {
    id: "diag_cat_obstruction",
    options: [],
    diagnosis: {
      possibleConditions: ["尿道完全梗阻", "急性肾功能衰竭风险"],
      severity: "severe",
      suggestions: [
        "⚠️ 紧急！立即就医！超过24小时尿闭可致命",
        "需要导尿解除梗阻",
        "住院监测肾功能恢复情况",
        "后续长期处方粮预防复发",
      ],
      recommendVisit: true,
    },
  },
  diag_cat_kidney: {
    id: "diag_cat_kidney",
    options: [],
    diagnosis: {
      possibleConditions: ["慢性肾病早期", "糖尿病风险", "甲亢可能（老猫）"],
      severity: "moderate",
      suggestions: [
        "尽快就医做血检+尿检+血压",
        "中老年猫每年体检非常重要",
        "多喝水有助于保护肾脏",
        "慢性疾病早期干预可大幅延长寿命",
      ],
      recommendVisit: true,
    },
  },
  diag_cat_ear: {
    id: "diag_cat_ear",
    options: [],
    diagnosis: {
      possibleConditions: ["耳螨感染", "外耳炎"],
      severity: "mild",
      suggestions: [
        "就医做耳镜和耳道分泌物检查",
        "按疗程使用滴耳液，不要自行停药",
        "定期驱虫可预防耳螨",
        "洗澡时注意耳朵不要进水",
      ],
      recommendVisit: true,
    },
  },
  diag_cat_allergy: {
    id: "diag_cat_allergy",
    options: [],
    diagnosis: {
      possibleConditions: ["食物过敏", "特应性皮炎", "嗜酸性肉芽肿"],
      severity: "moderate",
      suggestions: [
        "就医排查过敏原",
        "尝试低敏处方粮（8-12周排除期）",
        "佩戴伊丽莎白圈防止抓挠",
        "定期驱虫排除跳蚤因素",
      ],
      recommendVisit: true,
    },
  },
  diag_cat_flea: {
    id: "diag_cat_flea",
    options: [],
    diagnosis: {
      possibleConditions: ["跳蚤过敏性皮炎", "粟粒性皮炎"],
      severity: "mild",
      suggestions: [
        "立即进行体外驱虫（注意猫用剂量）",
        "环境全面除蚤，尤其是床垫地毯",
        "家中所有宠物同时驱虫",
        "严重时需要配合止痒消炎治疗",
      ],
      recommendVisit: true,
    },
  },
};
