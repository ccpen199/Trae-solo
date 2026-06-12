export type EmotionCategory = 'purr' | 'meow' | 'hiss' | 'wail' | 'growl' | 'content';

export interface Emotion {
  id: string;
  name: string;
  nameEn: string;
  category: EmotionCategory;
  description: string;
  color: string;
  baseFrequency: number;
  avgDuration: number;
  typicalScenarios: string[];
  suggestions: string[];
}

export interface AudioFeatures {
  rms: number;
  spectralCentroid: number;
  spectralFlatness: number;
  dominantFrequency: number;
  zeroCrossingRate: number;
}

export interface AnalysisResult {
  emotion: Emotion;
  confidence: number;
  emotionScores: Record<EmotionCategory, number>;
  audioFeatures: AudioFeatures;
  duration: number;
  suggestions: string[];
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  type: 'analysis' | 'synthesis';
  timestamp: number;
  emotion: Emotion;
  confidence: number;
  scene: string;
  catReaction?: string;
  notes?: string;
  duration?: number;
  audioFeatures?: AudioFeatures;
}

export interface SynthesisResult {
  audioUrl: string;
  duration: number;
  baseFrequency: number;
  emotion: Emotion;
  expectedReactions: {
    type: string;
    probability: number;
    description: string;
  }[];
  timestamp: number;
}

export interface SynthesisParams {
  text: string;
  emotion: EmotionCategory;
  intensity: number;
  duration: number;
  pitch: number;
}

export interface StatsData {
  totalEntries: number;
  analysisCount: number;
  synthesisCount: number;
  topEmotions: {
    emotion: Emotion;
    count: number;
    percentage: number;
  }[];
  sceneDistribution: {
    scene: string;
    count: number;
    percentage: number;
  }[];
  weeklyTrend: {
    date: string;
    count: number;
  }[];
  avgConfidence: number;
}

export interface KnowledgeRef {
  id: string;
  title: string;
  author: string;
  year: number;
  journal: string;
  abstract: string;
  url?: string;
}

export interface CatPhysiology {
  hearingRange: {
    min: number;
    max: number;
    unit: string;
    description: string;
  };
  vocalOrgans: {
    name: string;
    description: string;
  }[];
  emotionExpressions: {
    emotion: string;
    bodyLanguage: string;
    vocalization: string;
    tailMovement: string;
  }[];
  frequencyRange: {
    min: number;
    max: number;
    unit: string;
    description: string;
  };
}
