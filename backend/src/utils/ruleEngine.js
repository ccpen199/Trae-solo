function detectContent(text, rule) {
  const matches = [];
  const conditions = JSON.parse(rule.conditions);

  if (conditions.type === 'regex' && conditions.patterns) {
    for (const pattern of conditions.patterns) {
      try {
        const regex = new RegExp(pattern.regex, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            type: pattern.name,
            text: match[0],
            index: match.index,
            length: match[0].length,
            description: pattern.desc
          });
        }
      } catch (e) {
        console.error(`Regex error for pattern ${pattern.name}:`, e);
      }
    }
  }

  if (conditions.type === 'keyword' && conditions.keywords) {
    for (const keyword of conditions.keywords) {
      let index = 0;
      while ((index = text.indexOf(keyword, index)) !== -1) {
        matches.push({
          type: '敏感词',
          text: keyword,
          index: index,
          length: keyword.length,
          description: `包含敏感词: ${keyword}`
        });
        index += keyword.length;
      }
    }
  }

  return matches;
}

function getContext(text, matchIndex, matchLength, contextLen = 20) {
  const start = Math.max(0, matchIndex - contextLen);
  const end = Math.min(text.length, matchIndex + matchLength + contextLen);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return prefix + text.slice(start, end) + suffix;
}

module.exports = {
  detectContent,
  getContext
};
