export function calculateLevel(exp: number): {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  progress: number;
} {
  const levelConfigs = [
    { level: 1, expRequired: 0 },
    { level: 2, expRequired: 100 },
    { level: 3, expRequired: 300 },
    { level: 4, expRequired: 600 },
    { level: 5, expRequired: 1000 },
    { level: 6, expRequired: 1500 },
    { level: 7, expRequired: 2100 },
    { level: 8, expRequired: 2800 },
    { level: 9, expRequired: 3600 },
    { level: 10, expRequired: 4500 },
  ];

  let level = 1;
  let currentExp = exp;
  let nextLevelExp = 100;

  for (let i = 0; i < levelConfigs.length; i++) {
    if (exp >= levelConfigs[i].expRequired) {
      level = levelConfigs[i].level;
      currentExp = exp - levelConfigs[i].expRequired;
      nextLevelExp = i + 1 < levelConfigs.length
        ? levelConfigs[i + 1].expRequired - levelConfigs[i].expRequired
        : 1000;
    }
  }

  const progress = Math.min((currentExp / nextLevelExp) * 100, 100);

  return { level, currentExp, nextLevelExp, progress };
}

export function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: '新手',
    2: '学徒',
    3: '入门',
    4: '熟练',
    5: '精通',
    6: '专家',
    7: '大师',
    8: '宗师',
    9: '传奇',
    10: '神话',
  };
  return titles[level] || '新手';
}
