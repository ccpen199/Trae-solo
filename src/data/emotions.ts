import type { Emotion } from '../types';

export const emotions: Emotion[] = [
  {
    id: 'emotion-purr-001',
    name: '呼噜',
    nameEn: 'Purr',
    category: 'purr',
    description: '猫咪发出的低频持续性振动声，通常表示满足和放松，但也可能在疼痛或焦虑时出现，具有自我安抚作用。',
    color: '#34D399',
    baseFrequency: 25,
    avgDuration: 3000,
    typicalScenarios: [
      '被主人抚摸时',
      '舒适地睡觉时',
      '吃喜欢的食物时',
      '疼痛自我安抚时',
      '靠近信任的人时'
    ],
    suggestions: [
      '继续当前的互动方式，猫咪很享受',
      '观察呼噜的强度，过弱可能表示不适',
      '配合轻柔的抚摸增强情感联结',
      '如果伴随其他异常症状请咨询兽医',
      '可以轻声说话回应猫咪'
    ]
  },
  {
    id: 'emotion-meow-001',
    name: '喵叫',
    nameEn: 'Meow',
    category: 'meow',
    description: '猫咪最常见的叫声，主要用于与人类交流。不同的音调和长度表达不同的需求，如饥饿、问候、求助或不满。',
    color: '#F59E0B',
    baseFrequency: 500,
    avgDuration: 800,
    typicalScenarios: [
      '食物碗空了时',
      '想进入某个房间时',
      '主人回家迎接时',
      '感到无聊想玩耍时',
      '寻找主人关注时'
    ],
    suggestions: [
      '检查食物和水是否充足',
      '观察猫咪是否想进出某个区域',
      '回应猫咪的叫声，给予关注',
      '准备逗猫棒等玩具进行互动',
      '短而急促的喵叫可能表示急切需求'
    ]
  },
  {
    id: 'emotion-hiss-001',
    name: '嘶叫',
    nameEn: 'Hiss',
    category: 'hiss',
    description: '猫咪发出的嘶嘶声，是明确的警告信号。通常在感到威胁、恐惧或防御时出现，配合张牙露齿和弓背姿势。',
    color: '#F87171',
    baseFrequency: 8000,
    avgDuration: 500,
    typicalScenarios: [
      '遇到陌生动物时',
      '被惊吓后防御时',
      '领地被侵犯时',
      '感到疼痛被触碰时',
      '与其他猫对峙时'
    ],
    suggestions: [
      '立即停止让猫咪不安的行为',
      '给猫咪足够的空间和时间冷静',
      '不要强行接近或抚摸',
      '检查环境中是否有压力源',
      '缓慢远离，避免直视眼睛'
    ]
  },
  {
    id: 'emotion-wail-001',
    name: '哀鸣',
    nameEn: 'Wail',
    category: 'wail',
    description: '拉长且音调较高的叫声，类似哭泣声。可能表示孤独、焦虑、困惑，老年猫可能因认知障碍而频繁发出这种叫声。',
    color: '#A78BFA',
    baseFrequency: 1200,
    avgDuration: 2000,
    typicalScenarios: [
      '主人离家后感到孤独时',
      '迷路或被困时',
      '老年猫认知混乱时',
      '发情期寻找配偶时',
      '身体不适疼痛时'
    ],
    suggestions: [
      '检查猫咪是否被困或受伤',
      '给予安抚和陪伴',
      '老年猫频繁哀鸣建议兽医检查',
      '提供熟悉的玩具和毯子',
      '保持环境稳定减少焦虑'
    ]
  },
  {
    id: 'emotion-growl-001',
    name: '低吼',
    nameEn: 'Growl',
    category: 'growl',
    description: '低沉的威胁性声音，比嘶叫更具攻击性。通常是攻击前的最后警告，表示猫咪感到极度威胁或正在保护资源。',
    color: '#EF4444',
    baseFrequency: 150,
    avgDuration: 1200,
    typicalScenarios: [
      '保护食物时',
      '与其他猫打架前',
      '被过度挑逗时',
      '守护幼崽时',
      '疼痛刺激时'
    ],
    suggestions: [
      '立即退后，保持安全距离',
      '不要试图惩罚，会加剧攻击性',
      '如果是护食行为，可逐步训练改善',
      '等待猫咪完全冷静后再接近',
      '频繁低吼建议咨询动物行为学家'
    ]
  },
  {
    id: 'emotion-content-001',
    name: '满足',
    nameEn: 'Content',
    category: 'content',
    description: '轻柔的短音和 Chirp 啁啾声的组合，表示猫咪处于放松满足的状态。常出现在舒服地打盹前后，或看到主人时的友好问候。',
    color: '#60A5FA',
    baseFrequency: 350,
    avgDuration: 600,
    typicalScenarios: [
      '刚醒来伸懒腰时',
      '晒太阳打盹时',
      '看到主人友好问候时',
      '观察窗外小鸟时',
      '被轻柔抚摸时'
    ],
    suggestions: [
      '保持当前环境的安静舒适',
      '可以轻轻抚摸猫咪的头部',
      '这是记录美好互动的好时机',
      '不要突然打扰猫咪的放松状态',
      '提供温暖的休息区域'
    ]
  }
];

export const getEmotionById = (id: string): Emotion | undefined => {
  return emotions.find((e) => e.id === id);
};

export const getEmotionByCategory = (category: string): Emotion | undefined => {
  return emotions.find((e) => e.category === category);
};
