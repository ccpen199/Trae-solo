import { AppDataSource } from '../data-source';
import { SensitiveWord, SensitiveWordCategory } from '../entities/SensitiveWord';

const sensitiveWordRepository = AppDataSource.getRepository(SensitiveWord);

interface SensitiveWordMatch {
  word: string;
  category: SensitiveWordCategory;
  riskLevel: string;
  startIndex: number;
  endIndex: number;
  replacement: string;
}

interface SensitiveCheckResult {
  containsSensitive: boolean;
  matches: SensitiveWordMatch[];
  overallRiskLevel: string;
  filteredText?: string;
}

const DEFAULT_REPLACEMENT = '***';

const RISK_LEVEL_WEIGHT: Record<string, number> = {
  'high': 3,
  'medium': 2,
  'low': 1
};

async function getEnabledSensitiveWords(): Promise<SensitiveWord[]> {
  try {
    return await sensitiveWordRepository.find({ where: { enabled: true } });
  } catch {
    return [];
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function checkSensitiveWords(text: string): Promise<SensitiveCheckResult> {
  if (!text || typeof text !== 'string') {
    return {
      containsSensitive: false,
      matches: [],
      overallRiskLevel: 'low'
    };
  }

  const sensitiveWords = await getEnabledSensitiveWords();
  const matches: SensitiveWordMatch[] = [];

  for (const sensitiveWord of sensitiveWords) {
    const pattern = new RegExp(escapeRegExp(sensitiveWord.word), 'gi');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        word: sensitiveWord.word,
        category: sensitiveWord.category,
        riskLevel: sensitiveWord.riskLevel,
        startIndex: match.index,
        endIndex: match.index + sensitiveWord.word.length,
        replacement: sensitiveWord.replacement || DEFAULT_REPLACEMENT
      });
    }
  }

  matches.sort((a, b) => a.startIndex - b.startIndex);

  let overallRiskLevel = 'low';
  if (matches.length > 0) {
    const maxRisk = Math.max(...matches.map(m => RISK_LEVEL_WEIGHT[m.riskLevel] || 1));
    overallRiskLevel = Object.keys(RISK_LEVEL_WEIGHT).find(
      key => RISK_LEVEL_WEIGHT[key] === maxRisk
    ) || 'low';
  }

  return {
    containsSensitive: matches.length > 0,
    matches,
    overallRiskLevel
  };
}

export async function markSensitiveWords(text: string): Promise<SensitiveCheckResult & { markedText: string }> {
  const result = await checkSensitiveWords(text);

  if (!result.containsSensitive || !text) {
    return {
      ...result,
      markedText: text || ''
    };
  }

  let markedText = text;
  let offset = 0;

  const sortedMatches = [...result.matches].sort((a, b) => a.startIndex - b.startIndex);

  for (const match of sortedMatches) {
    const riskColor = match.riskLevel === 'high' ? '#ff4d4f' :
                      match.riskLevel === 'medium' ? '#faad14' : '#52c41a';
    const markedWord = `<span class="sensitive-word" style="background-color: ${riskColor}20; border-bottom: 2px solid ${riskColor}; border-radius: 2px;" data-risk="${match.riskLevel}" data-category="${match.category}">${match.word}</span>`;

    const start = match.startIndex + offset;
    const end = match.endIndex + offset;
    markedText = markedText.substring(0, start) + markedWord + markedText.substring(end);
    offset += markedWord.length - (match.endIndex - match.startIndex);
  }

  return {
    ...result,
    markedText
  };
}

export async function replaceSensitiveWords(text: string): Promise<SensitiveCheckResult> {
  const result = await checkSensitiveWords(text);

  if (!result.containsSensitive || !text) {
    return {
      ...result,
      filteredText: text || ''
    };
  }

  let filteredText = text;

  const sortedMatches = [...result.matches].sort((a, b) => b.startIndex - a.startIndex);

  for (const match of sortedMatches) {
    filteredText = filteredText.substring(0, match.startIndex) +
                   match.replacement +
                   filteredText.substring(match.endIndex);
  }

  return {
    ...result,
    filteredText
  };
}

export async function checkObjectSensitiveWords<T extends Record<string, any>>(
  obj: T
): Promise<{
  containsSensitive: boolean;
  fields: Array<{
    path: string;
    value: string;
    matches: SensitiveWordMatch[];
  }>;
  overallRiskLevel: string;
}> {
  const fields: Array<{
    path: string;
    value: string;
    matches: SensitiveWordMatch[];
  }> = [];

  const scan = (value: any, currentPath: string): void => {
    if (typeof value === 'string') {
      checkSensitiveWords(value).then(result => {
        if (result.containsSensitive) {
          fields.push({
            path: currentPath || 'root',
            value,
            matches: result.matches
          });
        }
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        scan(item, `${currentPath}[${index}]`);
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach(key => {
        scan(value[key], currentPath ? `${currentPath}.${key}` : key);
      });
    }
  };

  scan(obj, '');

  await new Promise(resolve => setTimeout(resolve, 0));

  let overallRiskLevel = 'low';
  if (fields.length > 0) {
    const allMatches = fields.flatMap(f => f.matches);
    const maxRisk = Math.max(...allMatches.map(m => RISK_LEVEL_WEIGHT[m.riskLevel] || 1));
    overallRiskLevel = Object.keys(RISK_LEVEL_WEIGHT).find(
      key => RISK_LEVEL_WEIGHT[key] === maxRisk
    ) || 'low';
  }

  return {
    containsSensitive: fields.length > 0,
    fields,
    overallRiskLevel
  };
}

export async function filterObjectSensitiveWords<T extends Record<string, any>>(
  obj: T
): Promise<{
  filtered: T;
  containsSensitive: boolean;
  fields: string[];
}> {
  const checkResult = await checkObjectSensitiveWords(obj);
  const fields = checkResult.fields.map(f => f.path);

  const filterValue = async (value: any): Promise<any> => {
    if (typeof value === 'string') {
      const result = await replaceSensitiveWords(value);
      return result.filteredText || value;
    }
    if (Array.isArray(value)) {
      return Promise.all(value.map(filterValue));
    }
    if (typeof value === 'object' && value !== null) {
      const filtered: any = {};
      for (const key of Object.keys(value)) {
        filtered[key] = await filterValue(value[key]);
      }
      return filtered;
    }
    return value;
  };

  const filtered = await filterValue(obj);

  return {
    filtered,
    containsSensitive: checkResult.containsSensitive,
    fields
  };
}

export const sensitiveFilter = {
  checkSensitiveWords,
  markSensitiveWords,
  replaceSensitiveWords,
  checkObjectSensitiveWords,
  filterObjectSensitiveWords
};
