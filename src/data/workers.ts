import type { Worker, SkillCert, SkillCertStatus } from '@/types';

interface SkillConfig {
  id: string;
  name: string;
  status: SkillCertStatus;
  certName: string;
  certNo: string;
  issueDate: string;
  expiryDate: string;
  uploadedAt?: string;
  reviewedAt?: string;
  reviewer?: string;
  reviewNote?: string;
  confidence?: number;
}

const createSkill = (config: SkillConfig): SkillCert => ({
  categoryId: config.id,
  categoryName: config.name,
  certName: config.certName,
  certNo: config.certNo,
  issueDate: config.issueDate,
  expiryDate: config.expiryDate,
  status: config.status,
  uploadedAt: config.uploadedAt,
  reviewedAt: config.reviewedAt,
  reviewer: config.reviewer,
  reviewNote: config.reviewNote,
  ocrResult: config.confidence ? {
    name: '张师傅',
    certType: config.certName,
    certNo: config.certNo,
    issueOrg: '上海市应急管理局',
    issueDate: config.issueDate,
    expiryDate: config.expiryDate,
    confidence: config.confidence,
  } : undefined,
});

const createSkills = (categories: { id: string; name: string }[], status: SkillCertStatus = 'verified'): SkillCert[] =>
  categories.map((c, idx) =>
    createSkill({
      id: c.id,
      name: c.name,
      status,
      certName: `${c.name}资格证`,
      certNo: `CN${(2020 + idx).toString().padStart(4, '0')}${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
      issueDate: '2022-03-15',
      expiryDate: '2027-03-14',
      uploadedAt: status === 'verified' ? '2024-01-10 14:30:00' : undefined,
      reviewedAt: status === 'verified' ? '2024-01-11 09:15:00' : undefined,
      reviewer: status === 'verified' ? '王主管' : undefined,
      reviewNote: status === 'verified' ? '证件有效，准予认证' : undefined,
      confidence: status === 'verified' ? 0.95 : undefined,
    })
  );

export const workers: Worker[] = [
  {
    id: 'w001',
    name: '张师傅',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    phone: '138****1234',
    skills: [
      createSkill({
        id: 'aircon',
        name: '空调维修',
        status: 'verified',
        certName: '空调安装维修资质证',
        certNo: 'CN202200123456',
        issueDate: '2022-03-15',
        expiryDate: '2028-03-14',
        uploadedAt: '2024-01-10 14:30:00',
        reviewedAt: '2024-01-11 09:15:00',
        reviewer: '王主管',
        reviewNote: '证件有效，资质齐全，准予通过',
        confidence: 0.96,
      }),
      createSkill({
        id: 'electric',
        name: '电工',
        status: 'verified',
        certName: '低压电工作业操作证',
        certNo: 'T310115198512031234',
        issueDate: '2021-06-20',
        expiryDate: '2027-06-19',
        uploadedAt: '2024-01-10 15:00:00',
        reviewedAt: '2024-01-11 10:30:00',
        reviewer: '李主管',
        reviewNote: '特种作业操作证真实有效',
        confidence: 0.98,
      }),
      createSkill({
        id: 'appliance',
        name: '家电维修',
        status: 'under_review',
        certName: '家用电器维修职业资格证',
        certNo: 'ZJ202300876543',
        issueDate: '2023-08-10',
        expiryDate: '2028-08-09',
        uploadedAt: '2024-06-13 16:20:00',
        confidence: 0.92,
      }),
    ],
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
    skills: [
      createSkill({
        id: 'plumbing',
        name: '水管疏通',
        status: 'verified',
        certName: '管道工职业资格证',
        certNo: 'CN202100234567',
        issueDate: '2021-09-01',
        expiryDate: '2026-08-31',
        uploadedAt: '2024-02-15 10:20:00',
        reviewedAt: '2024-02-16 14:00:00',
        reviewer: '张主管',
        reviewNote: '资质有效，准予认证',
        confidence: 0.94,
      }),
      createSkill({
        id: 'renovation',
        name: '水电改造',
        status: 'verified',
        certName: '水电安装工程资质证',
        certNo: 'CN202000876543',
        issueDate: '2020-11-20',
        expiryDate: '2025-11-19',
        uploadedAt: '2024-02-15 10:45:00',
        reviewedAt: '2024-02-16 15:30:00',
        reviewer: '王主管',
        reviewNote: '资深水电工，资质齐全',
        confidence: 0.97,
      }),
      createSkill({
        id: 'water_heater',
        name: '热水器',
        status: 'ocr_recognized',
        certName: '热水器安装维修资质证',
        certNo: 'CN202300112233',
        issueDate: '2023-12-01',
        expiryDate: '2028-11-30',
        uploadedAt: '2024-06-14 09:30:00',
        confidence: 0.89,
      }),
    ],
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
