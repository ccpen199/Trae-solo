import type { Emotion, AudioFeatures, AnalysisResult, EmotionCategory } from '../types';

interface EmotionProfile {
  category: EmotionCategory;
  baseFrequency: number;
  frequencyWeight: number;
  rmsRange: { min: number; max: number };
  rmsWeight: number;
  zcrRange: { min: number; max: number };
  zcrWeight: number;
  spectralFlatnessRange: { min: number; max: number };
  spectralFlatnessWeight: number;
}

export class EmotionClassifier {
  private emotions: Emotion[];
  private emotionProfiles: Map<EmotionCategory, EmotionProfile>;

  constructor(emotions: Emotion[]) {
    this.emotions = emotions;
    this.emotionProfiles = this.buildProfiles(emotions);
  }

  classify(features: AudioFeatures): AnalysisResult {
    const scores: Record<EmotionCategory, number> = {
      purr: 0,
      meow: 0,
      hiss: 0,
      wail: 0,
      growl: 0,
      content: 0,
    };

    for (const [category, profile] of this.emotionProfiles) {
      scores[category] = this.calculateSimilarity(features, profile);
    }

    const sortedCategories = Object.entries(scores)
      .sort((a, b) => b[1] - a[1]) as [EmotionCategory, number][];

    const [topCategory, topConfidence] = sortedCategories[0];
    const topEmotion = this.emotions.find(e => e.category === topCategory)!;

    const suggestions = this.generateSuggestions(features, sortedCategories);

    return {
      emotion: topEmotion,
      confidence: topConfidence,
      emotionScores: scores,
      audioFeatures: features,
      duration: 0,
      suggestions,
      timestamp: Date.now(),
    };
  }

  calculateSimilarity(features: AudioFeatures, emotionProfile: EmotionProfile): number {
    const freqScore = this.calculateFrequencyScore(features.dominantFrequency, emotionProfile);
    const rmsScore = this.calculateRangeScore(features.rms, emotionProfile.rmsRange, emotionProfile.rmsWeight);
    const zcrScore = this.calculateRangeScore(features.zeroCrossingRate, emotionProfile.zcrRange, emotionProfile.zcrWeight);
    const flatnessScore = this.calculateRangeScore(features.spectralFlatness, emotionProfile.spectralFlatnessRange, emotionProfile.spectralFlatnessWeight);

    const totalWeight = emotionProfile.frequencyWeight + emotionProfile.rmsWeight + emotionProfile.zcrWeight + emotionProfile.spectralFlatnessWeight;

    const weightedScore = (
      freqScore * emotionProfile.frequencyWeight +
      rmsScore * emotionProfile.rmsWeight +
      zcrScore * emotionProfile.zcrWeight +
      flatnessScore * emotionProfile.spectralFlatnessWeight
    ) / totalWeight;

    return Math.max(0, Math.min(1, weightedScore));
  }

  getEmotionScores(features: AudioFeatures): { emotion: Emotion; score: number }[] {
    const scores: { emotion: Emotion; score: number }[] = [];

    for (const emotion of this.emotions) {
      const profile = this.emotionProfiles.get(emotion.category);
      if (profile) {
        const score = this.calculateSimilarity(features, profile);
        scores.push({ emotion, score });
      }
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  private buildProfiles(emotions: Emotion[]): Map<EmotionCategory, EmotionProfile> {
    const profiles = new Map<EmotionCategory, EmotionProfile>();

    const baseProfiles: Record<EmotionCategory, Omit<EmotionProfile, 'baseFrequency' | 'category'>> = {
      purr: {
        frequencyWeight: 0.35,
        rmsRange: { min: 0.05, max: 0.2 },
        rmsWeight: 0.25,
        zcrRange: { min: 0.005, max: 0.05 },
        zcrWeight: 0.2,
        spectralFlatnessRange: { min: 0.3, max: 0.7 },
        spectralFlatnessWeight: 0.2,
      },
      meow: {
        frequencyWeight: 0.3,
        rmsRange: { min: 0.1, max: 0.4 },
        rmsWeight: 0.25,
        zcrRange: { min: 0.05, max: 0.15 },
        zcrWeight: 0.25,
        spectralFlatnessRange: { min: 0.1, max: 0.4 },
        spectralFlatnessWeight: 0.2,
      },
      hiss: {
        frequencyWeight: 0.25,
        rmsRange: { min: 0.15, max: 0.5 },
        rmsWeight: 0.2,
        zcrRange: { min: 0.15, max: 0.4 },
        zcrWeight: 0.3,
        spectralFlatnessRange: { min: 0.4, max: 0.8 },
        spectralFlatnessWeight: 0.25,
      },
      wail: {
        frequencyWeight: 0.3,
        rmsRange: { min: 0.2, max: 0.5 },
        rmsWeight: 0.25,
        zcrRange: { min: 0.08, max: 0.2 },
        zcrWeight: 0.25,
        spectralFlatnessRange: { min: 0.1, max: 0.35 },
        spectralFlatnessWeight: 0.2,
      },
      growl: {
        frequencyWeight: 0.35,
        rmsRange: { min: 0.2, max: 0.6 },
        rmsWeight: 0.25,
        zcrRange: { min: 0.02, max: 0.08 },
        zcrWeight: 0.2,
        spectralFlatnessRange: { min: 0.2, max: 0.5 },
        spectralFlatnessWeight: 0.2,
      },
      content: {
        frequencyWeight: 0.3,
        rmsRange: { min: 0.02, max: 0.15 },
        rmsWeight: 0.25,
        zcrRange: { min: 0.03, max: 0.1 },
        zcrWeight: 0.25,
        spectralFlatnessRange: { min: 0.15, max: 0.45 },
        spectralFlatnessWeight: 0.2,
      },
    };

    for (const emotion of emotions) {
      const base = baseProfiles[emotion.category];
      if (base) {
        profiles.set(emotion.category, {
          category: emotion.category,
          baseFrequency: emotion.baseFrequency,
          ...base,
        });
      }
    }

    return profiles;
  }

  private calculateFrequencyScore(dominantFreq: number, profile: EmotionProfile): number {
    const targetFreq = profile.baseFrequency;
    const ratio = dominantFreq / targetFreq;

    if (ratio <= 0) return 0;

    const logRatio = Math.log2(Math.max(ratio, 0.01));
    const score = Math.exp(-Math.abs(logRatio) * 1.5);

    return score;
  }

  private calculateRangeScore(
    value: number,
    range: { min: number; max: number },
    weight: number
  ): number {
    if (value >= range.min && value <= range.max) {
      const mid = (range.min + range.max) / 2;
      const halfRange = (range.max - range.min) / 2;
      const distFromMid = Math.abs(value - mid);
      return 1 - (distFromMid / halfRange) * 0.3;
    }

    const rangeSize = range.max - range.min;
    if (value < range.min) {
      const diff = range.min - value;
      return Math.max(0, 1 - diff / (rangeSize * 0.5));
    } else {
      const diff = value - range.max;
      return Math.max(0, 1 - diff / (rangeSize * 0.5));
    }
  }

  private generateSuggestions(
    features: AudioFeatures,
    sortedCategories: [EmotionCategory, number][]
  ): string[] {
    const suggestions: string[] = [];
    const [topCategory, topConfidence] = sortedCategories[0];
    const topEmotion = this.emotions.find(e => e.category === topCategory)!;

    if (topConfidence < 0.5) {
      suggestions.push('音频特征不明显，建议录制更长时间的声音样本');
    }

    suggestions.push(...topEmotion.suggestions.slice(0, 2));

    if (features.rms < 0.05) {
      suggestions.push('音量较低，请确保麦克风靠近声源');
    } else if (features.rms > 0.8) {
      suggestions.push('音量较高，可能存在环境噪音干扰');
    }

    return suggestions.slice(0, 4);
  }
}
