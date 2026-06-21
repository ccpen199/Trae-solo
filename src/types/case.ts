export type CaseSourceStatus = 'draft' | 'published' | 'bidding' | 'selected' | 'processing' | 'completed' | 'cancelled';

export interface CaseBid {
  id: string;
  caseId: string;
  lawyerId: string;
  lawyerName: string;
  lawyerAvatar: string;
  lawyerFirm: string;
  lawyerCreditScore: number;
  price: number;
  proposal: string;
  estimatedDays: number;
  submittedAt: string;
  messageCount: number;
}

export interface CaseSource {
  id: string;
  title: string;
  description: string;
  cause: string;
  amount: number;
  province: string;
  city: string;
  deadline: string;
  deposit: number;
  publisherId: string;
  publisherName: string;
  status: CaseSourceStatus;
  tags: string[];
  bids: CaseBid[];
  selectedLawyerId?: string;
  contractId?: string;
  evidenceFiles: { name: string; url: string; size: number }[];
  createdAt: string;
}

export interface PublishCaseParams {
  title: string;
  description: string;
  cause: string;
  amount: number;
  province: string;
  city: string;
  deadline: string;
  deposit: number;
  tags: string[];
  evidenceFiles: File[];
}

export interface BidParams {
  caseId: string;
  price: number;
  proposal: string;
  estimatedDays: number;
}

export interface Contract {
  id: string;
  caseId: string;
  caseTitle: string;
  templateId: string;
  content: string;
  clientSigned: boolean;
  lawyerSigned: boolean;
  signedAt?: string;
  createdAt: string;
}
