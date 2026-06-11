export interface Message {
  id: string;
  type: MessageType;
  category: MessageCategory;
  title: string;
  content: string;
  summary?: string;
  sender: string;
  senderType: 'system' | 'organization' | 'service';
  receiverId: string;
  read: boolean;
  readTime?: string;
  sendTime: string;
  expireTime?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
  relatedMatterId?: string;
  relatedLicenseId?: string;
  relatedServiceCode?: string;
  actionType?: 'link' | 'detail' | 'apply' | 'none';
  actionUrl?: string;
  actionParams?: Record<string, any>;
  attachments?: MessageAttachment[];
}

export type MessageType = 
  | 'system_notice'
  | 'matter_progress'
  | 'license_reminder'
  | 'policy_update'
  | 'service_recommend'
  | 'payment_reminder'
  | 'verification_result';

export type MessageCategory = 
  | 'notification'
  | 'todo'
  | 'reminder'
  | 'marketing';

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'doc' | 'other';
  url: string;
  size: number;
}

export interface MessageQueryParams {
  type?: MessageType[];
  category?: MessageCategory[];
  read?: boolean;
  startTime?: string;
  endTime?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface MessageStats {
  total: number;
  unread: number;
  byType: Record<MessageType, number>;
  byCategory: Record<MessageCategory, number>;
}

export interface MessageSettings {
  receiveSystemNotice: boolean;
  receiveMatterProgress: boolean;
  receiveLicenseReminder: boolean;
  receivePolicyUpdate: boolean;
  receiveServiceRecommend: boolean;
  receivePaymentReminder: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}
