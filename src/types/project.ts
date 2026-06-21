export type ProjectType = 'residential' | 'commercial' | 'industrial' | 'mixed';
export type StageType = 'land-acquisition' | 'construction' | 'sales' | 'delivery';
export type StageStatus = 'not-started' | 'in-progress' | 'completed';

export interface ProjectStage {
  type: StageType;
  status: StageStatus;
  startDate?: string;
  endDate?: string;
  progress?: number;
  data?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  region: string;
  city: string;
  district: string;
  address: string;
  totalArea: number;
  buildingArea: number;
  landCost: number;
  type: ProjectType;
  stages: ProjectStage[];
  lng?: number;
  lat?: number;
  totalInvestment?: number;
  buildingCount?: number;
  houseCount?: number;
  avgPrice?: number;
}

export interface ProjectFilter {
  region?: string[];
  city?: string[];
  type?: ProjectType[];
  stage?: StageType;
  status?: StageStatus;
  keyword?: string;
  companyId?: string;
}
