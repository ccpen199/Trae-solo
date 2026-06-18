import { SENSITIVE_WORDS } from '../constants/sensitive-words';
import { SENSITIVE_WORD_THRESHOLD } from '../constants/business';

export interface SensitiveCheckResult {
  hasSensitive: boolean;
  score: number;
  matchedWords: string[];
}

export function checkSensitiveContent(
  content: string,
  sensitiveWords: string[] = SENSITIVE_WORDS,
): SensitiveCheckResult {
  const matchedWords: string[] = [];
  const lowerContent = content.toLowerCase();

  for (const word of sensitiveWords) {
    if (lowerContent.includes(word.toLowerCase())) {
      matchedWords.push(word);
    }
  }

  const score = matchedWords.length > 0 ? Math.min(matchedWords.length / 3, 1) : 0;
  const hasSensitive = score >= SENSITIVE_WORD_THRESHOLD;

  return { hasSensitive, score, matchedWords };
}

export function filterSensitiveContent(content: string, replaceChar: string = '***'): string {
  const { matchedWords } = checkSensitiveContent(content);
  let result = content;

  for (const word of matchedWords) {
    const regex = new RegExp(escapeRegex(word), 'gi');
    result = result.replace(regex, replaceChar);
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
