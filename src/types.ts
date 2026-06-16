export type TemplateCategory = 'tech' | 'design' | 'function' | 'sample';
export type TemplateCategoryWithBlank = TemplateCategory | 'blank';
export type ModuleType = 'basic' | 'education' | 'experience' | 'project' | 'skills' | 'selfEvaluation' | 'custom';

export interface ResumeTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
}

export interface BasicModuleFields {
  name?: string;
  title?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  location?: string;
  website?: string;
  github?: string;
  portfolio?: string;
  dribbble?: string;
  linkedin?: string;
  avatar?: string;
  links?: string[];
  [key: string]: any;
}

export interface EducationItem {
  id?: string;
  school?: string;
  degree?: string;
  field?: string;
  major?: string;
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
  descriptions?: string[];
  responsibilities?: string[];
  highlights?: string[];
}

export interface ProjectItem {
  id?: string;
  name?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  link?: string;
  portfolioLink?: string;
  description?: string;
  descriptions?: string[];
  highlights?: string[];
  achievements?: string[];
  metrics?: string[];
  technologies?: string[];
  techStack?: string[] | string;
  tools?: string[] | string;
  category?: string;
}

export interface SkillGroup {
  id?: string;
  name?: string;
  category?: string;
  items?: string[];
}

export interface ResumeModule {
  id: string;
  type: ModuleType;
  visible: boolean;
  order: number;
  fields: Record<string, any>;
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

export interface ResumeTemplate {
  id: string;
  name: string;
  category: TemplateCategoryWithBlank;
  description: string;
  theme: ResumeTheme;
  modules: ResumeModule[];
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
  category: TemplateCategoryWithBlank;
  missingKeywords: string[];
  existingKeywords: string[];
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
