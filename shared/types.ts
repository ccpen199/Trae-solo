export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  role: 'user' | 'member' | 'master' | 'admin';
  membershipExpireAt?: string;
  createdAt: string;
}

export interface NamingInput {
  birthDateTime: string;
  isLunarCalendar: boolean;
  birthPlace: { province: string; city: string; longitude: number; latitude: number };
  surname: string;
  secondSurname?: string;
  generationCharacter?: string;
  gender: 'male' | 'female' | 'neutral';
  fiveElementsPreference: {
    metal: number;
    wood: number;
    water: number;
    fire: number;
    earth: number;
  };
  forbiddenCharacters: string[];
  style: ('classic' | 'modern' | 'poetic' | 'grand' | 'scholarly' | 'agile')[];
  nameLength: 'single' | 'double' | 'both';
}

export interface BaZiResult {
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourGanZhi: string;
  yearNaYin: string;
  monthNaYin: string;
  dayNaYin: string;
  hourNaYin: string;
  fiveElementsScore: { metal: number; wood: number; water: number; fire: number; earth: number };
  dayMaster: string;
  dayMasterStrength: 'strong' | 'weak' | 'balanced';
  favorableElements: string[];
  avoidElements: string[];
  trueSolarTime: string;
}

export interface PoetryReference {
  title: string;
  author: string;
  dynasty: string;
  sentence: string;
  translation: string;
  source: string;
}

export interface CharacterInfo {
  char: string;
  pinyin: string[];
  tone: number[];
  kangxiStrokes: number;
  simplifiedStrokes: number;
  wuXing: 'metal' | 'wood' | 'water' | 'fire' | 'earth';
  shuoWen: string;
  radical: string;
  meanings: string[];
  poetryReferences: PoetryReference[];
  famousNames: string[];
}

export interface PhoneticAnalysis {
  tones: number[];
  tonePattern: string;
  isHarmonious: boolean;
  initials: string[];
  finals: string[];
  hasBadHomophone: boolean;
  badHomophoneNotes: string[];
  overallScore: number;
}

export interface NameScore {
  overall: number;
  auspiciousness: number;
  uniqueness: number;
  writingEase: number;
  phoneticHarmony: number;
}

export interface NameProposal {
  id: string;
  fullName: string;
  pinyin: string;
  characters: CharacterInfo[];
  meaning: string;
  score: NameScore;
  fiveElementsMatch: number;
  fiveElementsNote: string;
  phoneticAnalysis: PhoneticAnalysis;
  duplicateRate: { total: number; province: number; ageDistribution: Record<string, number> };
  poetryReferences: PoetryReference[];
  tags: string[];
}

export interface Master {
  id: string;
  name: string;
  avatar: string;
  title: string;
  specialties: string[];
  experience: number;
  introduction: string;
  certificates: string[];
  caseCount: number;
  rating: number;
  reviewCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
}

export interface CaseStudy {
  id: string;
  name: string;
  babyInfo: { gender: string; birthDate: string };
  inputSummary: string;
  baziSummary: string;
  alternatives: string[];
  finalName: string;
  explanation: string;
  masterId?: string;
  masterName?: string;
  isAuthorized: boolean;
  likes: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
