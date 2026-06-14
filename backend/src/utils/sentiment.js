const positiveWords = [
  '好', '棒', '精彩', '优秀', '喜欢', '爱', '赞', '完美', '出色', '感人',
  '动人', '震撼', '惊喜', '推荐', '值得', '经典', '杰作', '过瘾', '细腻',
  '深刻', '真诚', '温暖', '治愈', '爆笑', '过瘾', '惊艳', '绝伦', '巅峰',
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love',
  'best', 'awesome', 'beautiful', 'brilliant', 'outstanding', 'superb',
  'fantastic', 'incredible', 'remarkable', 'splendid', 'marvelous'
];

const negativeWords = [
  '差', '烂', '糟糕', '失望', '垃圾', '无聊', '烂片', '难看', '浪费', '幼稚',
  '愚蠢', '尴尬', '俗套', '拖沓', '冗长', '混乱', '敷衍', '毁原作', '劝退',
  'bad', 'terrible', 'awful', 'worst', 'poor', 'disappointing', 'boring',
  'waste', 'horrible', 'dull', 'messy', 'confusing', 'disappointed', 'sucks',
  'pathetic', 'ridiculous', 'lame', 'mediocre'
];

function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, label: 'neutral' };
  }

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });

  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { score: 0, label: 'neutral' };
  }

  const score = (positiveCount - negativeCount) / total;
  
  let label = 'neutral';
  if (score >= 0.3) label = 'positive';
  else if (score <= -0.3) label = 'negative';

  return { score, label };
}

module.exports = { analyzeSentiment };
