export interface ResumeTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  fontSize: number;
  lineHeight: number;
  sectionSpacing: number;
}

export interface STARRewrite {
  original: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface ResumeItem {
  id: string;
  fields: Record<string, string | string[]>;
  starRewrite?: STARRewrite;
}

export interface ResumeSection {
  id: string;
  type: 'education' | 'experience' | 'project' | 'skill' | 'summary' | 'custom';
  title: string;
  order: number;
  collapsed: boolean;
  items: ResumeItem[];
}

export interface ResumeVersion {
  id: string;
  snapshot: Resume;
  label: string;
  createdAt: string;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  theme: ResumeTheme;
  sections: ResumeSection[];
  versions: ResumeVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
  theme: Partial<ResumeTheme>;
}

export interface ThemePreset {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}
