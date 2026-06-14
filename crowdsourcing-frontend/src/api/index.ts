import request from '@/utils/request';
import {
  LoginParams,
  RegisterParams,
  LoginResult,
  User,
  Task,
  TaskFilterParams,
  PageResult,
  TaskPublishResult,
  Bid,
  Submission,
  ReviewComment,
  Provider,
  ProviderFilterParams,
  PortfolioItem,
  MatchResult,
  Conversation,
  Message,
  Payment,
  IPCertificate,
  Dispute,
  AuditLog,
  PlatformStats,
  CategoryStats,
  HeatmapData,
  PageParams,
  Milestone
} from '@/types';

export const authApi = {
  login: (params: LoginParams) => request<LoginParams, LoginResult>({
    url: '/auth/login',
    method: 'post',
    data: params
  }),
  register: (params: RegisterParams) => request<RegisterParams, void>({
    url: '/auth/register',
    method: 'post',
    data: params
  }),
  logout: () => request({
    url: '/auth/logout',
    method: 'post'
  }),
  getCurrentUser: () => request<any, User>({
    url: '/auth/me',
    method: 'get'
  }),
  sendVerifyCode: (email: string) => request({
    url: '/auth/send-verify-code',
    method: 'post',
    data: { email }
  })
};

export const userApi = {
  getProfile: () => request<any, User>({
    url: '/users/profile',
    method: 'get'
  }),
  getUserInfo: () => request<any, User>({
    url: '/users/profile',
    method: 'get'
  }),
  getProviderProfile: () => request<any, Provider>({
    url: '/users/provider-profile',
    method: 'get'
  }),
  updateProfile: (data: Partial<User>) => request<Partial<User>, User>({
    url: '/users/profile',
    method: 'put',
    data
  }),
  updateUserInfo: (data: Partial<User>) => request<Partial<User>, User>({
    url: '/users/profile',
    method: 'put',
    data
  }),
  changePassword: (oldPassword: string | { oldPassword: string; newPassword: string }, newPassword?: string) => {
    const data = typeof oldPassword === 'object' ? oldPassword : { oldPassword, newPassword: newPassword! };
    return request({
      url: '/users/password',
      method: 'put',
      data
    });
  },
  updatePaymentMethods: (data: any) => request({
    url: '/users/payment-methods',
    method: 'put',
    data
  }),
  submitVerification: (data: any) => request({
    url: '/users/verification',
    method: 'post',
    data
  }),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request({
      url: '/users/avatar',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const taskApi = {
  getList: (params: TaskFilterParams) => request<TaskFilterParams, PageResult<Task>>({
    url: '/tasks',
    method: 'get',
    params
  }),
  getTasks: (params: TaskFilterParams) => request<TaskFilterParams, PageResult<Task>>({
    url: '/tasks',
    method: 'get',
    params
  }),
  getDetail: (id: string) => request<any, Task>({
    url: `/tasks/${id}`,
    method: 'get'
  }),
  create: (data: Partial<Task>) => request<Partial<Task>, TaskPublishResult>({
    url: '/tasks',
    method: 'post',
    data
  }),
  update: (id: string, data: Partial<Task>) => request<Partial<Task>, Task>({
    url: `/tasks/${id}`,
    method: 'put',
    data
  }),
  delete: (id: string) => request({
    url: `/tasks/${id}`,
    method: 'delete'
  }),
  deleteTask: (id: string) => request({
    url: `/tasks/${id}`,
    method: 'delete'
  }),
  publish: (id: string) => request<any, TaskPublishResult>({
    url: `/tasks/${id}/publish`,
    method: 'post'
  }),
  updateStatus: (id: string, status: string, remark?: string) => request({
    url: `/tasks/${id}/status`,
    method: 'put',
    data: { status, remark }
  }),
  getMyTasks: (params: TaskFilterParams) => request<TaskFilterParams, PageResult<Task>>({
    url: '/tasks/my',
    method: 'get',
    params
  }),
  getProviderTasks: (params: TaskFilterParams) => request<TaskFilterParams, PageResult<Task>>({
    url: '/tasks/provider',
    method: 'get',
    params
  }),
  getMilestones: (taskId: string) => request<any, Milestone[]>({
    url: `/tasks/${taskId}/milestones`,
    method: 'get'
  }),
  updateMilestone: (taskId: string, milestoneId: string, data: Partial<Milestone>) => request({
    url: `/tasks/${taskId}/milestones/${milestoneId}`,
    method: 'put',
    data
  }),
  audit: (id: string, approved: boolean, remark?: string) => request({
    url: `/tasks/${id}/audit`,
    method: 'post',
    data: { approved, remark }
  }),
  approveTask: (id: string, remark?: string) => request({
    url: `/tasks/${id}/audit`,
    method: 'post',
    data: { approved: true, remark }
  }),
  rejectTask: (id: string, remark: string) => request({
    url: `/tasks/${id}/audit`,
    method: 'post',
    data: { approved: false, remark }
  }),
  getAuditList: (params: PageParams) => request<PageParams, PageResult<Task>>({
    url: '/tasks/audit',
    method: 'get',
    params
  })
};

export const bidApi = {
  getList: (taskId: string, params?: PageParams) => request<PageParams, PageResult<Bid>>({
    url: `/tasks/${taskId}/bids`,
    method: 'get',
    params
  }),
  getMyBids: (params?: PageParams) => request<PageParams, PageResult<Bid>>({
    url: '/bids/my',
    method: 'get',
    params
  }),
  create: (taskId: string, data: { price: number; deliveryDays: number; coverLetter: string }) => request({
    url: `/tasks/${taskId}/bids`,
    method: 'post',
    data
  }),
  accept: (bidId: string) => request({
    url: `/bids/${bidId}/accept`,
    method: 'post'
  }),
  reject: (bidId: string, reason?: string) => request({
    url: `/bids/${bidId}/reject`,
    method: 'post',
    data: { reason }
  }),
  cancel: (bidId: string) => request({
    url: `/bids/${bidId}/cancel`,
    method: 'post'
  })
};

export const submissionApi = {
  getList: (taskId: string, params?: PageParams) => request<PageParams, PageResult<Submission>>({
    url: `/tasks/${taskId}/submissions`,
    method: 'get',
    params
  }),
  getSubmissions: (params?: { taskId?: string } & PageParams) => request<PageParams, PageResult<Submission>>({
    url: '/submissions/my',
    method: 'get',
    params
  }),
  getDetail: (id: string) => request<any, Submission>({
    url: `/submissions/${id}`,
    method: 'get'
  }),
  create: (taskId: string, data: { title: string; description: string; attachments: string[] }) => request({
    url: `/tasks/${taskId}/submissions`,
    method: 'post',
    data
  }),
  createSubmission: (data: { taskId: string; title: string; description: string; attachments: string[]; version?: number }) => request({
    url: `/tasks/${data.taskId}/submissions`,
    method: 'post',
    data
  }),
  review: (id: string, data: { status: string; content: string; rating?: number; attachments?: string[] }) => request<any, ReviewComment>({
    url: `/submissions/${id}/review`,
    method: 'post',
    data
  }),
  getMySubmissions: (params?: PageParams) => request<PageParams, PageResult<Submission>>({
    url: '/submissions/my',
    method: 'get',
    params
  })
};

export const reviewApi = {
  getList: (submissionId: string, params?: PageParams) => request<PageParams, PageResult<ReviewComment>>({
    url: `/submissions/${submissionId}/comments`,
    method: 'get',
    params
  }),
  addComment: (submissionId: string, data: { content: string; attachments?: string[] }) => request({
    url: `/submissions/${submissionId}/comments`,
    method: 'post',
    data
  })
};

export const providerApi = {
  getList: (params: ProviderFilterParams) => request<ProviderFilterParams, PageResult<Provider>>({
    url: '/providers',
    method: 'get',
    params
  }),
  getProviders: (params: ProviderFilterParams) => request<ProviderFilterParams, PageResult<Provider>>({
    url: '/providers',
    method: 'get',
    params
  }),
  getDetail: (id: string) => request<any, Provider>({
    url: `/providers/${id}`,
    method: 'get'
  }),
  updateLevel: (id: string, level: number) => request({
    url: `/providers/${id}/level`,
    method: 'put',
    data: { level }
  }),
  verifyCertificate: (id: string, certificateId: string, verified: boolean) => request({
    url: `/providers/${id}/certificates/${certificateId}/verify`,
    method: 'post',
    data: { verified }
  }),
  approveVerification: (id: string) => request({
    url: `/providers/${id}/verification/approve`,
    method: 'post'
  }),
  rejectVerification: (id: string, reason: string) => request({
    url: `/providers/${id}/verification/reject`,
    method: 'post',
    data: { reason }
  }),
  getReviews: (providerId: string, params?: PageParams) => request<PageParams, PageResult<ReviewComment>>({
    url: `/providers/${providerId}/reviews`,
    method: 'get',
    params
  }),
  toggleStatus: (id: string, enabled: boolean) => request({
    url: `/providers/${id}/status`,
    method: 'put',
    data: { enabled }
  })
};

export const portfolioApi = {
  getList: (providerId: string, params?: PageParams) => request<PageParams, PageResult<PortfolioItem>>({
    url: `/providers/${providerId}/portfolio`,
    method: 'get',
    params
  }),
  getMyPortfolio: (params?: PageParams) => request<PageParams, PageResult<PortfolioItem>>({
    url: '/portfolio/my',
    method: 'get',
    params
  }),
  getDetail: (id: string) => request<any, PortfolioItem>({
    url: `/portfolio/${id}`,
    method: 'get'
  }),
  create: (data: Partial<PortfolioItem>) => request<Partial<PortfolioItem>, PortfolioItem>({
    url: '/portfolio',
    method: 'post',
    data
  }),
  createPortfolioItem: (data: Partial<PortfolioItem>) => request<Partial<PortfolioItem>, PortfolioItem>({
    url: '/portfolio',
    method: 'post',
    data
  }),
  update: (id: string, data: Partial<PortfolioItem>) => request<Partial<PortfolioItem>, PortfolioItem>({
    url: `/portfolio/${id}`,
    method: 'put',
    data
  }),
  updatePortfolioItem: (id: string, data: Partial<PortfolioItem>) => request<Partial<PortfolioItem>, PortfolioItem>({
    url: `/portfolio/${id}`,
    method: 'put',
    data
  }),
  delete: (id: string) => request({
    url: `/portfolio/${id}`,
    method: 'delete'
  }),
  deletePortfolioItem: (id: string) => request({
    url: `/portfolio/${id}`,
    method: 'delete'
  })
};

export const matchApi = {
  getMatchedProviders: (taskId: string, params?: { limit?: number }) => request<any, MatchResult[]>({
    url: `/tasks/${taskId}/match`,
    method: 'get',
    params
  }),
  getMatchedTasks: (params?: { limit?: number }) => request<any, MatchResult[]>({
    url: '/match/tasks',
    method: 'get',
    params
  })
};

export const messageApi = {
  getConversations: (params?: PageParams) => request<PageParams, PageResult<Conversation>>({
    url: '/messages/conversations',
    method: 'get',
    params
  }),
  getMessages: (conversationId: string, params?: PageParams) => request<PageParams, PageResult<Message>>({
    url: `/messages/conversations/${conversationId}`,
    method: 'get',
    params
  }),
  sendMessage: (conversationId: string, data: { content: string; type?: string; attachments?: string[] }) => request({
    url: `/messages/conversations/${conversationId}`,
    method: 'post',
    data
  }),
  createConversation: (participants: string[], taskId?: string) => request<any, Conversation>({
    url: '/messages/conversations',
    method: 'post',
    data: { participants, taskId }
  }),
  markAsRead: (conversationId: string) => request({
    url: `/messages/conversations/${conversationId}/read`,
    method: 'post'
  }),
  getUnreadCount: () => request<any, number>({
    url: '/messages/unread-count',
    method: 'get'
  })
};

export const paymentApi = {
  getList: (params?: PageParams & { type?: string; status?: string }) => request<any, PageResult<Payment>>({
    url: '/payments',
    method: 'get',
    params
  }),
  getMyPayments: (params?: PageParams & { type?: string; status?: string }) => request<any, PageResult<Payment>>({
    url: '/payments/my',
    method: 'get',
    params
  }),
  getProviderFinanceOverview: () => request<any, { balance: number; frozen: number; totalIncome: number; totalExpense: number; thisMonthIncome: number }>({
    url: '/payments/provider-overview',
    method: 'get'
  }),
  getTransactions: (params?: PageParams & { type?: string; status?: string }) => request<any, PageResult<Payment>>({
    url: '/payments',
    method: 'get',
    params
  }),
  createDeposit: (amount: number) => request({
    url: '/payments/deposit',
    method: 'post',
    data: { amount }
  }),
  payMilestone: (taskId: string, milestoneId: string) => request({
    url: `/payments/milestone/${milestoneId}`,
    method: 'post',
    data: { taskId }
  }),
  releasePayment: (taskId: string, amount: number) => request({
    url: '/payments/release',
    method: 'post',
    data: { taskId, amount }
  }),
  requestWithdraw: (amount: number, account: string) => request({
    url: '/payments/withdraw',
    method: 'post',
    data: { amount, account }
  }),
  withdraw: (amount: number, account: string) => request({
    url: '/payments/withdraw',
    method: 'post',
    data: { amount, account }
  }),
  getBalance: () => request<any, { balance: number; frozen: number; totalIncome: number; totalExpense: number }>({
    url: '/payments/balance',
    method: 'get'
  })
};

export const ipApi = {
  getList: (params?: PageParams & { status?: string; type?: string }) => request<any, PageResult<IPCertificate>>({
    url: '/ip-certificates',
    method: 'get',
    params
  }),
  getIPCertificates: (params?: PageParams & { status?: string; type?: string }) => request<any, PageResult<IPCertificate>>({
    url: '/ip-certificates',
    method: 'get',
    params
  }),
  getMyCertificates: (params?: PageParams & { status?: string; type?: string }) => request<any, PageResult<IPCertificate>>({
    url: '/ip-certificates/my',
    method: 'get',
    params
  }),
  getDetail: (id: string) => request<any, IPCertificate>({
    url: `/ip-certificates/${id}`,
    method: 'get'
  }),
  create: (taskId: string, data: Partial<IPCertificate>) => request({
    url: '/ip-certificates',
    method: 'post',
    data: { taskId, ...data }
  }),
  issue: (id: string) => request({
    url: `/ip-certificates/${id}/issue`,
    method: 'post'
  }),
  revoke: (id: string, reason: string) => request({
    url: `/ip-certificates/${id}/revoke`,
    method: 'post',
    data: { reason }
  }),
  downloadCertificate: (id: string) => request({
    url: `/ip-certificates/${id}/download`,
    method: 'get',
    responseType: 'blob'
  })
};

export const disputeApi = {
  getList: (params?: PageParams & { status?: string }) => request<any, PageResult<Dispute>>({
    url: '/disputes',
    method: 'get',
    params
  }),
  getDisputes: (params?: PageParams & { status?: string }) => request<any, PageResult<Dispute>>({
    url: '/disputes',
    method: 'get',
    params
  }),
  getMyDisputes: (params?: PageParams & { status?: string }) => request<any, PageResult<Dispute>>({
    url: '/disputes/my',
    method: 'get',
    params
  }),
  getDetail: (id: string) => request<any, Dispute>({
    url: `/disputes/${id}`,
    method: 'get'
  }),
  create: (taskId: string, data: { type: string; title: string; description: string; amount?: number; evidence?: string[] }) => request({
    url: '/disputes',
    method: 'post',
    data: { taskId, ...data }
  }),
  createDispute: (data: { taskId: string; type: string; title: string; description: string; amount?: number; evidence?: string[] }) => request({
    url: '/disputes',
    method: 'post',
    data
  }),
  arbitrate: (id: string, data: { result: string; reason: string; compensationAmount?: number }) => request({
    url: `/disputes/${id}/arbitrate`,
    method: 'post',
    data
  }),
  addEvidence: (id: string, attachments: string[]) => request({
    url: `/disputes/${id}/evidence`,
    method: 'post',
    data: { attachments }
  })
};

export const analyticsApi = {
  getPlatformStats: () => request<any, PlatformStats>({
    url: '/analytics/platform-stats',
    method: 'get'
  }),
  getCategoryStats: () => request<any, CategoryStats[]>({
    url: '/analytics/category-stats',
    method: 'get'
  }),
  getRevenueTrend: (days: number = 30) => request<any, { date: string; amount: number }[]>({
    url: '/analytics/revenue-trend',
    method: 'get',
    params: { days }
  }),
  getTaskHeatmap: (days: number = 90) => request<any, HeatmapData[]>({
    url: '/analytics/task-heatmap',
    method: 'get',
    params: { days }
  }),
  getMyStats: () => request<any, {
    inProgress: number;
    pendingReview: number;
    completed: number;
    totalAmount: number;
    thisMonthEarnings: number;
  }>({
    url: '/analytics/my-stats',
    method: 'get'
  }),
  getProviderStats: (providerId: string) => request<any>({
    url: `/analytics/provider/${providerId}`,
    method: 'get'
  })
};

export const auditApi = {
  getLogs: (params?: PageParams & { action?: string; userRole?: string; riskLevel?: string }) => request<any, PageResult<AuditLog>>({
    url: '/audit-logs',
    method: 'get',
    params
  }),
  getUserLogs: (userId: string, params?: PageParams) => request<any, PageResult<AuditLog>>({
    url: `/audit-logs/user/${userId}`,
    method: 'get',
    params
  }),
  exportLogs: (params?: any) => request({
    url: '/audit-logs/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
};

export const publicApi = {
  getCategories: () => request<any, any[]>({
    url: '/public/categories',
    method: 'get'
  }),
  getServices: (params?: { categoryId?: number; keyword?: string; page?: number; pageSize?: number; status?: string }) => request<any, any>({
    url: '/public/services',
    method: 'get',
    params
  }),
  getServiceDetail: (id: string) => request<any, any>({
    url: `/public/services/${id}`,
    method: 'get'
  }),
  submitFeedback: (data: { name?: string; phone?: string; type?: string; title: string; description: string; contact?: string }) => request({
    url: '/public/feedback',
    method: 'post',
    data
  }),
  getStatsOverview: () => request<any, any>({
    url: '/public/stats/overview',
    method: 'get'
  })
};
