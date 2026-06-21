export interface Person {
  id: string;
  name: string;
  avatar: string;
  gender: 'male' | 'female';
  birthYear: number;
  education: string;
  description?: string;
}

export interface Position {
  id: string;
  personId: string;
  companyId: string;
  companyName: string;
  title: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

export interface EquityRelation {
  id: string;
  fromCompanyId: string;
  fromCompanyName: string;
  toCompanyId: string;
  toCompanyName: string;
  shareRatio: number;
  type: 'direct' | 'indirect';
  level: number;
}

export type JudicialRiskType = 'lawsuit' | 'execution' | 'dishonest' | 'freeze';

export interface JudicialRisk {
  id: string;
  companyId: string;
  companyName: string;
  personId?: string;
  personName?: string;
  type: JudicialRiskType;
  amount?: number;
  date: string;
  status: string;
  description: string;
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'company' | 'person' | 'judicial';
  subType?: string;
  category?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  radius?: number;
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  value?: number;
  label?: string;
  level?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
