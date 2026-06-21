export type CalculatorType = 'court_fee' | 'injury' | 'interest' | 'penalty' | 'lawyer_fee' | 'delay' | 'tax';

export interface CalculatorMeta {
  type: CalculatorType;
  name: string;
  description: string;
  icon: string;
  legalBasis: string[];
}

export interface CalculatorField {
  name: string;
  label: string;
  type: 'number' | 'select' | 'date' | 'text';
  required: boolean;
  options?: { label: string; value: any }[];
  placeholder?: string;
  unit?: string;
}

export interface CalculatorConfig {
  type: CalculatorType;
  fields: CalculatorField[];
}

export interface CalculatorResult {
  type: CalculatorType;
  inputs: Record<string, any>;
  result: {
    total: number;
    breakdown: { label: string; amount: number }[];
    formula: string;
    legalBasis: string[];
  };
}

export interface LawCitation {
  law: string;
  article: string;
  content: string;
}

export interface RelatedCase {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  date: string;
  similarity: number;
  summary: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: LawCitation[];
  relatedCases?: RelatedCase[];
  timestamp: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fileType: 'docx' | 'pdf';
  fileSize: number;
  downloadCount: number;
  createdAt: string;
}
