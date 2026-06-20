export enum AdminLevel {
  PROVINCE = 'province',
  CITY = 'city',
  COUNTY = 'county',
  TOWN = 'town',
}

export enum IndustryZone {
  DIANZHONG_MANUFACTURING = 'dianzhong_manufacturing',
  PUER_TEA = 'puer_tea',
  XISHUANGBANNA_TOURISM = 'xishuangbanna_tourism',
  YUXI_TOBACCO = 'yuxi_tobacco',
  KUNMING_IT = 'kunming_it',
  QUJING_ENERGY = 'qujing_energy',
  HONGHE_METALLURGY = 'honghe_metallurgy',
  DALI_CULTURE = 'dali_culture',
  OTHER = 'other',
}

export enum CreditLevel {
  AAA = 'AAA',
  AA = 'AA',
  A = 'A',
  BBB = 'BBB',
  BB = 'BB',
  B = 'B',
}

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  EXPIRED = 'expired',
}

export enum FairStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export interface AdminDivision {
  id: string;
  code: string;
  name: string;
  level: AdminLevel;
  parent_id: string | null;
  full_path: string;
  sort_order: number;
}

export interface Company {
  id: string;
  name: string;
  unified_social_credit_code: string;
  registration_number: string;
  labor_filing_number: string;
  credit_level: CreditLevel;
  industry: string;
  industry_zone: IndustryZone;
  admin_division_id: string;
  address: string;
  legal_representative: string;
  contact_person: string;
  contact_phone: string;
  description: string;
  employee_count: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  industry_zone: IndustryZone;
  category: string;
  salary_min: number;
  salary_max: number;
  salary_negotiable: boolean;
  location_id: string;
  address: string;
  description: string;
  requirements: string;
  benefits: string;
  quantity: number;
  status: JobStatus;
  publish_date: string | null;
  expiry_date: string;
  view_count: number;
  application_count: number;
  created_at: string;
  updated_at: string;
}

export interface Graduate {
  id: string;
  name: string;
  id_card: string;
  student_id: string;
  school: string;
  major: string;
  education_level: string;
  graduation_date: string;
  phone: string;
  email: string;
  resume_url: string;
  employment_status: 'unemployed' | 'employed' | 'postgraduate' | 'other';
  employed_company_id: string | null;
  employed_job_id: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  admin_division_id: string;
  skills: string[];
  internships: Internship[];
  certificates: Certificate[];
  created_at: string;
  updated_at: string;
}

export interface Internship {
  id: string;
  graduate_id: string;
  company_name: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface Certificate {
  id: string;
  graduate_id: string;
  name: string;
  issuer: string;
  issue_date: string;
  certificate_number: string;
}

export interface JobFair {
  id: string;
  title: string;
  admin_division_id: string;
  organizer: string;
  location: string;
  start_time: string;
  end_time: string;
  status: FairStatus;
  description: string;
  max_companies: number;
  registered_companies: number;
  max_visitors: number;
  registered_visitors: number;
  is_live: boolean;
  live_url: string;
  created_at: string;
  updated_at: string;
}

export interface ProsperityIndex {
  id: string;
  admin_division_id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  total_jobs: number;
  total_applications: number;
  active_companies: number;
  supply_demand_ratio: number;
  salary_median: number;
  salary_average: number;
  prosperity_score: number;
  job_growth_rate: number;
  application_growth_rate: number;
  industry_zones: Record<IndustryZone, { jobs: number; applications: number }>;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  graduate_id: string;
  resume_id: string;
  status: 'applied' | 'reviewing' | 'interview' | 'accepted' | 'rejected';
  applied_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  admin_division_id: string;
  school_type: 'university' | 'college' | 'vocational';
  contact_person: string;
  contact_phone: string;
  address: string;
  majors: string[];
}

export interface RpoBatch {
  id: string;
  company_id: string;
  batch_name: string;
  total_jobs: number;
  success_count: number;
  fail_count: number;
  status: 'processing' | 'completed' | 'failed';
  target_schools: string[];
  auto_push: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'company' | 'school' | 'government';
  related_id: string;
  admin_division_id: string;
  created_at: string;
}
