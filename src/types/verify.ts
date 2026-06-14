export type SukangStatus = 'green' | 'yellow' | 'red' | null;

export type VerificationType = 'sukang' | 'ocr' | 'manual' | 'face';

export type VerificationMethod = 'api_query' | 'id_card' | 'user_submit' | 'face_scan';

export type VerificationStatus = 'pending' | 'success' | 'failed' | 'processing';

export interface VerificationHistoryItem {
  id: number;
  user_id: number;
  type: VerificationType;
  method: VerificationMethod;
  status: VerificationStatus;
  result: string | null;
  details: string | null;
  error_message: string | null;
  request_encrypted: number;
  created_at: string;
}

export interface VerificationHistoryResponse {
  list: VerificationHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  stats: {
    sukang_count: number;
    ocr_count: number;
    success_count: number;
    failed_count: number;
  };
}

export interface OCRResult {
  name: string;
  id_number: string;
  address: string;
  issue_authority: string;
  valid_period: string;
  birth_date: string;
  gender: string;
  ethnicity: string;
}

export interface SukangResponse {
  status: SukangStatus;
  query_time: string;
  encrypted: boolean;
}

export interface OCRResponse {
  ocr: OCRResult;
  verified: boolean;
  verification_level: number;
  encrypted: boolean;
}

export interface SubmitResponse {
  user: {
    id: number;
    phone: string;
    name: string;
    verified: boolean;
    verification_level: number;
    verification_method: string;
    verification_expiry: string;
    last_verified_at: string;
    sukang_status: SukangStatus;
  };
  submitted_at: string;
  encrypted: boolean;
}

export interface VerificationStatusCardData {
  verified: boolean;
  verification_level: number;
  verification_method: string | null;
  verification_expiry: string | null;
  last_verified_at: string | null;
  sukang_status: SukangStatus;
}

export type OCRStep = 'idle' | 'uploading' | 'preprocessing' | 'recognizing' | 'verifying' | 'done' | 'failed';

export const verificationLevelLabels: Record<number, string> = {
  0: '未认证',
  1: '基础认证',
  2: '实名认证',
  3: '高级认证',
};

export const verificationMethodLabels: Record<string, string> = {
  api_query: 'API查询',
  id_card: '身份证OCR',
  user_submit: '用户提交',
  face_scan: '人脸识别',
  ocr_id_card: '身份证OCR',
};

export const verificationTypeLabels: Record<string, string> = {
  sukang: '苏康码查询',
  ocr: 'OCR识别',
  manual: '人工核验',
  face: '人脸识别',
};

export const statusConfig = {
  green: { label: '绿码', bg: 'bg-green-500', text: 'text-green-600', lightBg: 'bg-green-50', border: 'border-green-200' },
  yellow: { label: '黄码', bg: 'bg-yellow-500', text: 'text-yellow-600', lightBg: 'bg-yellow-50', border: 'border-yellow-200' },
  red: { label: '红码', bg: 'bg-red-500', text: 'text-red-600', lightBg: 'bg-red-50', border: 'border-red-200' },
};
