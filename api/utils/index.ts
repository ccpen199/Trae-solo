export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function calculateLevel(exp: number): { level: number; currentExp: number; nextLevelExp: number; progress: number } {
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

export const SENSITIVE_WORDS = [
  '赌博', '色情', '暴力', '毒品', '诈骗', '传销', '刷单', '兼职诈骗',
  '违法', '犯罪', '枪支', '弹药', '假币', '走私',
];

export function filterSensitiveWords(text: string): { filtered: string; hasSensitive: boolean; words: string[] } {
  let filtered = text;
  const foundWords: string[] = [];

  for (const word of SENSITIVE_WORDS) {
    if (text.includes(word)) {
      foundWords.push(word);
      const replacement = '*'.repeat(word.length);
      filtered = filtered.split(word).join(replacement);
    }
  }

  return {
    filtered,
    hasSensitive: foundWords.length > 0,
    words: foundWords,
  };
}

export const DAILY_WITHDRAW_LIMIT = 200;
export const SINGLE_WITHDRAW_MIN = 1;
export const SINGLE_WITHDRAW_MAX = 200;
