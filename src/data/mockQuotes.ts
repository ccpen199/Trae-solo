import type { AIQuoteRequest, AIQuoteResult } from '../types';

export const mockQuoteRequests: AIQuoteRequest[] = [
  {
    id: 'qr001',
    ownerId: 'u001',
    floorPlanImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=floor%20plan%203%20bedroom%20apartment%20blueprint&image_size=square',
    area: 120,
    rooms: 3,
    style: 'modern',
    materialPreference: 'mid-range',
    createdAt: new Date('2026-06-18'),
  },
];

export const mockQuoteResults: AIQuoteResult[] = [
  {
    id: 'qres001',
    requestId: 'qr001',
    totalPrice: 258000,
    breakdown: {
      labor: 77400,
      auxiliaryMaterials: 51600,
      mainMaterials: 90300,
      managementFee: 25800,
      designFee: 12900,
    },
    itemizedQuotes: [
      { category: '拆除工程', name: '墙体拆除', unit: '㎡', quantity: 15, unitPrice: 80, totalPrice: 1200 },
      { category: '拆除工程', name: '地面铲除', unit: '㎡', quantity: 120, unitPrice: 35, totalPrice: 4200 },
      { category: '水电工程', name: '强电改造', unit: '㎡', quantity: 120, unitPrice: 180, totalPrice: 21600 },
      { category: '水电工程', name: '弱电改造', unit: '㎡', quantity: 120, unitPrice: 85, totalPrice: 10200 },
      { category: '水电工程', name: '给排水改造', unit: '项', quantity: 1, unitPrice: 8500, totalPrice: 8500 },
      { category: '泥瓦工程', name: '墙面找平', unit: '㎡', quantity: 280, unitPrice: 45, totalPrice: 12600 },
      { category: '泥瓦工程', name: '地砖铺设', unit: '㎡', quantity: 120, unitPrice: 120, totalPrice: 14400 },
      { category: '泥瓦工程', name: '墙砖铺设', unit: '㎡', quantity: 80, unitPrice: 130, totalPrice: 10400 },
      { category: '木工工程', name: '吊顶制作', unit: '㎡', quantity: 95, unitPrice: 180, totalPrice: 17100 },
      { category: '木工工程', name: '定制衣柜', unit: '㎡', quantity: 18, unitPrice: 850, totalPrice: 15300 },
      { category: '木工工程', name: '定制橱柜', unit: 'm', quantity: 6, unitPrice: 2200, totalPrice: 13200 },
      { category: '油漆工程', name: '墙面乳胶漆', unit: '㎡', quantity: 280, unitPrice: 65, totalPrice: 18200 },
      { category: '油漆工程', name: '木器漆', unit: '㎡', quantity: 45, unitPrice: 120, totalPrice: 5400 },
      { category: '安装工程', name: '地板安装', unit: '㎡', quantity: 95, unitPrice: 80, totalPrice: 7600 },
      { category: '安装工程', name: '灯具安装', unit: '项', quantity: 1, unitPrice: 3500, totalPrice: 3500 },
      { category: '安装工程', name: '洁具安装', unit: '项', quantity: 1, unitPrice: 2800, totalPrice: 2800 },
      { category: '主材', name: '地砖（800x800）', unit: '㎡', quantity: 120, unitPrice: 320, totalPrice: 38400 },
      { category: '主材', name: '木地板（复合）', unit: '㎡', quantity: 95, unitPrice: 280, totalPrice: 26600 },
      { category: '主材', name: '墙砖（300x600）', unit: '㎡', quantity: 80, unitPrice: 180, totalPrice: 14400 },
      { category: '主材', name: '实木复合门', unit: '樘', quantity: 5, unitPrice: 2200, totalPrice: 11000 },
    ],
    generatedAt: new Date('2026-06-18'),
  },
];

export const styleOptions = [
  { value: 'modern', label: '现代简约', description: '简洁明快，注重功能性' },
  { value: 'european', label: '欧式古典', description: '华丽典雅，线条复杂' },
  { value: 'chinese', label: '新中式', description: '传统元素与现代结合' },
  { value: 'minimalist', label: '极简主义', description: '少即是多，纯粹空间' },
  { value: 'industrial', label: '工业风', description: '原始质感，金属元素' },
];

export const materialOptions = [
  { value: 'budget', label: '经济实惠', multiplier: 0.8 },
  { value: 'mid-range', label: '品质之选', multiplier: 1.0 },
  { value: 'premium', label: '高端精品', multiplier: 1.3 },
  { value: 'luxury', label: '奢华定制', multiplier: 1.8 },
];
