export interface Material {
  id: string;
  name: string;
  category: "photo-paper" | "frame" | "binding" | "ceramic" | "fabric" | "other";
  categoryName: string;
  description: string;
  priceMultiplier: number;
  features: string[];
  recommended: boolean;
  icon: string;
}

export const materials: Material[] = [
  {
    id: "mat-001",
    name: "哑面相纸",
    category: "photo-paper",
    categoryName: "相纸类",
    description: "哑光质感，不反光，色彩还原自然，适合日常照片印刷",
    priceMultiplier: 1,
    features: ["防眩光", "色彩自然", "手感细腻", "不易留指纹"],
    recommended: true,
    icon: "📄",
  },
  {
    id: "mat-002",
    name: "光面相纸",
    category: "photo-paper",
    categoryName: "相纸类",
    description: "高光质感，色彩鲜艳，光泽度高，适合风景和人像",
    priceMultiplier: 1.2,
    features: ["色彩鲜艳", "高光效果", "画面通透", "防水涂层"],
    recommended: false,
    icon: "✨",
  },
  {
    id: "mat-003",
    name: "金属相纸",
    category: "photo-paper",
    categoryName: "相纸类",
    description: "金属质感，独特光泽，高端大气，适合艺术照和展览",
    priceMultiplier: 2.5,
    features: ["金属光泽", "立体感强", "高端质感", "收藏级品质"],
    recommended: false,
    icon: "🥇",
  },
  {
    id: "mat-004",
    name: "绒面相纸",
    category: "photo-paper",
    categoryName: "相纸类",
    description: "绒面质感，触感细腻，典雅复古，适合人像和艺术作品",
    priceMultiplier: 1.5,
    features: ["绒面质感", "触感细腻", "防眩光", "复古气质"],
    recommended: true,
    icon: "🧶",
  },
  {
    id: "mat-005",
    name: "原木相框",
    category: "frame",
    categoryName: "相框类",
    description: "进口原木打造，自然纹理，简约百搭，多种尺寸可选",
    priceMultiplier: 2,
    features: ["实木材质", "自然纹理", "环保漆", "多种尺寸"],
    recommended: true,
    icon: "🖼️",
  },
  {
    id: "mat-006",
    name: "金属相框",
    category: "frame",
    categoryName: "相框类",
    description: "铝合金材质，简约现代，轻薄质感，适合商务风格",
    priceMultiplier: 2.2,
    features: ["铝合金", "不易变形", "现代简约", "轻薄设计"],
    recommended: false,
    icon: "🔲",
  },
  {
    id: "mat-007",
    name: "精装硬壳",
    category: "binding",
    categoryName: "装订类",
    description: "硬壳封面，内页锁线装订，翻页平整，可平铺180度",
    priceMultiplier: 1.8,
    features: ["硬壳封面", "锁线装订", "180度平铺", "持久耐用"],
    recommended: true,
    icon: "📕",
  },
  {
    id: "mat-008",
    name: "高温陶瓷",
    category: "ceramic",
    categoryName: "陶瓷类",
    description: "优质白瓷，高温烧制，图案不褪色，可微波炉加热",
    priceMultiplier: 1,
    features: ["优质白瓷", "高温烧制", "永不褪色", "可微波炉"],
    recommended: true,
    icon: "☕",
  },
  {
    id: "mat-009",
    name: "亚麻面料",
    category: "fabric",
    categoryName: "面料类",
    description: "天然亚麻混纺，透气舒适，质感高级，双面印刷",
    priceMultiplier: 1.3,
    features: ["亚麻混纺", "透气舒适", "双面印刷", "不含枕芯"],
    recommended: false,
    icon: "🛋️",
  },
  {
    id: "mat-010",
    name: "硅胶软壳",
    category: "other",
    categoryName: "其他",
    description: "TPU硅胶材质，全包边保护，手感舒适，不易发黄",
    priceMultiplier: 1,
    features: ["TPU硅胶", "全包保护", "手感舒适", "不易发黄"],
    recommended: true,
    icon: "📱",
  },
];
