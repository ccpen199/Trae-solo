export interface Scene {
  id: string;
  name: string;
  description: string;
  commonEmotions: string[];
  icon: string;
}

export const scenes: Scene[] = [
  {
    id: 'scene-001',
    name: '喂食时间',
    description: '猫咪在进食或等待食物时的场景',
    commonEmotions: ['meow', 'content', 'purr'],
    icon: '🍽️'
  },
  {
    id: 'scene-002',
    name: '主人回家',
    description: '主人下班或外出回家时迎接的场景',
    commonEmotions: ['meow', 'content', 'purr'],
    icon: '🏠'
  },
  {
    id: 'scene-003',
    name: '玩耍互动',
    description: '与主人或玩具互动玩耍时的场景',
    commonEmotions: ['meow', 'content'],
    icon: '🧶'
  },
  {
    id: 'scene-004',
    name: '抚摸撸猫',
    description: '被主人抚摸、撸猫时的场景',
    commonEmotions: ['purr', 'content'],
    icon: '🤲'
  },
  {
    id: 'scene-005',
    name: '睡觉打盹',
    description: '猫咪睡觉或打盹前后的场景',
    commonEmotions: ['purr', 'content'],
    icon: '😴'
  },
  {
    id: 'scene-006',
    name: '晒太阳',
    description: '猫咪在窗边或阳光下放松的场景',
    commonEmotions: ['content', 'purr'],
    icon: '☀️'
  },
  {
    id: 'scene-007',
    name: '遇到陌生猫咪',
    description: '遇到其他猫咪或陌生动物时的场景',
    commonEmotions: ['hiss', 'growl', 'wail'],
    icon: '🐱'
  },
  {
    id: 'scene-008',
    name: '陌生人来访',
    description: '家里有陌生人来访时的场景',
    commonEmotions: ['hiss', 'wail'],
    icon: '🚪'
  },
  {
    id: 'scene-009',
    name: '看窗外',
    description: '猫咪观察窗外鸟类或风景时的场景',
    commonEmotions: ['content', 'meow'],
    icon: '🪟'
  },
  {
    id: 'scene-010',
    name: '医疗检查',
    description: '去医院或接受身体检查时的场景',
    commonEmotions: ['hiss', 'wail', 'growl'],
    icon: '🏥'
  },
  {
    id: 'scene-011',
    name: '洗澡清洁',
    description: '给猫咪洗澡或清洁时的场景',
    commonEmotions: ['wail', 'hiss'],
    icon: '🛁'
  },
  {
    id: 'scene-012',
    name: '剪指甲',
    description: '给猫咪修剪指甲时的场景',
    commonEmotions: ['hiss', 'wail', 'growl'],
    icon: '✂️'
  },
  {
    id: 'scene-013',
    name: '独自在家',
    description: '主人外出，猫咪独自在家时的场景',
    commonEmotions: ['wail', 'content'],
    icon: '🔑'
  },
  {
    id: 'scene-014',
    name: '猫薄荷反应',
    description: '接触猫薄荷或猫草时的反应场景',
    commonEmotions: ['purr', 'content', 'meow'],
    icon: '🌿'
  },
  {
    id: 'scene-015',
    name: '探索新环境',
    description: '搬家或到新环境探索时的场景',
    commonEmotions: ['wail', 'hiss', 'content'],
    icon: '📦'
  }
];

export const getSceneById = (id: string): Scene | undefined => {
  return scenes.find((s) => s.id === id);
};
