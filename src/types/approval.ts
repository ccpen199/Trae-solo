export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled';
export type ApprovalNodeType = 'start' | 'approval' | 'countersign' | 'addsign' | 'end';
export type ApprovalOperation = 'approve' | 'reject' | 'return' | 'countersign' | 'addsign' | 'transfer';

export interface ApprovalTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  formFields: ApprovalFormField[];
  processDefinition: ApprovalProcessNode[];
  flowNodes: ApprovalProcessNode[];
  isEnabled: boolean;
  sort: number;
}

export interface ApprovalFormField {
  key: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'date' | 'upload' | 'number';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface ApprovalProcessNode {
  id: string;
  name: string;
  type: ApprovalNodeType;
  assigneeType: 'user' | 'role' | 'leader' | 'dept';
  assigneeIds?: string[];
  countersignType?: 'all' | 'majority' | 'any';
  isReturnable: boolean;
  isAddsignable: boolean;
  isTransferable: boolean;
}

export interface CCUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface ApprovalInstance {
  id: string;
  instanceNo: string;
  templateId: string;
  templateName: string;
  title: string;
  formData: Record<string, any>;
  status: ApprovalStatus;
  applicantId: string;
  applicantName: string;
  applicantDept: string;
  currentNodeId: string;
  currentNodeName: string;
  currentNode: ApprovalProcessNode;
  approvalNodes: ApprovalProcessNode[];
  ccList: CCUser[];
  isUrgent: boolean;
  isCountersign: boolean;
  canAddSign: boolean;
  createTime: string;
  updateTime: string;
  processHistory: ApprovalProcessHistory[];
  attachments?: ApprovalAttachment[];
}

export interface ApprovalProcessHistory {
  id: string;
  nodeId: string;
  nodeName: string;
  operatorId: string;
  operatorName: string;
  operation: ApprovalOperation;
  opinion: string;
  operateTime: string;
  attachment?: ApprovalAttachment[];
}

export interface ApprovalAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
}

export interface ApprovalTodo {
  id: string;
  instanceId: string;
  title: string;
  templateName: string;
  applicantName: string;
  applicantDept: string;
  currentNodeName: string;
  receiveTime: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  isUrgent: boolean;
  isCountersign: boolean;
}
