export type ModuleType = 'basic' | 'education' | 'experience' | 'project' | 'skills' | 'selfEvaluation' | 'custom';
export type TemplateCategory = 'tech' | 'design' | 'function';

export interface ResumeTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
}

export interface ResumeModule {
  id: string;
  type: ModuleType;
  visible: boolean;
  order: number;
  fields: Record<string, any>;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  theme: ResumeTheme;
  modules: ResumeModule[];
}

export interface EducationItem {
  id?: string;
  school?: string;
  major?: string;
  field?: string;
  degree?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  description?: string;
}

export interface ExperienceItem {
  id?: string;
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  description?: string;
  highlights?: string[];
  responsibilities?: string[];
}

export interface ProjectItem {
  id?: string;
  name?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  highlights?: string[];
  techStack?: string[];
  technologies?: string[];
  link?: string;
  metrics?: string[];
  achievements?: string[];
}

export interface SkillGroup {
  id?: string;
  name?: string;
  category?: string;
  items?: string[];
}

export interface Resume {
  id: string;
  title: string;
  templateId: string;
  theme: ResumeTheme;
  modules: ResumeModule[];
  createdAt: number;
  updatedAt: number;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  summary?: string;
  fontFamily?: string;
  basicInfo?: Record<string, any>;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  projects?: ProjectItem[];
  skills?: string[];
}

export interface EmptyPhraseIssue {
  text: string;
  location: string;
  suggestion: string;
  strongVerb: string;
  starTemplate: string;
}

export interface TimelineConflict {
  type: 'invalid' | 'overlap';
  location: string;
  startDate: string;
  endDate: string;
  message: string;
}

export interface MissingKeywordIssue {
  category: TemplateCategory;
  existingKeywords: string[];
  missingKeywords: string[];
}

export interface DiagnosisResult {
  score: number;
  emptyPhraseIssues: EmptyPhraseIssue[];
  timelineConflicts: TimelineConflict[];
  missingKeywordIssues: MissingKeywordIssue;
  suggestions: string[];
}

export interface FontSafetyIssue {
  font: string;
  isSafe: boolean;
  safeAlternatives: string[];
}

export interface TableStructureIssue {
  location: string;
  issue: string;
  suggestion: string;
}

export interface LinkValidityIssue {
  url: string;
  isValid: boolean;
  message: string;
}

export interface KeywordDensityResult {
  keyword: string;
  count: number;
  density: number;
  isOptimal: boolean;
  suggestion: string;
}

export interface AtsCheckResult {
  score: number;
  fontSafety: FontSafetyIssue;
  tableStructure: TableStructureIssue[];
  linkValidity: LinkValidityIssue[];
  keywordDensity: KeywordDensityResult[];
  suggestions: string[];
}

export interface AppSettings {
  privacyMode: boolean;
  encryptionKey: string;
  theme: string;
}
