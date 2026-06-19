export type UserRole = 'user' | 'lawyer' | 'admin';

export type CaseCategory = 'marriage' | 'labor' | 'debt' | 'traffic' | 'contract' | 'criminal' | 'other';

export type ConsultationStatus = 'pending' | 'matched' | 'chatting' | 'closed' | 'reviewed';

export type LawyerVerifyStatus = 'pending' | 'approved' | 'rejected' | 'frozen';

export type DisputeStage = 'evaluation' | 'appeal' | 'arbitration' | 'resolved';

export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  nickname?: string;
  avatar?: string;
  realName?: string;
  idCard?: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lawyer {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseImage: string;
  firmName: string;
  practiceYears: number;
  specialties: CaseCategory[];
  verifyStatus: LawyerVerifyStatus;
  verifyReason?: string;
  creditScore: number;
  consultationCount: number;
  averageRating: number;
  continuingEducationCredits: number;
  frozenReason?: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface EvidenceFile {
  id: string;
  consultationId: string;
  uploaderId: string;
  fileName: string;
  originalName: string;
  fileType: 'image' | 'document' | 'other';
  fileSize: number;
  fileUrl: string;
  watermarkEnabled: boolean;
  uploadedAt: string;
}

export interface Consultation {
  id: string;
  userId: string;
  lawyerId?: string;
  category: CaseCategory;
  title: string;
  description: string;
  region?: string;
  urgency: UrgencyLevel;
  status: ConsultationStatus;
  evidenceFiles: EvidenceFile[];
  matchedAt?: string;
  closedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isEncrypted: boolean;
  isRead: boolean;
  burnAfterReading: boolean;
  burnDuration?: number;
  readAt?: string;
  createdAt: string;
}

export interface LegalOpinion {
  id: string;
  consultationId: string;
  lawyerId: string;
  title: string;
  caseSummary: string;
  legalAnalysis: string;
  suggestions: string;
  relatedLaws: string[];
  riskAssessment: string;
  createdAt: string;
}

export interface ServiceEvaluation {
  id: string;
  consultationId: string;
  userId: string;
  lawyerId: string;
  rating: number;
  content?: string;
  isComplaint: boolean;
  disputeStage?: DisputeStage;
  disputeResult?: string;
  createdAt: string;
  disputedAt?: string;
  resolvedAt?: string;
}

export interface MonitorStats {
  totalConsultations: number;
  pendingConsultations: number;
  activeLawyers: number;
  totalLawyers: number;
  averageResponseTime: number;
  averageRating: number;
  zeroResponseLawyers: number;
  consultationsPerLawyer: number;
  periodStart: string;
  periodEnd: string;
}
