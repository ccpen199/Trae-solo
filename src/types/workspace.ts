export type WorkCaseStatus = 'intake' | 'preparation' | 'trial' | 'enforcement' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'archived';
export type Priority = 'low' | 'medium' | 'high';
export type EvidenceType = 'document' | 'image' | 'video' | 'audio' | 'archive';

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  role: 'lead' | 'associate' | 'paralegal';
  joinedAt: string;
}

export interface CaseNode {
  id: string;
  caseId: string;
  name: string;
  description?: string;
  date: string;
  completed: boolean;
  reminder: boolean;
  reminderDays?: number;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  folderId?: string;
  name: string;
  type: EvidenceType;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  ocrText?: string;
  tags: string[];
  createdAt: string;
}

export interface EvidenceFolder {
  id: string;
  caseId: string;
  name: string;
  parentId?: string;
  itemCount: number;
  createdAt: string;
}

export interface WorkCase {
  id: string;
  caseNumber?: string;
  title: string;
  clientName: string;
  clientPhone?: string;
  caseSourceId?: string;
  leadLawyerId: string;
  leadLawyerName: string;
  teamMembers: TeamMember[];
  status: WorkCaseStatus;
  priority: Priority;
  description?: string;
  nodes: CaseNode[];
  evidence: EvidenceItem[];
  createdAt: string;
  archivedAt?: string;
}

export interface Task {
  id: string;
  caseId: string;
  caseTitle: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  tags: string[];
  comments: number;
  attachments: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseParams {
  title: string;
  clientName: string;
  clientPhone?: string;
  caseNumber?: string;
  priority: Priority;
  description?: string;
  teamMembers: string[];
}

export interface CreateTaskParams {
  caseId: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: Priority;
  dueDate?: string;
  tags: string[];
}

export interface UpdateTaskStatusParams {
  taskId: string;
  status: TaskStatus;
}
