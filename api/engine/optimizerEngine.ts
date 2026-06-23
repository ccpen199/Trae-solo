import type {
  NamingInput,
  BaZiResult,
  CharacterInfo,
  NameProposal,
  NameScore,
  PhoneticAnalysis,
  PoetryReference
} from '../../shared/types.js';

type FiveElement = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

import { analyzePhonetic } from './phoneticEngine.js';

const CHARACTER_FREQUENCY: Record<string, number> = {
  '子': 0.8, '轩': 0.75, '宇': 0.78, '浩': 0.7, '涵': 0.72,
  '思': 0.68, '雨': 0.74, '欣': 0.65, '怡': 0.6, '然': 0.62,
  '晨': 0.58, '睿': 0.45, '嘉': 0.5, '瑞': 0.52, '琪': 0.48,
  '文': 0.85, '明': 0.82, '华': 0.88, '国': 0.76, '德': 0.66,
  '俊': 0.64, '杰': 0.69, '诗': 0.4, '书': 0.55, '画': 0.35,
  '琴': 0.3, '韵': 0.38, '雅': 0.42, '宁': 0.56, '安': 0.63,
  '逸': 0.44, '辰': 0.59, '硕': 0.33, '博': 0.53, '彦': 0.36,
  '霖': 0.41, '泽': 0.57, '楷': 0.32, '旭': 0.51, '昊': 0.34,
  '婧': 0.28, '瑶': 0.46, '婉': 0.37, '婷': 0.54, '媛': 0.39,
  '馨': 0.43, '悦': 0.49, '灵': 0.47, '菲': 0.5, '萱': 0.31
};

const DEFAULT_CHARACTER_DB: CharacterInfo[] = [
  { char: '子', pinyin: ['zi'], tone: [3], kangxiStrokes: 3, simplifiedStrokes: 3, wuXing: 'water', shuoWen: '十一月，阳气动，万物滋，人以为偁。', radical: '子', meanings: ['婴儿', '后代', '小的'], poetryReferences: [], famousNames: ['孔子', '孟子'] },
  { char: '轩', pinyin: ['xuan'], tone: [1], kangxiStrokes: 10, simplifiedStrokes: 7, wuXing: 'earth', shuoWen: '曲輈藩车。', radical: '车', meanings: ['古代一种有围棚的车', '高', '有窗的小屋'], poetryReferences: [], famousNames: ['轩辕'] },
  { char: '宇', pinyin: ['yu'], tone: [3], kangxiStrokes: 6, simplifiedStrokes: 6, wuXing: 'earth', shuoWen: '屋边也。', radical: '宀', meanings: ['屋檐', '空间', '风度'], poetryReferences: [], famousNames: ['宇文'] },
  { char: '浩', pinyin: ['hao'], tone: [4], kangxiStrokes: 11, simplifiedStrokes: 10, wuXing: 'water', shuoWen: '浇也。', radical: '氵', meanings: ['水大', '盛大', '众多'], poetryReferences: [], famousNames: ['孟浩然'] },
  { char: '涵', pinyin: ['han'], tone: [2], kangxiStrokes: 12, simplifiedStrokes: 11, wuXing: 'water', shuoWen: '水泽多也。', radical: '氵', meanings: ['包容', '浸润', '涵养'], poetryReferences: [], famousNames: ['汪涵'] },
  { char: '思', pinyin: ['si'], tone: [1], kangxiStrokes: 9, simplifiedStrokes: 9, wuXing: 'metal', shuoWen: '容也。', radical: '心', meanings: ['思考', '想念', '思绪'], poetryReferences: [], famousNames: ['司空图'] },
  { char: '雨', pinyin: ['yu'], tone: [3], kangxiStrokes: 8, simplifiedStrokes: 8, wuXing: 'water', shuoWen: '水从云下也。', radical: '雨', meanings: ['雨水', '降落'], poetryReferences: [], famousNames: ['张雨'] },
  { char: '欣', pinyin: ['xin'], tone: [1], kangxiStrokes: 8, simplifiedStrokes: 8, wuXing: 'wood', shuoWen: '笑喜也。', radical: '欠', meanings: ['喜悦', '高兴', '茂盛'], poetryReferences: [], famousNames: ['陶渊明'] },
  { char: '怡', pinyin: ['yi'], tone: [2], kangxiStrokes: 9, simplifiedStrokes: 8, wuXing: 'earth', shuoWen: '和也。', radical: '忄', meanings: ['愉快', '和悦'], poetryReferences: [], famousNames: ['章怡'] },
  { char: '然', pinyin: ['ran'], tone: [2], kangxiStrokes: 12, simplifiedStrokes: 12, wuXing: 'metal', shuoWen: '烧也。', radical: '灬', meanings: ['这样', '对', '形容词后缀'], poetryReferences: [], famousNames: ['孟浩然'] },
  { char: '晨', pinyin: ['chen'], tone: [2], kangxiStrokes: 11, simplifiedStrokes: 11, wuXing: 'metal', shuoWen: '早昧爽也。', radical: '日', meanings: ['早晨', '天亮'], poetryReferences: [], famousNames: ['晨光'] },
  { char: '睿', pinyin: ['rui'], tone: [4], kangxiStrokes: 14, simplifiedStrokes: 14, wuXing: 'metal', shuoWen: '深明也，通也。', radical: '目', meanings: ['明智', '深远', '通达'], poetryReferences: [], famousNames: ['睿智'] },
  { char: '嘉', pinyin: ['jia'], tone: [1], kangxiStrokes: 14, simplifiedStrokes: 14, wuXing: 'wood', shuoWen: '美也。', radical: '口', meanings: ['美好', '赞美', '嘉奖'], poetryReferences: [], famousNames: ['郭嘉'] },
  { char: '瑞', pinyin: ['rui'], tone: [4], kangxiStrokes: 14, simplifiedStrokes: 13, wuXing: 'metal', shuoWen: '以玉为信也。', radical: '王', meanings: ['吉祥', '好兆头'], poetryReferences: [], famousNames: ['祥瑞'] },
  { char: '琪', pinyin: ['qi'], tone: [2], kangxiStrokes: 13, simplifiedStrokes: 12, wuXing: 'wood', shuoWen: '玉属也。', radical: '王', meanings: ['美玉', '珍贵'], poetryReferences: [], famousNames: ['安琪'] },
  { char: '文', pinyin: ['wen'], tone: [2], kangxiStrokes: 4, simplifiedStrokes: 4, wuXing: 'water', shuoWen: '错画也。', radical: '文', meanings: ['文字', '文化', '文采'], poetryReferences: [], famousNames: ['司马迁'] },
  { char: '明', pinyin: ['ming'], tone: [2], kangxiStrokes: 8, simplifiedStrokes: 8, wuXing: 'water', shuoWen: '照也。', radical: '日', meanings: ['明亮', '清楚', '智慧'], poetryReferences: [], famousNames: ['诸葛亮'] },
  { char: '华', pinyin: ['hua'], tone: [2], kangxiStrokes: 14, simplifiedStrokes: 6, wuXing: 'water', shuoWen: '荣也。', radical: '十', meanings: ['花朵', '华丽', '中华'], poetryReferences: [], famousNames: ['华佗'] },
  { char: '俊', pinyin: ['jun'], tone: [4], kangxiStrokes: 9, simplifiedStrokes: 9, wuXing: 'fire', shuoWen: '材千人也。', radical: '亻', meanings: ['才智出众', '美丽'], poetryReferences: [], famousNames: ['俊杰'] },
  { char: '杰', pinyin: ['jie'], tone: [2], kangxiStrokes: 12, simplifiedStrokes: 8, wuXing: 'wood', shuoWen: '傲也。', radical: '木', meanings: ['才能出众', '特异'], poetryReferences: [], famousNames: ['张杰'] },
  { char: '诗', pinyin: ['shi'], tone: [1], kangxiStrokes: 13, simplifiedStrokes: 8, wuXing: 'metal', shuoWen: '志也。', radical: '讠', meanings: ['诗歌', '文学'], poetryReferences: [], famousNames: ['李诗'] },
  { char: '书', pinyin: ['shu'], tone: [1], kangxiStrokes: 10, simplifiedStrokes: 4, wuXing: 'metal', shuoWen: '箸也。', radical: '乙', meanings: ['书写', '书籍', '书法'], poetryReferences: [], famousNames: ['王羲之'] },
  { char: '雅', pinyin: ['ya'], tone: [3], kangxiStrokes: 12, simplifiedStrokes: 12, wuXing: 'wood', shuoWen: '楚乌也。', radical: '隹', meanings: ['高雅', '文雅', '美好'], poetryReferences: [], famousNames: ['雅琴'] },
  { char: '宁', pinyin: ['ning'], tone: [2], kangxiStrokes: 14, simplifiedStrokes: 5, wuXing: 'fire', shuoWen: '愿词也。', radical: '宀', meanings: ['安宁', '平静'], poetryReferences: [], famousNames: ['宁静'] },
  { char: '安', pinyin: ['an'], tone: [1], kangxiStrokes: 6, simplifiedStrokes: 6, wuXing: 'earth', shuoWen: '静也。', radical: '宀', meanings: ['安定', '平安'], poetryReferences: [], famousNames: ['王安石'] },
  { char: '逸', pinyin: ['yi'], tone: [4], kangxiStrokes: 15, simplifiedStrokes: 11, wuXing: 'earth', shuoWen: '失也。', radical: '辶', meanings: ['安逸', '飘逸', '隐逸'], poetryReferences: [], famousNames: ['周逸'] },
  { char: '辰', pinyin: ['chen'], tone: [2], kangxiStrokes: 7, simplifiedStrokes: 7, wuXing: 'earth', shuoWen: '震也。', radical: '辰', meanings: ['星辰', '时刻', '好日子'], poetryReferences: [], famousNames: ['生辰'] },
  { char: '博', pinyin: ['bo'], tone: [2], kangxiStrokes: 12, simplifiedStrokes: 12, wuXing: 'water', shuoWen: '大通也。', radical: '十', meanings: ['广博', '众多', '渊博'], poetryReferences: [], famousNames: ['博学'] },
  { char: '泽', pinyin: ['ze'], tone: [2], kangxiStrokes: 17, simplifiedStrokes: 8, wuXing: 'water', shuoWen: '光润也。', radical: '氵', meanings: ['恩泽', '光泽', '沼泽'], poetryReferences: [], famousNames: ['毛泽东'] },
  { char: '旭', pinyin: ['xu'], tone: [4], kangxiStrokes: 6, simplifiedStrokes: 6, wuXing: 'wood', shuoWen: '日旦出貌。', radical: '日', meanings: ['日出', '光明'], poetryReferences: [], famousNames: ['旭日'] }
];

function generateId(): string {
  return 'name-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function getElementName(element: FiveElement): string {
  const names: Record<FiveElement, string> = {
    metal: '金', wood: '木', water: '水', fire: '火', earth: '土'
  };
  return names[element];
}

function parseElementName(name: string): FiveElement | null {
  const map: Record<string, FiveElement> = {
    '金': 'metal', '木': 'wood', '水': 'water', '火': 'fire', '土': 'earth'
  };
  return map[name] || null;
}

function generateCandidates(
  input: NamingInput,
  characterDB: CharacterInfo[]
): CharacterInfo[][] {
  const db = characterDB.length > 0 ? characterDB : DEFAULT_CHARACTER_DB;
  const results: CharacterInfo[][] = [];
  const forbidden = new Set(input.forbiddenCharacters);
  forbidden.add(input.surname);
  if (input.secondSurname) forbidden.add(input.secondSurname);
  
  let filteredDB = db.filter(c => !forbidden.has(c.char));
  
  if (input.style.includes('poetic') || input.style.includes('scholarly')) {
    filteredDB = filteredDB.filter(c => 
      c.poetryReferences.length > 0 || 
      ['诗', '书', '文', '雅', '琪', '睿', '彦'].includes(c.char)
    );
  }
  
  if (input.style.includes('grand')) {
    filteredDB = filteredDB.filter(c => 
      ['宇', '浩', '轩', '辰', '博', '泽', '昊', '硕', '华', '明'].includes(c.char) ||
      c.meanings.some(m => m.includes('大') || m.includes('广') || m.includes('盛'))
    );
  }
  
  if (input.style.includes('agile')) {
    filteredDB = filteredDB.filter(c => 
      c.simplifiedStrokes <= 10 &&
      ['子', '悦', '灵', '然', '欣', '雨', '思', '逸'].includes(c.char)
    );
  }
  
  if (input.style.includes('modern')) {
    filteredDB = filteredDB.filter(c => c.simplifiedStrokes <= 12);
  }
  
  if (input.gender === 'male') {
    filteredDB = filteredDB.filter(c => 
      !['婷', '媛', '婉', '婧', '瑶', '馨', '菲', '萱'].includes(c.char) ||
      input.style.includes('poetic')
    );
  } else if (input.gender === 'female') {
    filteredDB = filteredDB.filter(c => 
      !['浩', '博', '硕', '杰', '俊', '昊'].includes(c.char) ||
      input.style.includes('grand')
    );
  }
  
  const wantDouble = input.nameLength === 'double' || input.nameLength === 'both';
  const wantSingle = input.nameLength === 'single' || input.nameLength === 'both';
  
  if (wantSingle && !input.generationCharacter) {
    for (const char of filteredDB) {
      results.push([char]);
    }
  }
  
  if (wantDouble) {
    if (input.generationCharacter) {
      const genChar = filteredDB.find(c => c.char === input.generationCharacter);
      if (genChar) {
        for (const char of filteredDB) {
          if (char.char !== input.generationCharacter) {
            results.push([genChar, char]);
          }
        }
        for (const char of filteredDB) {
          if (char.char !== input.generationCharacter) {
            results.push([char, genChar]);
          }
        }
      } else {
        const genInfo: CharacterInfo = {
          char: input.generationCharacter,
          pinyin: [''],
          tone: [0],
          kangxiStrokes: 0,
          simplifiedStrokes: 0,
          wuXing: 'earth',
          shuoWen: '',
          radical: '',
          meanings: [],
          poetryReferences: [],
          famousNames: []
        };
        for (const char of filteredDB) {
          results.push([genInfo, char]);
        }
        for (const char of filteredDB) {
          results.push([char, genInfo]);
        }
      }
    } else {
      for (let i = 0; i < filteredDB.length; i++) {
        for (let j = 0; j < filteredDB.length; j++) {
          if (i !== j) {
            results.push([filteredDB[i], filteredDB[j]]);
          }
        }
      }
    }
  }
  
  return results.slice(0, 500);
}

function calculateAuspiciousnessScore(
  characters: CharacterInfo[],
  bazi: BaZiResult,
  input: NamingInput
): { score: number; matchScore: number; note: string } {
  const favorableElements = bazi.favorableElements.map(e => parseElementName(e)).filter(Boolean) as FiveElement[];
  const avoidElements = bazi.avoidElements.map(e => parseElementName(e)).filter(Boolean) as FiveElement[];
  
  let favorableCount = 0;
  let avoidCount = 0;
  const charElements: string[] = [];
  
  for (const char of characters) {
    charElements.push(getElementName(char.wuXing));
    if (favorableElements.includes(char.wuXing)) {
      favorableCount++;
    }
    if (avoidElements.includes(char.wuXing)) {
      avoidCount++;
    }
  }
  
  let score = 60;
  
  const favorableRatio = favorableCount / characters.length;
  score += favorableRatio * 30;
  
  const avoidRatio = avoidCount / characters.length;
  score -= avoidRatio * 25;
  
  const pref = input.fiveElementsPreference;
  let prefScore = 0;
  for (const char of characters) {
    prefScore += pref[char.wuXing] || 0;
  }
  prefScore = prefScore / characters.length;
  score += prefScore * 0.15;
  
  const uniqueElements = new Set(characters.map(c => c.wuXing)).size;
  score += Math.min(uniqueElements * 3, 9);
  
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  const matchScore = Math.round(favorableRatio * 100);
  
  let note = '';
  if (favorableCount > 0) {
    const favorableNames = bazi.favorableElements.filter((_, i) => 
      characters.some(c => favorableElements[i] && c.wuXing === favorableElements[i])
    );
    note = `名字五行含${favorableNames.join('、')}，补益命局`;
  } else if (avoidCount > 0) {
    note = '名字五行与命局喜用神略有偏差';
  } else {
    note = '名字五行均衡，配合命局';
  }
  
  if (avoidCount > 0) {
    const avoidNames = bazi.avoidElements.filter((_, i) => 
      characters.some(c => avoidElements[i] && c.wuXing === avoidElements[i])
    );
    note += avoidNames.length > 0 ? `，需注意${avoidNames.join('、')}偏旺` : '';
  }
  
  return { score, matchScore, note };
}

function calculateUniquenessScore(
  characters: CharacterInfo[],
  surname: string
): number {
  let score = 50;
  
  let totalFreq = 0;
  for (const char of characters) {
    const freq = CHARACTER_FREQUENCY[char.char] ?? 0.5;
    totalFreq += freq;
  }
  const avgFreq = totalFreq / characters.length;
  score += (1 - avgFreq) * 35;
  
  const uniqueChars = new Set([surname, ...characters.map(c => c.char)]);
  if (uniqueChars.size === characters.length + 1) {
    score += 5;
  }
  
  const unusualRadicals = characters.filter(c => 
    ['王', '玉', '金', '钅', '月'].includes(c.radical) && 
    !['明', '宇', '浩', '涵', '轩'].includes(c.char)
  ).length;
  score += Math.min(unusualRadicals * 3, 10);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateWritingEaseScore(characters: CharacterInfo[]): number {
  let score = 60;
  
  const totalStrokes = characters.reduce((sum, c) => sum + c.simplifiedStrokes, 0);
  const avgStrokes = totalStrokes / characters.length;
  
  if (avgStrokes >= 6 && avgStrokes <= 12) {
    score += 20;
  } else if (avgStrokes >= 4 && avgStrokes <= 15) {
    score += 10;
  } else {
    score -= 10;
  }
  
  const strokeVariance = characters.reduce((sum, c) => 
    sum + Math.abs(c.simplifiedStrokes - avgStrokes), 0
  ) / characters.length;
  
  if (strokeVariance <= 3) {
    score += 10;
  } else if (strokeVariance <= 5) {
    score += 5;
  }
  
  const simpleCount = characters.filter(c => c.simplifiedStrokes <= 10).length;
  score += Math.min(simpleCount * 3, 10);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateDuplicateRate(fullName: string): { total: number; province: number; ageDistribution: Record<string, number> } {
  const base = fullName.charCodeAt(0) * 17 + fullName.length * 31;
  const total = Math.floor((base % 5000) + 500);
  const province = Math.floor(total * (0.1 + Math.random() * 0.15));
  
  return {
    total,
    province,
    ageDistribution: {
      '0-10': Math.floor(total * 0.35),
      '11-20': Math.floor(total * 0.25),
      '21-30': Math.floor(total * 0.2),
      '31-40': Math.floor(total * 0.12),
      '41+': Math.floor(total * 0.08)
    }
  };
}

function generateMeaning(
  fullName: string,
  characters: CharacterInfo[],
  surname: string
): string {
  const meanings: string[] = [];
  
  for (let i = 0; i < characters.length; i++) {
    const c = characters[i];
    if (c.meanings && c.meanings.length > 0) {
      const primaryMeaning = c.meanings[0];
      meanings.push(`「${c.char}」取${primaryMeaning}之意`);
    }
  }
  
  const styleNotes: string[] = [];
  if (characters.some(c => c.poetryReferences.length > 0)) {
    styleNotes.push('有诗词典故');
  }
  if (meanings.join('').includes('文') || meanings.join('').includes('诗')) {
    styleNotes.push('文雅大气');
  }
  if (characters.some(c => ['宇', '浩', '博', '泽', '轩'].includes(c.char))) {
    styleNotes.push('气度不凡');
  }
  if (characters.some(c => ['欣', '怡', '悦', '宁', '安'].includes(c.char))) {
    styleNotes.push('祥和美好');
  }
  
  let result = `${surname}${characters.map(c => c.char).join('')}，`;
  result += meanings.join('，') + '。';
  if (styleNotes.length > 0) {
    result += `整体${styleNotes.join('，')}。`;
  }
  
  return result;
}

function generateTags(
  characters: CharacterInfo[],
  bazi: BaZiResult,
  phonetic: PhoneticAnalysis,
  input: NamingInput
): string[] {
  const tags: string[] = [];
  
  if (phonetic.isHarmonious) tags.push('音律和谐');
  if (phonetic.hasBadHomophone) tags.push('需注意谐音');
  
  const favorableElements = bazi.favorableElements.map(e => parseElementName(e)).filter(Boolean) as FiveElement[];
  const hasFavorable = characters.some(c => favorableElements.includes(c.wuXing));
  if (hasFavorable) tags.push('五行补益');
  
  if (input.style.includes('poetic')) tags.push('诗意');
  if (input.style.includes('classic')) tags.push('经典');
  if (input.style.includes('modern')) tags.push('现代');
  if (input.style.includes('grand')) tags.push('大气');
  if (input.style.includes('scholarly')) tags.push('儒雅');
  if (input.style.includes('agile')) tags.push('灵动');
  
  const avgStrokes = characters.reduce((s, c) => s + c.simplifiedStrokes, 0) / characters.length;
  if (avgStrokes <= 8) tags.push('易书写');
  
  if (characters.some(c => c.poetryReferences.length > 0)) tags.push('有典故');
  
  return tags.slice(0, 5);
}

function getPinyinString(characters: CharacterInfo[], surname: string): string {
  const surnameInfo = DEFAULT_CHARACTER_DB.find(c => c.char === surname);
  const surnamePinyin = surnameInfo?.pinyin?.[0] || surname;
  const charsPinyin = characters.map(c => c.pinyin?.[0] || c.char).join(' ');
  return surnamePinyin + (charsPinyin ? ' ' + charsPinyin : '');
}

function getFullName(characters: CharacterInfo[], surname: string, secondSurname?: string): string {
  return (secondSurname || '') + surname + characters.map(c => c.char).join('');
}

export function generateNameProposals(
  input: NamingInput,
  bazi: BaZiResult,
  characterDB: CharacterInfo[]
): NameProposal[] {
  const candidates = generateCandidates(input, characterDB);
  const proposals: NameProposal[] = [];
  
  for (const candidate of candidates) {
    const fullName = getFullName(candidate, input.surname, input.secondSurname);
    const fullCharacters = [
      ...(input.secondSurname ? [{
        char: input.secondSurname,
        pinyin: [''],
        tone: [0],
        kangxiStrokes: 0,
        simplifiedStrokes: 0,
        wuXing: 'earth' as FiveElement,
        shuoWen: '',
        radical: '',
        meanings: [],
        poetryReferences: [] as PoetryReference[],
        famousNames: []
      }] : []),
      {
        char: input.surname,
        pinyin: [''],
        tone: [0],
        kangxiStrokes: 0,
        simplifiedStrokes: 0,
        wuXing: 'earth' as FiveElement,
        shuoWen: '',
        radical: '',
        meanings: [],
        poetryReferences: [] as PoetryReference[],
        famousNames: []
      },
      ...candidate
    ];
    
    const phoneticAnalysis = analyzePhonetic(fullName, fullCharacters);
    const auspiciousness = calculateAuspiciousnessScore(candidate, bazi, input);
    const uniqueness = calculateUniquenessScore(candidate, input.surname);
    const writingEase = calculateWritingEaseScore(candidate);
    
    const overall = Math.round(
      auspiciousness.score * 0.35 +
      uniqueness * 0.2 +
      writingEase * 0.15 +
      phoneticAnalysis.overallScore * 0.3
    );
    
    const score: NameScore = {
      overall,
      auspiciousness: auspiciousness.score,
      uniqueness,
      writingEase,
      phoneticHarmony: phoneticAnalysis.overallScore
    };
    
    const meaning = generateMeaning(fullName, candidate, input.surname);
    const duplicateRate = generateDuplicateRate(fullName);
    const tags = generateTags(candidate, bazi, phoneticAnalysis, input);
    const poetryReferences = candidate.flatMap(c => c.poetryReferences || []);
    
    const proposal: NameProposal = {
      id: generateId(),
      fullName,
      pinyin: getPinyinString(candidate, input.surname),
      characters: candidate,
      meaning,
      score,
      fiveElementsMatch: auspiciousness.matchScore,
      fiveElementsNote: auspiciousness.note,
      phoneticAnalysis,
      duplicateRate,
      poetryReferences,
      tags
    };
    
    if (!phoneticAnalysis.hasBadHomophone) {
      proposals.push(proposal);
    }
  }
  
  proposals.sort((a, b) => b.score.overall - a.score.overall);
  
  return proposals.slice(0, 20);
}
