export interface Product {
  id: string;
  name: string;
  icon: string;
  description: string;
  priceRange: [number, number];
  monthlySales: number;
  tags: string[];
}

export const products: Product[] = [
  {
    id: "album",
    name: "相册",
    icon: "📒",
    description: "精选照片书，记录美好时光，多种尺寸和装帧可选",
    priceRange: [39, 299],
    monthlySales: 12580,
    tags: ["热销", "新品", "定制"],
  },
  {
    id: "calendar-desk",
    name: "台历",
    icon: "📅",
    description: "个性定制台历，每月精选照片，桌面必备装饰",
    priceRange: [29, 128],
    monthlySales: 8930,
    tags: ["热销", "商务礼品"],
  },
  {
    id: "lomo-card",
    name: "LOMO卡",
    icon: "🖼️",
    description: "小巧精致LOMO卡片，随时随地分享美好瞬间",
    priceRange: [19, 68],
    monthlySales: 15620,
    tags: ["热销", "创意", "毕业季"],
  },
  {
    id: "calendar-wall",
    name: "挂历",
    icon: "🗓️",
    description: "大幅面挂历，家居装饰实用两相宜",
    priceRange: [49, 199],
    monthlySales: 5420,
    tags: ["新品", "家居"],
  },
  {
    id: "photo-wall",
    name: "照片墙",
    icon: "🏞️",
    description: "组合式照片墙，打造个性空间，多种相框组合",
    priceRange: [89, 599],
    monthlySales: 3210,
    tags: ["创意", "家居装饰"],
  },
  {
    id: "wood-print",
    name: "木版画",
    icon: "🪵",
    description: "原木质感版画，复古文艺，独特纹理每件不同",
    priceRange: [69, 349],
    monthlySales: 2180,
    tags: ["文艺", "礼物"],
  },
  {
    id: "mug",
    name: "马克杯",
    icon: "☕",
    description: "定制陶瓷马克杯，加热变色，喝水也有仪式感",
    priceRange: [29, 99],
    monthlySales: 18900,
    tags: ["热销", "变色杯", "情侣款"],
  },
  {
    id: "pillow",
    name: "抱枕",
    icon: "🛋️",
    description: "柔软舒适抱枕，双面定制图案，沙发床头好伴侣",
    priceRange: [49, 159],
    monthlySales: 7650,
    tags: ["热销", "家居"],
  },
  {
    id: "phone-case",
    name: "手机壳",
    icon: "📱",
    description: "全包边手机壳，高清图案，多机型支持",
    priceRange: [39, 129],
    monthlySales: 23450,
    tags: ["热销", "新品", "多机型"],
  },
  {
    id: "puzzle",
    name: "拼图",
    icon: "🧩",
    description: "照片定制拼图，亲子互动好选择，多片数可选",
    priceRange: [39, 199],
    monthlySales: 4560,
    tags: ["亲子", "益智", "礼物"],
  },
  {
    id: "fridge-magnet",
    name: "冰箱贴",
    icon: "🧲",
    description: "个性冰箱贴，磁力吸附，装饰厨房小确幸",
    priceRange: [12, 49],
    monthlySales: 9870,
    tags: ["创意", "小物", "旅行纪念"],
  },
  {
    id: "postcard",
    name: "明信片",
    icon: "💌",
    description: "定制明信片，手写温度，寄出思念与祝福",
    priceRange: [15, 58],
    monthlySales: 6780,
    tags: ["文艺", "旅行", "毕业季"],
  },
];
