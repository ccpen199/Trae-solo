export const SOURCE_LEVEL_PRIORITY: Record<string, number> = {
  GOV: 4,
  OFFICIAL: 3,
  V: 2,
  ORDINARY: 1,
};

export const getSourceLevelPriority = (level: string): number => {
  return SOURCE_LEVEL_PRIORITY[level] || 0;
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getBoundingBox = (
  latitude: number,
  longitude: number,
  radiusMeters: number
) => {
  const R = 6371000;
  const latDelta = (radiusMeters / R) * (180 / Math.PI);
  const lonDelta =
    ((radiusMeters / R) * (180 / Math.PI)) /
    Math.cos((latitude * Math.PI) / 180);

  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLon: longitude - lonDelta,
    maxLon: longitude + lonDelta,
  };
};

export const calculateHotScore = (
  likeCount: number,
  commentCount: number,
  shareCount: number,
  viewCount: number,
  createdAt: Date,
  decayHours: number = 24
): number => {
  const engagement = likeCount * 1 + commentCount * 2 + shareCount * 3 + viewCount * 0.1;
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const decayFactor = Math.exp(-ageHours / decayHours);
  return engagement * decayFactor;
};

export const generateKeywords = (text: string): string[] => {
  const words = text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);
  return [...new Set(words)].slice(0, 10);
};

export const aiContentScreen = (
  content: string,
  title?: string
): { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; keywords: string[] } => {
  const sensitiveWords = [
    '谣言', '赌博', '色情', '暴力', '毒品', '诈骗', '传销',
    '反动', '分裂', '极端', '恐怖', '非法', '涉政', '攻击政府'
  ];
  const fullText = (title + ' ' + content).toLowerCase();
  const found: string[] = [];

  for (const word of sensitiveWords) {
    if (fullText.includes(word.toLowerCase())) {
      found.push(word);
    }
  }

  const baseScore = found.length * 20;
  const lengthPenalty = fullText.length > 2000 ? 5 : 0;
  const finalScore = Math.min(100, baseScore + lengthPenalty + Math.random() * 10);

  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (finalScore >= 70) level = 'CRITICAL';
  else if (finalScore >= 50) level = 'HIGH';
  else if (finalScore >= 25) level = 'MEDIUM';

  return { score: finalScore, level, keywords: found };
};
