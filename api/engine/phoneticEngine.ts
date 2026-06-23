import type { CharacterInfo, PhoneticAnalysis } from '../../shared/types.js';

const INITIALS = [
  'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
  'g', 'k', 'h', 'j', 'q', 'x',
  'zh', 'ch', 'sh', 'r', 'z', 'c', 's',
  'y', 'w'
];

const INITIAL_CATEGORIES: Record<string, string> = {
  'b': '双唇', 'p': '双唇', 'm': '双唇', 'f': '唇齿',
  'd': '舌尖中', 't': '舌尖中', 'n': '舌尖中', 'l': '舌尖中',
  'g': '舌根', 'k': '舌根', 'h': '舌根',
  'j': '舌面', 'q': '舌面', 'x': '舌面',
  'zh': '舌尖后', 'ch': '舌尖后', 'sh': '舌尖后', 'r': '舌尖后',
  'z': '舌尖前', 'c': '舌尖前', 's': '舌尖前',
  'y': '零声母', 'w': '零声母', '': '零声母'
};

const VOWEL_CATEGORIES: Record<string, string> = {
  'a': '开口', 'o': '开口', 'e': '开口', 'ai': '开口', 'ei': '开口',
  'ao': '开口', 'ou': '开口', 'an': '开口', 'en': '开口', 'ang': '开口',
  'eng': '开口', 'er': '开口',
  'i': '齐齿', 'ia': '齐齿', 'ie': '齐齿', 'iao': '齐齿', 'iu': '齐齿',
  'ian': '齐齿', 'in': '齐齿', 'iang': '齐齿', 'ing': '齐齿',
  'u': '合口', 'ua': '合口', 'uo': '合口', 'uai': '合口', 'ui': '合口',
  'uan': '合口', 'un': '合口', 'uang': '合口', 'ong': '合口',
  'ü': '撮口', 'üe': '撮口', 'üan': '撮口', 'ün': '撮口', 'iong': '撮口'
};

const BAD_HOMOPHONES: Record<string, string> = {
  'wáng bā': '王八', 'wáng dàn': '王八蛋',
  'bái chī': '白痴', 'bèn dàn': '笨蛋',
  'chǔn zhū': '蠢猪', 'dāi zi': '呆子',
  'è dú': '恶毒', 'fàn jiàn': '犯贱',
  'gāng jīng': '杠精', 'gǒu niáng': '狗娘',
  'hún dàn': '混蛋', 'jī māo': '鸡毛',
  'láng xīn': '狼心', 'má fán': '麻烦',
  'nǎo cán': '脑残', 'pí qi': '脾气',
  'qiǎng dào': '强盗', 'rén zhā': '人渣',
  'shǎ guā': '傻瓜', 'sǐ wáng': '死亡',
  'tǎo yàn': '讨厌', 'wú chǐ': '无耻',
  'xiǎo rén': '小人', 'yāo guài': '妖怪',
  'zhà piàn': '诈骗', 'zhū gǒu': '猪狗',
  'zuì è': '罪恶', 'chòu bǐ': '臭逼',
  'cào nǐ': '操你', 'shǎ bī': '傻逼',
  'è xīn': '恶心', 'liú máng': '流氓'
};

const BAD_CHAR_PAIRS: Array<{ pattern: RegExp; note: string }> = [
  { pattern: /wu[\s]?can/i, note: '可能谐音"无能"' },
  { pattern: /fei[\s]?wu/i, note: '可能谐音"废物"' },
  { pattern: /bai[\s]?chi/i, note: '可能谐音"白痴"' },
  { pattern: /sha[\s]?bi/i, note: '可能谐音不雅' },
  { pattern: /cao[\s]?ni/i, note: '可能谐音不雅' },
  { pattern: /ma[\s]?bi/i, note: '可能谐音不雅' },
  { pattern: /zhi[\s]?zhang/i, note: '可能谐音"智障"' },
  { pattern: /nao[\s]?can/i, note: '可能谐音"脑残"' },
  { pattern: /sang[\s]?men/i, note: '可能谐音"丧门"' },
  { pattern: /si[\s]?wang/i, note: '可能谐音"死亡"' },
  { pattern: /er[\s]?zi/i, note: '可能谐音"儿子"(不利长辈)' }
];

function splitPinyin(pinyin: string): { initial: string; final: string } {
  const cleanPinyin = pinyin.replace(/[1-4]/g, '').trim().toLowerCase();
  
  for (const initial of INITIALS.sort((a, b) => b.length - a.length)) {
    if (cleanPinyin.startsWith(initial)) {
      const final = cleanPinyin.slice(initial.length);
      return { initial, final };
    }
  }
  
  return { initial: '', final: cleanPinyin };
}

function getTonePattern(tones: number[]): string {
  return tones.map(tone => {
    if (tone === 1 || tone === 2) return '平';
    if (tone === 3 || tone === 4) return '仄';
    return '中';
  }).join('');
}

function isToneHarmonious(pattern: string): boolean {
  if (pattern.length < 2) return true;
  
  let repeatCount = 1;
  let hasRepeat = false;
  
  for (let i = 1; i < pattern.length; i++) {
    if (pattern[i] === pattern[i - 1]) {
      repeatCount++;
      if (repeatCount >= 3) hasRepeat = true;
    } else {
      repeatCount = 1;
    }
  }
  
  if (hasRepeat) return false;
  
  if (pattern.length === 2) {
    return pattern === '平仄' || pattern === '仄平';
  }
  
  if (pattern.length === 3) {
    const goodPatterns = ['平仄平', '仄平仄', '平平仄', '仄仄平', '平仄仄', '仄平平'];
    return goodPatterns.includes(pattern);
  }
  
  return true;
}

function checkBadHomophone(pinyins: string[]): { hasBad: boolean; notes: string[] } {
  const notes: string[] = [];
  const combined = pinyins.join(' ');
  const cleanCombined = combined.replace(/[1-4]/g, '').toLowerCase();
  
  for (const [key, value] of Object.entries(BAD_HOMOPHONES)) {
    if (cleanCombined.includes(key)) {
      notes.push(`可能谐音不雅词"${value}"`);
    }
  }
  
  for (let i = 0; i < pinyins.length - 1; i++) {
    const pair = pinyins[i].replace(/[1-4]/g, '').toLowerCase() + 
                 ' ' + 
                 pinyins[i + 1].replace(/[1-4]/g, '').toLowerCase();
    
    for (const { pattern, note } of BAD_CHAR_PAIRS) {
      if (pattern.test(pair)) {
        if (!notes.includes(note)) {
          notes.push(note);
        }
      }
    }
  }
  
  return { hasBad: notes.length > 0, notes };
}

function checkDoubleInitial(initials: string[]): boolean {
  for (let i = 0; i < initials.length - 1; i++) {
    if (initials[i] && initials[i] === initials[i + 1]) {
      return true;
    }
  }
  return false;
}

function checkRhymeConflict(finals: string[]): { hasConflict: boolean; level: 'low' | 'medium' | 'high' } {
  let sameCount = 0;
  
  for (let i = 0; i < finals.length - 1; i++) {
    if (finals[i] === finals[i + 1]) {
      sameCount++;
    }
  }
  
  if (sameCount === 0) return { hasConflict: false, level: 'low' };
  if (sameCount === 1) return { hasConflict: true, level: 'medium' };
  return { hasConflict: true, level: 'high' };
}

function calculateToneScore(tones: number[], pattern: string): number {
  let score = 60;
  
  if (isToneHarmonious(pattern)) {
    score += 20;
  }
  
  if (pattern.length >= 2) {
    const transitions = pattern.split('').filter((c, i, arr) => 
      i > 0 && c !== arr[i - 1] && c !== '中' && arr[i - 1] !== '中'
    ).length;
    
    if (transitions >= Math.floor(pattern.length / 2)) {
      score += 10;
    }
  }
  
  const uniqueTones = new Set(tones.filter(t => t > 0)).size;
  score += Math.min(uniqueTones * 3, 10);
  
  return Math.min(score, 100);
}

function calculatePhoneticScore(
  initials: string[],
  finals: string[],
  tones: number[],
  pattern: string,
  hasBadHomophone: boolean
): number {
  let score = 50;
  
  const toneScore = calculateToneScore(tones, pattern);
  score = toneScore * 0.4 + score;
  
  if (!checkDoubleInitial(initials)) {
    score += 10;
  } else {
    score -= 5;
  }
  
  const rhymeCheck = checkRhymeConflict(finals);
  if (!rhymeCheck.hasConflict) {
    score += 10;
  } else if (rhymeCheck.level === 'medium') {
    score -= 3;
  } else {
    score -= 10;
  }
  
  const initialCategories = initials.map(i => INITIAL_CATEGORIES[i] || '其他');
  const uniqueCategories = new Set(initialCategories).size;
  score += Math.min(uniqueCategories * 2, 10);
  
  if (hasBadHomophone) {
    score -= 30;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function analyzePhonetic(
  fullName: string,
  characters: CharacterInfo[]
): PhoneticAnalysis {
  const tones: number[] = [];
  const initials: string[] = [];
  const finals: string[] = [];
  const pinyins: string[] = [];
  
  for (const char of characters) {
    const charTone = char.tone && char.tone.length > 0 ? char.tone[0] : 0;
    const charPinyin = char.pinyin && char.pinyin.length > 0 ? char.pinyin[0] : '';
    
    tones.push(charTone);
    pinyins.push(charPinyin + (charTone > 0 ? charTone : ''));
    
    const { initial, final } = splitPinyin(charPinyin);
    initials.push(initial);
    finals.push(final);
  }
  
  const tonePattern = getTonePattern(tones);
  const isHarmonious = isToneHarmonious(tonePattern);
  const { hasBad, notes } = checkBadHomophone(pinyins);
  const overallScore = calculatePhoneticScore(
    initials, finals, tones, tonePattern, hasBad
  );
  
  return {
    tones,
    tonePattern,
    isHarmonious,
    initials,
    finals,
    hasBadHomophone: hasBad,
    badHomophoneNotes: notes,
    overallScore
  };
}
