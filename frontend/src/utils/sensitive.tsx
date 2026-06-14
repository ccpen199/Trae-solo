import type { SensitiveWord } from '../types';

let sensitiveWordsCache: SensitiveWord[] = [];

export const setSensitiveWords = (words: SensitiveWord[]): void => {
  sensitiveWordsCache = words.filter(w => w.enabled);
};

export const getSensitiveWords = (): SensitiveWord[] => {
  return sensitiveWordsCache;
};

export const findSensitiveWords = (text: string): Array<{ word: string; category: string; riskLevel: string; index: number }> => {
  const results: Array<{ word: string; category: string; riskLevel: string; index: number }> = [];
  
  if (!text || sensitiveWordsCache.length === 0) {
    return results;
  }

  sensitiveWordsCache.forEach(item => {
    const regex = new RegExp(item.word, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({
        word: item.word,
        category: item.category,
        riskLevel: item.riskLevel,
        index: match.index,
      });
    }
  });

  return results.sort((a, b) => a.index - b.index);
};

export const highlightSensitiveWords = (text: string): React.ReactNode => {
  if (!text) return text;

  const sensitiveMatches = findSensitiveWords(text);
  
  if (sensitiveMatches.length === 0) {
    return text;
  }

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'yellow';
      default:
        return 'red';
    }
  };

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  sensitiveMatches.forEach((match, idx) => {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }
    
    const wordColor = getRiskColor(match.riskLevel);
    elements.push(
      <span
        key={`${idx}-${match.index}`}
        style={{
          color: wordColor === 'red' ? '#ff4d4f' : wordColor === 'orange' ? '#fa8c16' : '#fadb14',
          fontWeight: 'bold',
          backgroundColor: wordColor === 'red' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(250, 140, 22, 0.1)',
          padding: '0 2px',
          borderRadius: '2px',
        }}
        title={`敏感词: ${match.word}, 分类: ${match.category}, 风险: ${match.riskLevel}`}
      >
        {match.word}
      </span>
    );
    
    lastIndex = match.index + match.word.length;
  });

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return <>{elements}</>;
};

export const containsSensitiveWords = (text: string): boolean => {
  return findSensitiveWords(text).length > 0;
};

export const getRiskLevelLabel = (level: string): { text: string; color: string } => {
  switch (level) {
    case 'high':
      return { text: '高风险', color: 'red' };
    case 'medium':
      return { text: '中风险', color: 'orange' };
    case 'low':
      return { text: '低风险', color: 'yellow' };
    default:
      return { text: '未知', color: 'default' };
  }
};

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    salary_promise: '薪资承诺',
    overtime_culture: '加班文化',
    false_publicity: '虚假宣传',
    other: '其他',
  };
  return labels[category] || category;
};
