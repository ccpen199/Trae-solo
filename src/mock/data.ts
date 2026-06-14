import type {
  User,
  Designer,
  Case,
  AcceptancePhoto,
  CaseMaterial,
  CaseImage,
  Material,
  LocalSupplier,
  QualityScore,
  MaterialPrice,
} from '@shared/types';

const svgFloorPlan1 = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="600" height="400" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <g stroke="#334155" stroke-width="3" fill="none">
    <rect x="20" y="20" width="200" height="180" fill="#f0fdf4"/>
    <rect x="220" y="20" width="160" height="180" fill="#fef3c7"/>
    <rect x="380" y="20" width="200" height="180" fill="#fce7f3"/>
    <rect x="20" y="200" width="200" height="180" fill="#dbeafe"/>
    <rect x="220" y="200" width="160" height="100" fill="#e0e7ff"/>
    <rect x="220" y="300" width="160" height="80" fill="#fef9c3"/>
    <rect x="380" y="200" width="200" height="180" fill="#ccfbf1"/>
  </g>
  <g font-family="PingFang SC, sans-serif" font-size="14" fill="#1e293b">
    <text x="90" y="105" text-anchor="middle">主卧</text>
    <text x="90" y="125" text-anchor="middle" font-size="12" fill="#64748b">18㎡</text>
    <text x="300" y="105" text-anchor="middle">客厅</text>
    <text x="300" y="125" text-anchor="middle" font-size="12" fill="#64748b">24㎡</text>
    <text x="480" y="105" text-anchor="middle">次卧</text>
    <text x="480" y="125" text-anchor="middle" font-size="12" fill="#64748b">15㎡</text>
    <text x="90" y="285" text-anchor="middle">厨房</text>
    <text x="90" y="305" text-anchor="middle" font-size="12" fill="#64748b">12㎡</text>
    <text x="300" y="250" text-anchor="middle">餐厅</text>
    <text x="300" y="270" text-anchor="middle" font-size="12" fill="#64748b">10㎡</text>
    <text x="300" y="340" text-anchor="middle">卫生间</text>
    <text x="300" y="360" text-anchor="middle" font-size="12" fill="#64748b">6㎡</text>
    <text x="480" y="285" text-anchor="middle">阳台</text>
    <text x="480" y="305" text-anchor="middle" font-size="12" fill="#64748b">8㎡</text>
  </g>
</svg>`;

const svgFloorPlan2 = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="700" height="500" viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="500" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <g stroke="#334155" stroke-width="3" fill="none">
    <rect x="20" y="20" width="180" height="200" fill="#f0fdf4"/>
    <rect x="200" y="20" width="220" height="200" fill="#fef3c7"/>
    <rect x="420" y="20" width="130" height="200" fill="#fce7f3"/>
    <rect x="550" y="20" width="130" height="200" fill="#fce7f3"/>
    <rect x="20" y="220" width="180" height="160" fill="#dbeafe"/>
    <rect x="200" y="220" width="220" height="160" fill="#ccfbf1"/>
    <rect x="420" y="220" width="130" height="160" fill="#e0e7ff"/>
    <rect x="550" y="220" width="130" height="160" fill="#fef9c3"/>
    <rect x="20" y="380" width="660" height="100" fill="#f1f5f9"/>
  </g>
  <g font-family="PingFang SC, sans-serif" font-size="14" fill="#1e293b">
    <text x="110" y="115" text-anchor="middle">主卧</text>
    <text x="110" y="135" text-anchor="middle" font-size="12" fill="#64748b">22㎡</text>
    <text x="310" y="115" text-anchor="middle">客厅</text>
    <text x="310" y="135" text-anchor="middle" font-size="12" fill="#64748b">32㎡</text>
    <text x="485" y="115" text-anchor="middle">次卧1</text>
    <text x="485" y="135" text-anchor="middle" font-size="12" fill="#64748b">14㎡</text>
    <text x="615" y="115" text-anchor="middle">次卧2</text>
    <text x="615" y="135" text-anchor="middle" font-size="12" fill="#64748b">12㎡</text>
    <text x="110" y="295" text-anchor="middle">厨房</text>
    <text x="110" y="315" text-anchor="middle" font-size="12" fill="#64748b">14㎡</text>
    <text x="310" y="295" text-anchor="middle">餐厅</text>
    <text x="310" y="315" text-anchor="middle" font-size="12" fill="#64748b">18㎡</text>
    <text x="485" y="295" text-anchor="middle">卫生间1</text>
    <text x="485" y="315" text-anchor="middle" font-size="12" fill="#64748b">5㎡</text>
    <text x="615" y="295" text-anchor="middle">卫生间2</text>
    <text x="615" y="315" text-anchor="middle" font-size="12" fill="#64748b">4㎡</text>
    <text x="350" y="435" text-anchor="middle">阳台</text>
    <text x="350" y="455" text-anchor="middle" font-size="12" fill="#64748b">20㎡</text>
  </g>
</svg>`;

const svgFloorPlan3 = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="500" height="350" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <g stroke="#334155" stroke-width="3" fill="none">
    <rect x="20" y="20" width="160" height="150" fill="#f0fdf4"/>
    <rect x="180" y="20" width="180" height="150" fill="#fef3c7"/>
    <rect x="360" y="20" width="120" height="150" fill="#dbeafe"/>
    <rect x="20" y="170" width="160" height="100" fill="#e0e7ff"/>
    <rect x="180" y="170" width="180" height="100" fill="#ccfbf1"/>
    <rect x="360" y="170" width="120" height="100" fill="#fef9c3"/>
    <rect x="20" y="270" width="460" height="60" fill="#f1f5f9"/>
  </g>
  <g font-family="PingFang SC, sans-serif" font-size="13" fill="#1e293b">
    <text x="100" y="90" text-anchor="middle">卧室</text>
    <text x="100" y="108" text-anchor="middle" font-size="11" fill="#64748b">14㎡</text>
    <text x="270" y="90" text-anchor="middle">客厅</text>
    <text x="270" y="108" text-anchor="middle" font-size="11" fill="#64748b">20㎡</text>
    <text x="420" y="90" text-anchor="middle">厨房</text>
    <text x="420" y="108" text-anchor="middle" font-size="11" fill="#64748b">8㎡</text>
    <text x="100" y="215" text-anchor="middle">书房</text>
    <text x="100" y="233" text-anchor="middle" font-size="11" fill="#64748b">9㎡</text>
    <text x="270" y="215" text-anchor="middle">餐厅</text>
    <text x="270" y="233" text-anchor="middle" font-size="11" fill="#64748b">10㎡</text>
    <text x="420" y="215" text-anchor="middle">卫生间</text>
    <text x="420" y="233" text-anchor="middle" font-size="11" fill="#64748b">5㎡</text>
    <text x="250" y="305" text-anchor="middle">阳台</text>
    <text x="250" y="323" text-anchor="middle" font-size="11" fill="#64748b">6㎡</text>
  </g>
</svg>`;

const svgElectricPlan = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="600" height="400" fill="#fefefe" stroke="#e2e8f0" stroke-width="2"/>
  <g stroke="#cbd5e1" stroke-width="2" fill="none" stroke-dasharray="6,3">
    <rect x="20" y="20" width="200" height="180"/>
    <rect x="220" y="20" width="160" height="180"/>
    <rect x="380" y="20" width="200" height="180"/>
    <rect x="20" y="200" width="200" height="180"/>
    <rect x="220" y="200" width="160" height="180"/>
    <rect x="380" y="200" width="200" height="180"/>
  </g>
  <g fill="#ef4444">
    <circle cx="60" cy="60" r="8"/>
    <circle cx="180" cy="60" r="8"/>
    <circle cx="300" cy="60" r="8"/>
    <circle cx="460" cy="60" r="8"/>
    <circle cx="540" cy="60" r="8"/>
  </g>
  <g fill="#3b82f6">
    <rect x="50" y="240" width="12" height="12"/>
    <rect x="170" y="240" width="12" height="12"/>
    <rect x="290" y="240" width="12" height="12"/>
    <rect x="450" y="240" width="12" height="12"/>
  </g>
  <g font-family="PingFang SC, sans-serif" font-size="11" fill="#64748b">
    <circle cx="60" cy="380" r="5" fill="#ef4444"/>
    <text x="75" y="384">强电插座</text>
    <rect x="140" y="375" width="10" height="10" fill="#3b82f6"/>
    <text x="155" y="384">弱电插座</text>
  </g>
</svg>`;

const svgWaterPlan = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="600" height="400" fill="#fefefe" stroke="#e2e8f0" stroke-width="2"/>
  <g stroke="#cbd5e1" stroke-width="2" fill="none" stroke-dasharray="6,3">
    <rect x="20" y="20" width="200" height="180"/>
    <rect x="220" y="20" width="160" height="180"/>
    <rect x="380" y="20" width="200" height="180"/>
    <rect x="20" y="200" width="200" height="180"/>
    <rect x="220" y="200" width="160" height="180"/>
    <rect x="380" y="200" width="200" height="180"/>
  </g>
  <g stroke="#3b82f6" stroke-width="3" fill="none">
    <path d="M 20 300 L 100 300 L 100 250"/>
    <path d="M 100 300 L 300 300 L 300 260"/>
    <path d="M 300 300 L 520 300 L 520 250"/>
  </g>
  <g stroke="#ef4444" stroke-width="3" fill="none" stroke-dasharray="8,4">
    <path d="M 50 200 L 50 250 L 100 250"/>
    <path d="M 280 200 L 280 260 L 300 260"/>
    <path d="M 500 200 L 500 250 L 520 250"/>
  </g>
  <g font-family="PingFang SC, sans-serif" font-size="11" fill="#64748b">
    <line x1="60" y1="380" x2="85" y2="380" stroke="#3b82f6" stroke-width="3"/>
    <text x="93" y="384">冷水管</text>
    <line x1="160" y1="380" x2="185" y2="380" stroke="#ef4444" stroke-width="3" stroke-dasharray="8,4"/>
    <text x="193" y="384">热水管</text>
  </g>
</svg>`;

function createAcceptancePhotos(caseId: string): AcceptancePhoto[] {
  const stages: Array<'concealed' | 'mud-wood' | 'paint'> = ['concealed', 'mud-wood', 'paint'];
  const stageNames: Record<string, string> = {
    'concealed': '隐蔽工程验收',
    'mud-wood': '泥木工程验收',
    'paint': '油漆工程验收',
  };
  const photos: AcceptancePhoto[] = [];
  let photoIndex = 0;
  stages.forEach((stage) => {
    for (let i = 0; i < 4; i++) {
      photoIndex++;
      photos.push({
        id: `${caseId}-photo-${photoIndex}`,
        stage,
        url: `https://picsum.photos/seed/${caseId}${stage}${i}/800/600`,
        description: `${stageNames[stage]} - ${['客厅区域', '卧室区域', '厨房区域', '卫生间区域'][i]}实拍`,
        takenAt: new Date(Date.now() - (3 - stages.indexOf(stage)) * 30 * 24 * 60 * 60 * 1000 - i * 2 * 60 * 60 * 1000),
      });
    }
  });
  return photos;
}

const caseMaterialTemplates: Array<{
  category: string;
  materials: Array<{ brand: string; model: string; name: string; unit: string; quantity: [number, number]; room: string[] }>;
}> = [
  {
    category: '瓷砖',
    materials: [
      { brand: '东鹏', model: 'FG805001', name: '通体大理石瓷砖', unit: '片', quantity: [80, 150], room: ['客厅', '餐厅', '厨房'] },
      { brand: '马可波罗', model: 'CZ8808AS', name: '抛釉砖', unit: '片', quantity: [60, 120], room: ['客厅', '餐厅'] },
      { brand: '诺贝尔', model: 'RS80710', name: '瓷片', unit: '片', quantity: [40, 80], room: ['厨房', '卫生间'] },
    ],
  },
  {
    category: '地板',
    materials: [
      { brand: '圣象', model: 'NK8501', name: '多层实木复合地板', unit: '㎡', quantity: [50, 120], room: ['主卧', '次卧'] },
      { brand: '大自然', model: 'DSJ001', name: '强化复合地板', unit: '㎡', quantity: [40, 100], room: ['主卧', '次卧'] },
    ],
  },
  {
    category: '卫浴',
    materials: [
      { brand: '科勒', model: 'K-3722T-0', name: '连体座便器', unit: '个', quantity: [1, 3], room: ['卫生间'] },
      { brand: 'TOTO', model: 'CW981B', name: '智能马桶', unit: '个', quantity: [1, 2], room: ['主卫', '次卫'] },
      { brand: '摩恩', model: '12345EC', name: '淋浴花洒套装', unit: '套', quantity: [1, 2], room: ['卫生间'] },
    ],
  },
  {
    category: '橱柜',
    materials: [
      { brand: '欧派', model: 'OP-2024-A1', name: '整体橱柜定制', unit: '延米', quantity: [3, 6], room: ['厨房'] },
      { brand: '索菲亚', model: 'SF-KC001', name: '定制橱柜', unit: '延米', quantity: [3, 5], room: ['厨房'] },
    ],
  },
  {
    category: '门窗',
    materials: [
      { brand: 'TATA木门', model: 'AC-001', name: '实木复合门', unit: '樘', quantity: [3, 8], room: ['主卧', '次卧', '书房'] },
      { brand: '凤铝', model: 'FL-70', name: '断桥铝窗', unit: '㎡', quantity: [8, 20], room: ['客厅', '主卧'] },
    ],
  },
  {
    category: '乳胶漆',
    materials: [
      { brand: '多乐士', model: 'A991', name: '竹炭净味乳胶漆', unit: '桶', quantity: [3, 6], room: ['全屋'] },
      { brand: '立邦', model: 'ML-NXB', name: '抗甲醛乳胶漆', unit: '桶', quantity: [3, 5], room: ['全屋'] },
    ],
  },
];

function createCaseMaterials(caseId: string, seed: number): CaseMaterial[] {
  const materials: CaseMaterial[] = [];
  const rooms = ['客厅', '餐厅', '主卧', '次卧', '厨房', '卫生间', '阳台'];
  caseMaterialTemplates.forEach((cat, catIdx) => {
    const matIdx = (seed + catIdx) % cat.materials.length;
    const mat = cat.materials[matIdx];
    const qty = Math.floor(mat.quantity[0] + (seed % (mat.quantity[1] - mat.quantity[0] + 1)));
    materials.push({
      id: `${caseId}-mat-${catIdx + 1}`,
      materialId: `material-${String(catIdx * 3 + matIdx + 1).padStart(3, '0')}`,
      brand: mat.brand,
      model: mat.model,
      name: mat.name,
      quantity: qty,
      unit: mat.unit,
      roomLocation: rooms[(seed + catIdx * 3) % rooms.length],
    });
  });
  return materials;
}

export const mockUsers: User[] = [
  { id: 'user-001', phone: '13800000001', nickname: '张明设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming', role: 'designer', createdAt: new Date('2024-03-15') },
  { id: 'user-002', phone: '13800000002', nickname: '李华设计', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua', role: 'designer', createdAt: new Date('2024-05-20') },
  { id: 'user-003', phone: '13800000003', nickname: '王芳设计', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang', role: 'designer', createdAt: new Date('2024-01-10') },
  { id: 'user-004', phone: '13800000004', nickname: '陈伟设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenwei', role: 'designer', createdAt: new Date('2023-11-28') },
  { id: 'user-005', phone: '13800000005', nickname: '刘洋设计', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuyang', role: 'designer', createdAt: new Date('2024-07-01') },
  { id: 'user-admin', phone: '13800000000', nickname: '平台管理员', role: 'admin', createdAt: new Date('2023-01-01') },
  { id: 'user-c001', phone: '13900000001', nickname: '装修小白', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaobai', role: 'user', createdAt: new Date('2025-01-15') },
  { id: 'user-c002', phone: '13900000002', nickname: '新房业主', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yezhu', role: 'user', createdAt: new Date('2025-02-20') },
];

export const mockDesigners: Designer[] = [
  { id: 'designer-001', userId: 'user-001', name: '张明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming', certificationNo: 'CERT2023001', yearsOfExperience: 8, styleTags: ['现代简约', '北欧风格', '日式'], status: 'approved', qualityScore: 4.85, totalCases: 24, createdAt: new Date('2024-03-15'), title: '首席设计师', company: '创艺装饰', experience: 8, rating: 4.85, completedCases: 24, specialties: ['现代简约', '北欧风格', '日式'], bio: '8年室内设计经验，擅长北欧与日式风格，注重空间利用与自然光线结合。', portfolio: [], applyTime: new Date('2024-03-15').toISOString() },
  { id: 'designer-002', userId: 'user-002', name: '李华', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua', certificationNo: 'CERT2023002', yearsOfExperience: 5, styleTags: ['新中式', '轻奢风格'], status: 'approved', qualityScore: 4.52, totalCases: 15, createdAt: new Date('2024-05-20'), title: '高级设计师', company: '筑梦空间', experience: 5, rating: 4.52, completedCases: 15, specialties: ['新中式', '轻奢风格'], bio: '5年设计经验，专注新中式与轻奢风格，追求传统与现代的融合。', portfolio: [], applyTime: new Date('2024-05-20').toISOString() },
  { id: 'designer-003', userId: 'user-003', name: '王芳', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang', certificationNo: 'CERT2022015', yearsOfExperience: 12, styleTags: ['美式', '法式'], status: 'approved', qualityScore: 4.92, totalCases: 42, createdAt: new Date('2024-01-10'), title: '设计总监', company: '美学工坊', experience: 12, rating: 4.92, completedCases: 42, specialties: ['美式', '欧式古典', '法式'], bio: '12年资深设计师，多次获得设计大奖，擅长美式与法式风格。', portfolio: [], applyTime: new Date('2024-01-10').toISOString() },
  { id: 'designer-004', userId: 'user-004', name: '陈伟', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenwei', certificationNo: 'CERT2023088', yearsOfExperience: 6, styleTags: ['工业风', '极简主义'], status: 'approved', qualityScore: 4.68, totalCases: 18, createdAt: new Date('2023-11-28'), title: '资深设计师', company: '极客设计', experience: 6, rating: 4.68, completedCases: 18, specialties: ['工业风', '极简主义', 'LOFT'], bio: '6年设计经验，LOFT与工业风专家，注重材质质感与空间层次。', portfolio: [], applyTime: new Date('2023-11-28').toISOString() },
  { id: 'designer-005', userId: 'user-005', name: '刘洋', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuyang', certificationNo: 'CERT2024033', yearsOfExperience: 3, styleTags: ['现代简约', 'ins风'], status: 'approved', qualityScore: 4.41, totalCases: 8, createdAt: new Date('2024-07-01'), title: '设计师', company: '青年设计', experience: 3, rating: 4.41, completedCases: 8, specialties: ['现代简约', 'ins风', '小户型改造'], bio: '3年新锐设计师，擅长小户型改造与ins风设计，深受年轻人喜爱。', portfolio: [], applyTime: new Date('2024-07-01').toISOString() },
];

const floorPlans = [svgFloorPlan1, svgFloorPlan2, svgFloorPlan3];

function buildCaseImages(caseId: string): CaseImage[] {
  return [
    { id: `${caseId}-img-1`, url: `https://picsum.photos/seed/${caseId}living/1200/800`, type: 'living' },
    { id: `${caseId}-img-2`, url: `https://picsum.photos/seed/${caseId}bed/1200/800`, type: 'bedroom' },
    { id: `${caseId}-img-3`, url: `https://picsum.photos/seed/${caseId}kitchen/1200/800`, type: 'kitchen' },
    { id: `${caseId}-img-4`, url: `https://picsum.photos/seed/${caseId}bath/1200/800`, type: 'bathroom' },
  ];
}

function buildCase(c: Partial<Case> & { id: string; designerId: string; designerName: string; designerAvatar: string; title: string; city: string; district: string; houseType: string; area: number; rooms: number; bathrooms: number; style: string; budget: number; duration: number; floorPlanSvg: string; description: string; tags: string[]; seed: number }): Case {
  return {
    id: c.id,
    designerId: c.designerId,
    title: c.title,
    city: c.city,
    district: c.district,
    houseType: c.houseType,
    area: c.area,
    rooms: c.rooms,
    bathrooms: c.bathrooms,
    style: c.style,
    budget: c.budget,
    duration: c.duration,
    floorPlanSvg: c.floorPlanSvg,
    electricPlanSvg: svgElectricPlan,
    waterPlanSvg: svgWaterPlan,
    acceptancePhotos: createAcceptancePhotos(c.id),
    materials: createCaseMaterials(c.id, c.seed),
    qualityScore: c.qualityScore ?? 4.7,
    views: c.views ?? 10000,
    status: 'published',
    createdAt: c.createdAt ?? new Date(),
    bedrooms: c.rooms,
    description: c.description,
    tags: c.tags,
    images: buildCaseImages(c.id),
    designerName: c.designerName,
    designerAvatar: c.designerAvatar,
    coverImage: `https://picsum.photos/seed/${c.id}cover/800/600`,
    layout: c.houseType,
    likes: Math.floor(c.views ?? 10000 / 20),
  };
}

const designerMap: Record<string, Designer> = {};
mockDesigners.forEach((d) => { designerMap[d.id] = d; });

export const mockCases: Case[] = [
  buildCase({ id: 'case-001', designerId: 'designer-001', designerName: designerMap['designer-001'].name, designerAvatar: designerMap['designer-001'].avatar, title: '阳光城市花园·北欧风三居', city: '北京', district: '朝阳区', houseType: '三室两厅两卫', area: 128, rooms: 3, bathrooms: 2, style: '北欧风格', budget: 280000, duration: 90, floorPlanSvg: floorPlans[0], description: '以自然、简约、温馨为核心的北欧风格设计，原木色调与白色墙面搭配，营造舒适宜居的家庭氛围。', tags: ['北欧', '三居', '原木', '朝阳区'], seed: 1, qualityScore: 4.9, views: 15820, createdAt: new Date('2025-01-20') }),
  buildCase({ id: 'case-002', designerId: 'designer-003', designerName: designerMap['designer-003'].name, designerAvatar: designerMap['designer-003'].avatar, title: '星河湾·美式轻奢大四居', city: '上海', district: '浦东新区', houseType: '四室两厅两卫', area: 168, rooms: 4, bathrooms: 2, style: '美式', budget: 520000, duration: 120, floorPlanSvg: floorPlans[1], description: '经典美式风格融入轻奢元素，深色木作搭配金属质感，展现大气而精致的生活格调。', tags: ['美式', '轻奢', '四居', '大户型'], seed: 2, qualityScore: 4.95, views: 23650, createdAt: new Date('2024-12-15') }),
  buildCase({ id: 'case-003', designerId: 'designer-002', designerName: designerMap['designer-002'].name, designerAvatar: designerMap['designer-002'].avatar, title: '万科城·新中式雅致三居', city: '杭州', district: '西湖区', houseType: '三室两厅一卫', area: 115, rooms: 3, bathrooms: 1, style: '新中式', budget: 350000, duration: 100, floorPlanSvg: floorPlans[0], description: '将传统中式意境与现代生活方式结合，禅意空间与雅致细节的完美呈现。', tags: ['新中式', '三居', '雅致', '西湖区'], seed: 3, qualityScore: 4.75, views: 8930, createdAt: new Date('2025-02-10') }),
  buildCase({ id: 'case-004', designerId: 'designer-005', designerName: designerMap['designer-005'].name, designerAvatar: designerMap['designer-005'].avatar, title: '保利中央公园·现代简约两居', city: '广州', district: '天河区', houseType: '两室一厅一卫', area: 78, rooms: 2, bathrooms: 1, style: '现代简约', budget: 128000, duration: 65, floorPlanSvg: floorPlans[2], description: '小户型空间优化设计，简约而不简单，最大化利用每一寸空间。', tags: ['现代简约', '两居', '小户型', '高性价比'], seed: 4, qualityScore: 4.55, views: 6720, createdAt: new Date('2025-03-05') }),
  buildCase({ id: 'case-005', designerId: 'designer-004', designerName: designerMap['designer-004'].name, designerAvatar: designerMap['designer-004'].avatar, title: '华润万象城·工业风LOFT', city: '深圳', district: '南山区', houseType: 'LOFT复式', area: 95, rooms: 2, bathrooms: 2, style: '工业风', budget: 260000, duration: 85, floorPlanSvg: floorPlans[0], description: 'LOFT挑高空间设计，裸露砖墙与金属管道，营造个性十足的工业美学。', tags: ['工业风', 'LOFT', '复式', '个性'], seed: 5, qualityScore: 4.78, views: 11240, createdAt: new Date('2025-01-28') }),
  buildCase({ id: 'case-006', designerId: 'designer-001', designerName: designerMap['designer-001'].name, designerAvatar: designerMap['designer-001'].avatar, title: '龙湖天街·日式禅意三居', city: '成都', district: '锦江区', houseType: '三室两厅一卫', area: 108, rooms: 3, bathrooms: 1, style: '日式', budget: 198000, duration: 80, floorPlanSvg: floorPlans[2], description: '日式原木风与禅意美学，榻榻米、障子门、枯山水元素，打造宁静致远的居所。', tags: ['日式', '禅意', '三居', '原木'], seed: 6, qualityScore: 4.82, views: 9560, createdAt: new Date('2025-02-25') }),
  buildCase({ id: 'case-007', designerId: 'designer-003', designerName: designerMap['designer-003'].name, designerAvatar: designerMap['designer-003'].avatar, title: '融创滨江壹号·法式浪漫四居', city: '武汉', district: '武昌区', houseType: '四室两厅两卫', area: 156, rooms: 4, bathrooms: 2, style: '法式', budget: 450000, duration: 110, floorPlanSvg: floorPlans[1], description: '法式浪漫风情，石膏线条、雕花壁炉、优雅弧线，演绎古典与现代的完美交融。', tags: ['法式', '浪漫', '四居', '江景房'], seed: 7, qualityScore: 4.88, views: 14320, createdAt: new Date('2024-12-28') }),
  buildCase({ id: 'case-008', designerId: 'designer-005', designerName: designerMap['designer-005'].name, designerAvatar: designerMap['designer-005'].avatar, title: '碧桂园·ins风温馨两居', city: '南京', district: '玄武区', houseType: '两室两厅一卫', area: 89, rooms: 2, bathrooms: 1, style: 'ins风', budget: 156000, duration: 70, floorPlanSvg: floorPlans[2], description: '时下流行的ins风设计，莫兰迪色系、网红元素、软装配饰，打造年轻人喜爱的温馨家。', tags: ['ins风', '两居', '网红', '温馨'], seed: 8, qualityScore: 4.48, views: 5890, createdAt: new Date('2025-03-18') }),
  buildCase({ id: 'case-009', designerId: 'designer-002', designerName: designerMap['designer-002'].name, designerAvatar: designerMap['designer-002'].avatar, title: '中海寰宇天下·轻奢品质三居', city: '西安', district: '高新区', houseType: '三室两厅两卫', area: 132, rooms: 3, bathrooms: 2, style: '轻奢风格', budget: 380000, duration: 95, floorPlanSvg: floorPlans[0], description: '现代轻奢风格，大理石、金属、丝绒材质搭配，彰显品质生活态度。', tags: ['轻奢', '三居', '品质', '高新区'], seed: 9, qualityScore: 4.62, views: 7840, createdAt: new Date('2025-02-02') }),
  buildCase({ id: 'case-010', designerId: 'designer-004', designerName: designerMap['designer-004'].name, designerAvatar: designerMap['designer-004'].avatar, title: '招商蛇口·极简主义大平层', city: '重庆', district: '渝北区', houseType: '四室两厅三卫', area: 188, rooms: 4, bathrooms: 3, style: '极简主义', budget: 680000, duration: 135, floorPlanSvg: floorPlans[1], description: '极简主义大平层设计，Less is More，以空间留白与材质本身的质感为核心。', tags: ['极简主义', '大平层', '四居', '品质'], seed: 10, qualityScore: 4.7, views: 18560, createdAt: new Date('2024-11-20') }),
];

const localSupplierMarkets = [
  { market: '居然之家北四环店', address: '北京市朝阳区北四环东路65号', phone: '010-84635588', city: '北京' },
  { market: '红星美凯龙东四环店', address: '北京市朝阳区东四环中路193号', phone: '010-87756888', city: '北京' },
  { market: '十里河建材城', address: '北京市朝阳区十八里店乡十里河村', phone: '010-67301888', city: '北京' },
  { market: '居然之家世纪金源店', address: '北京市海淀区远大路1号', phone: '010-88873366', city: '北京' },
  { market: '红星美凯龙真北店', address: '上海市普陀区真北路1108号', phone: '021-32510888', city: '上海' },
  { market: '宜家家居徐汇店', address: '上海市徐汇区漕溪路126号', phone: '021-54256060', city: '上海' },
  { market: '九星建材市场', address: '上海市闵行区虹莘路1号', phone: '021-54861888', city: '上海' },
  { market: '居然之家丽泽店', address: '北京市丰台区西三环南路甲27号', phone: '010-63891888', city: '北京' },
];

function makeLocalSuppliers(materialId: string, indices: number[], prices: number[], stocks: number[]): LocalSupplier[] {
  return indices.map((idx, i) => ({
    id: `${materialId}-supplier-${i + 1}`,
    materialId,
    marketName: localSupplierMarkets[idx].market,
    address: localSupplierMarkets[idx].address,
    phone: localSupplierMarkets[idx].phone,
    price: prices[i],
    stock: stocks[i],
    city: localSupplierMarkets[idx].city,
  }));
}

function buildMaterial(m: Material): Material {
  return {
    ...m,
    description: `${m.brand} ${m.name} ${m.specs}，品质保证，正品行货。`,
    image: m.imageUrl,
    specifications: {
      品牌: m.brand,
      型号: m.model,
      规格: m.specs,
      单位: m.unit,
      产地: '中国',
    },
  };
}

export const mockMaterials: Material[] = [
  buildMaterial({ id: 'material-001', category: '瓷砖', brand: '东鹏', model: 'FG805001', name: '通体大理石瓷砖', specs: '800×800mm 全瓷通体', unit: '片', jdPrice: 168, tmallPrice: 158, imageUrl: 'https://picsum.photos/seed/tile1/400/400', localSuppliers: makeLocalSuppliers('material-001', [0, 1], [148, 152], [580, 320]) }),
  buildMaterial({ id: 'material-002', category: '瓷砖', brand: '马可波罗', model: 'CZ8808AS', name: '抛釉砖', specs: '800×800mm 全抛釉', unit: '片', jdPrice: 198, tmallPrice: 188, imageUrl: 'https://picsum.photos/seed/tile2/400/400', localSuppliers: makeLocalSuppliers('material-002', [2, 4], [178, 185], [240, 410]) }),
  buildMaterial({ id: 'material-003', category: '瓷砖', brand: '诺贝尔', model: 'RS80710', name: '瓷片', specs: '300×600mm 墙面瓷片', unit: '片', jdPrice: 42, tmallPrice: 38, imageUrl: 'https://picsum.photos/seed/tile3/400/400', localSuppliers: makeLocalSuppliers('material-003', [3], [35], [1200]) }),
  buildMaterial({ id: 'material-004', category: '地板', brand: '圣象', model: 'NK8501', name: '多层实木复合地板', specs: '15mm厚 橡木纹理', unit: '㎡', jdPrice: 328, tmallPrice: 315, imageUrl: 'https://picsum.photos/seed/floor1/400/400', localSuppliers: makeLocalSuppliers('material-004', [0, 5], [295, 305], [680, 520]) }),
  buildMaterial({ id: 'material-005', category: '地板', brand: '大自然', model: 'DSJ001', name: '强化复合地板', specs: '12mm厚 E0级环保', unit: '㎡', jdPrice: 168, tmallPrice: 158, imageUrl: 'https://picsum.photos/seed/floor2/400/400', localSuppliers: makeLocalSuppliers('material-005', [1], [145], [890]) }),
  buildMaterial({ id: 'material-006', category: '地板', brand: '菲林格尔', model: 'F431', name: '三层实木地板', specs: '14mm厚 黑胡桃', unit: '㎡', jdPrice: 488, tmallPrice: 468, imageUrl: 'https://picsum.photos/seed/floor3/400/400', localSuppliers: makeLocalSuppliers('material-006', [6], [445], [230]) }),
  buildMaterial({ id: 'material-007', category: '卫浴', brand: '科勒', model: 'K-3722T-0', name: '连体座便器', specs: '五级旋风 节水型', unit: '个', jdPrice: 2680, tmallPrice: 2580, imageUrl: 'https://picsum.photos/seed/toilet1/400/400', localSuppliers: makeLocalSuppliers('material-007', [0, 7], [2380, 2420], [45, 32]) }),
  buildMaterial({ id: 'material-008', category: '卫浴', brand: 'TOTO', model: 'CW981B', name: '智能马桶', specs: '卫洗丽一体型 自动开盖', unit: '个', jdPrice: 8580, tmallPrice: 8380, imageUrl: 'https://picsum.photos/seed/toilet2/400/400', localSuppliers: makeLocalSuppliers('material-008', [4], [7980], [18]) }),
  buildMaterial({ id: 'material-009', category: '卫浴', brand: '箭牌', model: 'AB1116', name: '虹吸式马桶', specs: '静音节水 脲醛盖板', unit: '个', jdPrice: 998, tmallPrice: 899, imageUrl: 'https://picsum.photos/seed/toilet3/400/400', localSuppliers: makeLocalSuppliers('material-009', [2], [820], [156]) }),
  buildMaterial({ id: 'material-010', category: '卫浴', brand: '摩恩', model: '12345EC', name: '淋浴花洒套装', specs: '恒温控制 顶喷+手持', unit: '套', jdPrice: 1580, tmallPrice: 1480, imageUrl: 'https://picsum.photos/seed/shower1/400/400', localSuppliers: makeLocalSuppliers('material-010', [1], [1350], [68]) }),
  buildMaterial({ id: 'material-011', category: '橱柜', brand: '欧派', model: 'OP-2024-A1', name: '整体橱柜定制', specs: '地柜+吊柜 石英石台面', unit: '延米', jdPrice: 3280, tmallPrice: 3180, imageUrl: 'https://picsum.photos/seed/cabinet1/400/400', localSuppliers: makeLocalSuppliers('material-011', [0], [2980], [999]) }),
  buildMaterial({ id: 'material-012', category: '橱柜', brand: '索菲亚', model: 'SF-KC001', name: '定制橱柜', specs: '颗粒板柜体 吸塑门板', unit: '延米', jdPrice: 2580, tmallPrice: 2480, imageUrl: 'https://picsum.photos/seed/cabinet2/400/400', localSuppliers: makeLocalSuppliers('material-012', [5], [2280], [999]) }),
  buildMaterial({ id: 'material-013', category: '门窗', brand: 'TATA木门', model: 'AC-001', name: '实木复合门', specs: '静音门 磁吸锁', unit: '樘', jdPrice: 2680, tmallPrice: 2580, imageUrl: 'https://picsum.photos/seed/door1/400/400', localSuppliers: makeLocalSuppliers('material-013', [3], [2380], [45]) }),
  buildMaterial({ id: 'material-014', category: '门窗', brand: '美心', model: 'MX-8801', name: '防盗门', specs: '甲级安全门 C级锁芯', unit: '樘', jdPrice: 3580, tmallPrice: 3480, imageUrl: 'https://picsum.photos/seed/door2/400/400', localSuppliers: makeLocalSuppliers('material-014', [7], [3180], [22]) }),
  buildMaterial({ id: 'material-015', category: '门窗', brand: '凤铝', model: 'FL-70', name: '断桥铝窗', specs: '70系列 中空钢化玻璃', unit: '㎡', jdPrice: 680, tmallPrice: 650, imageUrl: 'https://picsum.photos/seed/window1/400/400', localSuppliers: makeLocalSuppliers('material-015', [6], [580], [999]) }),
  buildMaterial({ id: 'material-016', category: '乳胶漆', brand: '多乐士', model: 'A991', name: '竹炭净味乳胶漆', specs: '5L装 内墙面漆', unit: '桶', jdPrice: 598, tmallPrice: 568, imageUrl: 'https://picsum.photos/seed/paint1/400/400', localSuppliers: makeLocalSuppliers('material-016', [2, 4], [518, 528], [280, 340]) }),
  buildMaterial({ id: 'material-017', category: '乳胶漆', brand: '立邦', model: 'ML-NXB', name: '抗甲醛乳胶漆', specs: '5L装 净味环保', unit: '桶', jdPrice: 528, tmallPrice: 498, imageUrl: 'https://picsum.photos/seed/paint2/400/400', localSuppliers: makeLocalSuppliers('material-017', [1], [458], [420]) }),
  buildMaterial({ id: 'material-018', category: '乳胶漆', brand: '芬琳', model: 'HEMO', name: '进口乳胶漆', specs: '3L装 芬兰原装进口', unit: '桶', jdPrice: 898, tmallPrice: 858, imageUrl: 'https://picsum.photos/seed/paint3/400/400', localSuppliers: makeLocalSuppliers('material-018', [5], [798], [86]) }),
];

function makeMaterialPrices(): MaterialPrice[] {
  const prices: MaterialPrice[] = [];
  mockMaterials.forEach((m) => {
    m.localSuppliers.forEach((s, idx) => {
      prices.push({
        id: `${m.id}-price-${idx + 1}`,
        materialId: m.id,
        price: s.price,
        region: s.city || '全国',
        supplier: s.marketName,
        updatedAt: new Date().toISOString(),
      });
    });
    if (m.jdPrice) {
      prices.push({
        id: `${m.id}-price-jd`,
        materialId: m.id,
        price: m.jdPrice,
        region: '全国',
        supplier: '京东',
        updatedAt: new Date().toISOString(),
      });
    }
    if (m.tmallPrice) {
      prices.push({
        id: `${m.id}-price-tmall`,
        materialId: m.id,
        price: m.tmallPrice,
        region: '全国',
        supplier: '天猫',
        updatedAt: new Date().toISOString(),
      });
    }
  });
  return prices;
}

export const mockMaterialPrices: MaterialPrice[] = makeMaterialPrices();

export const mockQualityScores: QualityScore[] = mockCases.map((c, idx) => ({
  id: `qs-${c.id}`,
  caseId: c.id,
  completeness: +(4.5 + ((idx * 7) % 5) / 10).toFixed(2),
  photoQuality: +(4.3 + ((idx * 11) % 7) / 10).toFixed(2),
  dataAccuracy: +(4.6 + ((idx * 5) % 4) / 10).toFixed(2),
  designScore: +(4.4 + ((idx * 9) % 6) / 10).toFixed(2),
  totalScore: c.qualityScore,
  reviewedBy: 'user-admin',
  createdAt: new Date(Date.now() - (idx + 1) * 5 * 24 * 60 * 60 * 1000),
}));
