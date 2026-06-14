export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: number;
}

export interface BasicInfo {
  name: string;
  phone: string;
  email: string;
  location: string;
  website: string;
  avatar?: string;
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
}

export interface SkillItem {
  id: string;
  category: string;
  items: string[];
}

export interface ResumeContent {
  basicInfo: BasicInfo;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillItem[];
  summary: string;
  templateFeatures?: {
    hasCover?: boolean;
    hasLetter?: boolean;
    hasCharts?: boolean;
  };
  cover?: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
  };
  coverLetter?: {
    recipient?: string;
    position?: string;
    company?: string;
    content?: string;
  };
  skillCharts?: {
    radar?: unknown[];
    bar?: unknown[];
  };
}

export interface Resume {
  id: number;
  user_id: number;
  title: string;
  template_id: string;
  content: ResumeContent;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  industry: string;
  description: string;
  hasCover: boolean;
  hasLetter: boolean;
  hasCharts: boolean;
}

export interface DeliveryRecord {
  id: number;
  resume_id: number;
  user_id: number;
  company: string;
  position: string;
  tracking_code: string;
  qr_code: string;
  created_at: string;
  updated_at?: string;
  status: string;
  resume_title?: string;
}

export interface QualityReport {
  overallScore: number;
  keywordScore: number;
  verbScore: number;
  readabilityScore: number;
  missingKeywords: string[];
  weakVerbs: string[];
  suggestions: string[];
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  [key: string]: any;
}
