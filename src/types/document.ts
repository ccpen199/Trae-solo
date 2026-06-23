export type DocumentType = 'doc' | 'sheet' | 'slide' | 'pdf' | 'other';
export type DocumentStatus = 'draft' | 'published' | 'archived';
export type PermissionType = 'owner' | 'edit' | 'view' | 'none';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  size: number;
  creatorId: string;
  creatorName: string;
  departmentId: string;
  departmentName: string;
  currentVersion: number;
  lastEditorId: string;
  lastEditorName: string;
  lastEditTime: string;
  createTime: string;
  watermarkEnabled: boolean;
  watermarkConfig?: WatermarkConfig;
  permission: PermissionType;
  tags: string[];
  previewUrl?: string;
  viewCount: number;
  collaborators?: DocumentCollaborator[];
  isConfidential: boolean;
  watermark?: WatermarkConfig;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number;
  angle: number;
  fontSize: number;
  color: string;
  density: 'sparse' | 'normal' | 'dense';
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  name: string;
  size: number;
  creatorId: string;
  creatorName: string;
  createTime: string;
  remark: string;
  changeLog: string;
  downloadUrl: string;
  isCurrent: boolean;
}

export interface DocumentPermission {
  id: string;
  documentId: string;
  targetType: 'user' | 'department' | 'role';
  targetId: string;
  targetName: string;
  permission: PermissionType;
  grantTime: string;
  granterId: string;
}

export interface DocumentCollaborator {
  userId: string;
  userName: string;
  userAvatar: string;
  permission: PermissionType;
  lastActiveTime: string;
  isEditing: boolean;
  role: string;
  department: string;
}
