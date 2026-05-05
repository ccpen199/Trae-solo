export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

export interface Document {
  id: number;
  title: string;
  content: string;
  category: string;
  security_level: string;
  document_number: string;
  document_type: string;
  status: string;
  current_node: string;
  creator_id: number;
  creator_name?: string;
  creator?: User;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  is_archived: boolean;
}

export interface ProcessNode {
  id: number;
  document_id: number;
  node_name: string;
  node_order: number;
  node_type: string;
  status: string;
  handler_id: number;
  handler_name?: string;
  handler_department?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalComment {
  id: number;
  document_id: number;
  node_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  action: string;
  created_at: string;
}

export interface TodoTask {
  id: number;
  user_id: number;
  document_id: number;
  node_id: number;
  task_type: string;
  task_name: string;
  status: string;
  priority: string;
  deadline?: string;
  created_at: string;
  completed_at?: string;
  document_title?: string;
  document_number?: string;
  document_status?: string;
  category?: string;
  creator_name?: string;
}

export interface DocumentTracking {
  document: Document;
  current_status: string;
  current_handler?: User;
  process_nodes: ProcessNode[];
  comments: ApprovalComment[];
  todos: TodoTask[];
}

export interface ApiResponse<T = any> {
  data?: T;
  documents?: T;
  document?: Document;
  todos?: TodoTask[];
  process_nodes?: ProcessNode[];
  comments?: ApprovalComment[];
  users?: User[];
  user?: User;
  token?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  message?: string;
  action?: string;
  error?: string;
}
