import { FishingMethod } from '@/types';

export const fishingMethods: FishingMethod[] = [
  {
    id: 'tai-diao',
    name: '台钓',
    type: 'tai',
    description: '台湾钓法的简称，是目前最主流的淡水钓法。特点是悬坠钓法，双钩卧底，灵敏度高，适合钓鲫鱼、鲤鱼等淡水鱼。',
    suitableSpecies: ['liyu', 'caoyu', 'qingyu', 'jiyu', 'bianyu'],
    suitableWater: ['lake', 'river', 'reservoir', 'pond'],
    equipment: ['台钓竿', '线组', '浮漂', '鱼钩', '饵料', '钓椅', '钓箱'],
    icon: 'Fishing',
  },
  {
    id: 'lu-ya',
    name: '路亚',
    type: 'lure',
    description: '拟饵钓法，通过操控假饵模拟小鱼来引诱掠食性鱼类攻击。运动感强，是近年来发展最快的钓法。',
    suitableSpecies: ['guiyu', 'heiyu', 'bayu', 'luyu', 'luofei'],
    suitableWater: ['lake', 'river', 'reservoir', 'sea'],
    equipment: ['路亚竿', '纺车轮/水滴轮', 'PE线', '假饵', '控鱼器', '路亚钳'],
    icon: 'Fish',
  },
  {
    id: 'hai-diao',
    name: '海钓',
    type: 'sea',
    description: '在海洋中垂钓的统称，包括矶钓、船钓、滩钓等多种形式。目标鱼种丰富，挑战性强。',
    suitableSpecies: ['bayu', 'luyu', 'heichang', 'jiayu', 'shidiao'],
    suitableWater: ['sea'],
    equipment: ['矶钓竿/船钓竿', '渔轮', '鱼线', '鱼钩', '饵料/假饵', '救生衣', '防晒装备'],
    icon: 'Waves',
  },
  {
    id: 'hei-keng',
    name: '黑坑',
    type: 'blackpit',
    description: '付费垂钓塘，通常会定期投放成鱼供钓友垂钓。竞争激烈，讲究技术和饵料搭配，是竞技钓的训练场。',
    suitableSpecies: ['liyu', 'caoyu', 'jiyu', 'luofei'],
    suitableWater: ['pond'],
    equipment: ['黑坑竿', '线组', '浮漂', '散炮饵料', '小药', '钓箱', '抄网'],
    icon: 'Target',
  },
];

export function getMethodById(id: string): FishingMethod | undefined {
  return fishingMethods.find(m => m.id === id);
}

export function getMethodsByWaterType(waterType: string): FishingMethod[] {
  return fishingMethods.filter(m => m.suitableWater.includes(waterType));
}
