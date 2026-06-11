import type { Resume } from './resume';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  structuredData?: Partial<Resume>;
}

export interface AIAnalysisResult {
  verbStrength: {
    score: number;
    weakVerbs: string[];
    suggestions: string[];
  };
  quantification: {
    score: number;
    missingAreas: string[];
    suggestions: string[];
  };
  layout: {
    score: number;
    redundancyAreas: string[];
    suggestions: string[];
  };
  atsCompatibility: {
    score: number;
    issues: string[];
  };
  overallScore: number;
}
