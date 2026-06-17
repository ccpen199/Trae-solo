export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Owner {
  id: string;
  name: string;
  phone: string;
  idCardEncrypted: string;
  building: string;
  unit: string;
  room: string;
  verifyStatus: "pending" | "verified" | "rejected";
  faceVerified: boolean;
  propertyCertVerified: boolean;
  joinDate: string;
  avatar?: string;
}

export type UserRole =
  | "owner"
  | "council_director"
  | "council_member"
  | "property_admin"
  | "maintenance_staff"
  | "street_officer";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  ownerId?: string;
  avatar?: string;
  phone: string;
}

export type MotionStatus =
  | "draft"
  | "publicity"
  | "voting"
  | "passed"
  | "rejected";

export interface Motion {
  id: string;
  title: string;
  content: string;
  attachments: Attachment[];
  status: MotionStatus;
  voteType: "anonymous" | "realname";
  publicityStart: string;
  voteStart: string;
  voteEnd: string;
  initiator: string;
  initiatorName: string;
  blockchainHash?: string;
  voteStats: {
    totalVoters: number;
    votedCount: number;
    agreeCount: number;
    disagreeCount: number;
    abstainCount: number;
  };
}

export interface VoteRecord {
  id: string;
  motionId: string;
  ownerId: string;
  vote: "agree" | "disagree" | "abstain";
  voteTime: string;
  isAnonymous: boolean;
  transactionHash?: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  type: "income" | "expense";
  budget: number;
  actual: number;
  children?: FinanceAccount[];
}

export interface OCRResult {
  invoiceNo: string;
  amount: number;
  date: string;
  vendor: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  confidence: number;
}

export interface Invoice {
  id: string;
  amount: number;
  type: "income" | "expense";
  invoiceNo: string;
  date: string;
  vendor: string;
  imageUrl: string;
  ocrResult?: OCRResult;
  verified: boolean;
  accountId: string;
  accountName: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export type SealType = "official" | "finance" | "contract";
export type SealStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "in_use"
  | "returned";

export interface SealApplication {
  id: string;
  applicant: string;
  applicantName: string;
  reason: string;
  sealType: SealType;
  useTime: string;
  expectReturnTime: string;
  attachments: Attachment[];
  status: SealStatus;
  approver?: string;
  approverName?: string;
  approveTime?: string;
  createdAt?: string;
  rejectReason?: string;
  unlockRecordId?: string;
  unlockTime?: string;
  returnTime?: string;
  videoUrl?: string;
}

export interface UnlockRecord {
  id: string;
  applicationId: string;
  sealType: SealType;
  unlockTime: string;
  returnTime?: string;
  operator: string;
  videoUrl: string;
}

export type TicketStatus =
  | "pending_assign"
  | "assigned"
  | "processing"
  | "completed"
  | "escalated";

export interface RepairTicket {
  id: string;
  title: string;
  description: string;
  photos: string[];
  location: string;
  submitter: string;
  submitterName: string;
  submitTime: string;
  status: TicketStatus;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  assignee?: string;
  assigneeName?: string;
  assignTime?: string;
  acceptTime?: string;
  completeTime?: string;
  completionProof?: string[];
  rating?: number;
  ratingComment?: string;
  escalated: boolean;
  escalatedTime?: string;
  superviseRecord?: SuperviseRecord;
  processLog: {
    time: string;
    action: string;
    operator: string;
    remark?: string;
  }[];
}

export interface SuperviseRecord {
  id: string;
  ticketId: string;
  streetOfficer: string;
  officerName: string;
  instruction: string;
  deadline: string;
  feedback?: string;
  feedbackTime?: string;
  status: "pending" | "processing" | "completed";
}

export interface PropertyCompany {
  id: string;
  name: string;
  licenseNo: string;
  legalRepresentative: string;
  contactPhone: string;
  address: string;
  contractStart: string;
  contractEnd: string;
  serviceScore: number;
  status: "active" | "expired" | "terminated";
  businessLicense?: string;
  legalPerson?: string;
  phone?: string;
  overallRating?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  serviceScores?: {
    attitude: number;
    response: number;
    quality: number;
    cleanliness: number;
    safety: number;
  };
}

export interface MaintenanceStaff {
  id: string;
  name: string;
  phone: string;
  companyId: string;
  skills: string[];
  status: "on_duty" | "off_duty" | "busy" | "available" | "working";
  totalCompleted: number;
  rating: number;
  completedOrders?: number;
}

export interface CreditScore {
  ownerId: string;
  points: number;
  energy: number;
  level: number;
  totalSwaps: number;
  totalContributions: number;
}

export type SwapItemStatus = "available" | "reserved" | "swapped";

export interface SwapItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  condition: "new" | "like_new" | "good" | "fair";
  pricePoints: number;
  ownerId: string;
  ownerName: string;
  status: SwapItemStatus;
  createdAt: string;
  reservedBy?: string;
  swappedAt?: string;
}

export interface CrowdfundingProject {
  id: string;
  title: string;
  description: string;
  images: string[];
  targetAmount: number;
  currentAmount: number;
  supporterCount: number;
  minSupport: number;
  startTime: string;
  endTime: string;
  status: "ongoing" | "success" | "failed";
  organizer: string;
  rewards: {
    amount: number;
    description: string;
  }[];
}

export interface ExchangeService {
  id: string;
  name: string;
  description: string;
  icon: string;
  energyCost: number;
  unit: string;
  available: boolean;
}

export interface ExchangeRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  energyCost: number;
  quantity: number;
  ownerId: string;
  exchangeTime: string;
  appointmentTime?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

export interface CommunityHealth {
  paymentRate: number;
  participationRate: number;
  complaintResolutionRate: number;
  overallScore: number;
  level: "excellent" | "good" | "fair" | "poor";
  trend: {
    date: string;
    score: number;
  }[];
  indicators: {
    name: string;
    value: number;
    target: number;
    unit: string;
    trend: "up" | "down" | "stable";
  }[];
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  type:
    | "approval"
    | "vote"
    | "ticket"
    | "supervision"
    | "seal"
    | "verification";
  priority: "high" | "medium" | "low";
  relatedId: string;
  createdAt: string;
  deadline?: string;
}

export interface CouncilMember {
  id: string;
  ownerId: string;
  ownerName: string;
  position: "director" | "vice_director" | "member" | "supervisor";
  termStart: string;
  termEnd: string;
  status: "active" | "ended" | "suspended";
  electionVoteCount: number;
  electionTransactionHash?: string;
  isCurrent?: boolean;
  avatar?: string;
  name?: string;
  votes?: number;
  blockchainHash?: string;
}

export interface StreetInstruction {
  id: string;
  title: string;
  content: string;
  type: "supervision" | "inspection" | "notification" | "coordination";
  sender: string;
  senderName: string;
  receiverCommunity: string;
  sendTime: string;
  deadline: string;
  feedback?: string;
  feedbackTime?: string;
  feedbackAttachments?: Attachment[];
  status: "pending" | "processing" | "completed" | "overdue";
  issueTime?: string;
}

export interface AuditReport {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  anomalies: {
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
    relatedInvoiceId?: string;
  }[];
  recommendations: string[];
  auditor: string;
  status: "draft" | "final";
}
