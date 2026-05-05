const sensitiveWords = [
  '赌博', '色情', '毒品', '枪支', '暴力',
  '违法', '诈骗', '传销', '高利贷', '洗钱',
  '法轮功', '邪教', '台独', '藏独', '疆独',
  '反动', '政治敏感', '涉政', '反共', '反党',
  'fuck', 'bitch', 'shit', 'asshole', 'porn',
  'sexy', 'xxx', 'nude', 'sex'
];

function containsSensitiveWord(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return sensitiveWords.some(word => lowerText.includes(word.toLowerCase()));
}

function censorSensitiveWords(text) {
  if (!text) return text;
  let result = text;
  const lowerResult = result.toLowerCase();
  for (const word of sensitiveWords) {
    const lowerWord = word.toLowerCase();
    if (lowerResult.includes(lowerWord)) {
      const regex = new RegExp(word, 'gi');
      result = result.replace(regex, '*'.repeat(word.length));
    }
  }
  return result;
}

module.exports = {
  containsSensitiveWord,
  censorSensitiveWords,
  sensitiveWords
};
