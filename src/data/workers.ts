import type { Worker, SkillCert } from '@/types';

const createSkills = (categories: { id: string; name: string }[], status: 'verified' | 'pending' | 'expired' = 'verified'): SkillCert[] =>
  categories.map((c, idx) => ({
    categoryId: c.id,
    categoryName: c.name,
    certName: `${c.name}资格证`,
    certNo: `CN${(2020 + idx).toString().padStart(4, '0')}${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
    issueDate: '2022-03-15',
    expiryDate: '2027-03-14',
    status,
    confidence: 0.96,
  }));

export const workers: Worker[] = [
  {
    id: 'w001',
    name: '张师傅',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    phone: '138****1234',
    skills: createSkills([
      { id: 'aircon', name: '空调维修' },
      { id: 'electric', name: '电工' },
      { id: 'appliance', name: '家电维修' },
    ]),
    rating: 4.9,
    orderCount: 523,
    location: { lat: 31.2304, lng: 121.4737 },
    status: 'online',
    distanceKm: 1.2,
    matchScore: 98,
    bio: '10年空调维修经验，持有高级电工证，专注中央空调与家用空调维修保养。',
  },
  {
    id: 'w002',
    name: '李师傅',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    phone: '139****5678',
    skills: createSkills([
      { id: 'plumbing', name: '水管疏通' },
      { id: 'renovation', name: '水电改造' },
      { id: 'water_heater', name: '热水器' },
    ]),
    rating: 4.8,
    orderCount: 412,
    location: { lat: 31.2354, lng: 121.4797 },
    status: 'busy',
    distanceKm: 2.1,
    matchScore: 95,
    bio: '8年水电改造经验，擅长老房翻新，持证上岗，工艺规范。',
  },
  {
    id: 'w003',
    name: '王师傅',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    phone: '137****2345',
    skills: createSkills([
      { id: 'electric', name: '电工' },
      { id: 'door_lock', name: '门锁安防' },
    ]),
    rating: 4.7,
    orderCount: 298,
    location: { lat: 31.2284, lng: 121.4687 },
    status: 'online',
    distanceKm: 0.8,
    matchScore: 92,
    bio: '资深电工，曾任职于国家电网，精通家庭电路故障排查与改造。',
  },
  {
    id: 'w004',
    name: '陈师傅',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen',
    phone: '136****8901',
    skills: createSkills([
      { id: 'aircon', name: '空调维修' },
      { id: 'appliance', name: '家电维修' },
      { id: 'water_heater', name: '热水器' },
    ]),
    rating: 4.9,
    orderCount: 656,
    location: { lat: 31.2404, lng: 121.4717 },
    status: 'online',
    distanceKm: 3.0,
    matchScore: 90,
    bio: '金牌师傅，累计服务超600户，擅长各类家电疑难杂症。',
  },
  {
    id: 'w005',
    name: '刘师傅',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu',
    phone: '135****3456',
    skills: createSkills([
      { id: 'pest_control', name: '消杀除虫' },
    ]),
    rating: 4.6,
    orderCount: 187,
    location: { lat: 31.2324, lng: 121.4657 },
    status: 'offline',
    distanceKm: 1.5,
    matchScore: 85,
    bio: '专业消杀10年，使用环保药剂，安全高效，支持一年质保。',
  },
  {
    id: 'w006',
    name: '赵师傅',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
    phone: '138****7890',
    skills: createSkills([
      { id: 'door_lock', name: '门锁安防' },
      { id: 'electric', name: '电工' },
    ]),
    rating: 4.8,
    orderCount: 334,
    location: { lat: 31.2374, lng: 121.4757 },
    status: 'online',
    distanceKm: 2.5,
    matchScore: 88,
    bio: '专业开锁换锁，24小时上门，公安备案，安全可靠。',
  },
  {
    id: 'w007',
    name: '孙师傅',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun',
    phone: '139****0123',
    skills: createSkills([
      { id: 'renovation', name: '水电改造' },
      { id: 'plumbing', name: '水管疏通' },
      { id: 'electric', name: '电工' },
    ]),
    rating: 4.9,
    orderCount: 221,
    location: { lat: 31.2264, lng: 121.4747 },
    status: 'busy',
    distanceKm: 1.8,
    matchScore: 96,
    bio: '装修行业15年，专业水电改造施工队，隐蔽工程质保5年。',
  },
  {
    id: 'w008',
    name: '周师傅',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou',
    phone: '137****4567',
    skills: createSkills([
      { id: 'water_heater', name: '热水器' },
      { id: 'appliance', name: '家电维修' },
    ]),
    rating: 4.7,
    orderCount: 156,
    location: { lat: 31.2334, lng: 121.4807 },
    status: 'online',
    distanceKm: 2.8,
    matchScore: 82,
    bio: '热水器专家，各品牌燃气/电热水器维修安装，原厂配件。',
  },
];

export function getWorkerById(id: string): Worker | undefined {
  return workers.find(w => w.id === id);
}

export function getWorkersBySkillCategory(categoryId: string): Worker[] {
  return workers.filter(w =>
    w.skills.some(s => s.categoryId === categoryId && s.status === 'verified')
  );
}
