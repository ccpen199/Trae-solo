import api from './api';

const unwrap = (res: { data: { data: unknown } }): unknown => res.data.data;

const call = <T>(promise: Promise<{ data: { data: T } }>): Promise<T> =>
  promise.then(res => res.data.data as T);

export const userApi = {
  getMe: () => call<import('../types').User>(api.get('/users/me')),
  getById: (id: string) => call<import('../types').User>(api.get(`/users/${id}`)),
  search: (params: Record<string, unknown>) =>
    call<import('../types').Paginated<import('../types').User>>(api.get('/users/search/list', { params })),
  update: (id: string, data: unknown) => call<import('../types').User>(api.put(`/users/${id}`, data)),
  getCreditRecords: (id: string) =>
    call<{ score: number; records: import('../types').CreditRecord[] }>(api.get(`/users/${id}/credit-records`)),
};

export const activityApi = {
  create: (data: unknown) => call<import('../types').Activity>(api.post('/activities', data)),
  list: (params: Record<string, unknown>) =>
    call<import('../types').Paginated<import('../types').Activity>>(api.get('/activities', { params })),
  getById: (id: string) => call<import('../types').Activity>(api.get(`/activities/${id}`)),
  apply: (id: string) => call<{ success: boolean; message?: string }>(api.post(`/activities/${id}/apply`)),
  cancel: (id: string) => call<{ success: boolean }>(api.post(`/activities/${id}/cancel`)),
  getRecommendedMatches: (id: string) =>
    call<import('../types').MatchCardData[]>(api.get(`/activities/${id}/recommended-matches`)),
  submitFeedback: (id: string, data: unknown) =>
    call<{ success: boolean }>(api.post(`/activities/${id}/feedback`, data)),
};

export const matchingApi = {
  findMatches: (criteria: unknown) =>
    call<{ results: import('../types').MatchResult[] }>(api.post('/matching', criteria)),
  quickMatch: () => call<{ results: import('../types').MatchResult[] }>(api.post('/matching/quick')),
  like: (targetUserId: string) =>
    call<{ isMutualMatch: boolean }>(api.post(`/matching/mutual/${targetUserId}/like`)),
  getMutualMatches: () => call<unknown[]>(api.get('/matching/mutual/list')),
};

export const bubbleApi = {
  create: (data: unknown) => call<import('../types').BubbleRoom>(api.post('/bubble-rooms', data)),
  list: (params: Record<string, unknown>) =>
    call<import('../types').Paginated<import('../types').BubbleRoom>>(api.get('/bubble-rooms', { params })),
  getById: (id: string) => call<import('../types').BubbleRoom>(api.get(`/bubble-rooms/${id}`)),
  join: (id: string) => call<{ success: boolean; message?: string }>(api.post(`/bubble-rooms/${id}/join`)),
  leave: (id: string) => call<{ success: boolean }>(api.post(`/bubble-rooms/${id}/leave`)),
  sendMessage: (id: string, data: unknown) => call<unknown>(api.post(`/bubble-rooms/${id}/messages`, data)),
  getMessages: (id: string) => call<unknown[]>(api.get(`/bubble-rooms/${id}/messages`)),
  sendRedPacket: (id: string, data: unknown) => call<unknown>(api.post(`/bubble-rooms/${id}/red-packets`, data)),
  claimRedPacket: (packetId: string) =>
    call<{ success: boolean; amount?: number; message?: string }>(api.post(`/bubble-rooms/red-packets/${packetId}/claim`)),
  heartbeat: (id: string) => call<{ success: boolean }>(api.post(`/bubble-rooms/${id}/heartbeat`)),
};

export const safetyApi = {
  requestGuardian: (data: unknown) => call<unknown>(api.post('/safety/guardians/request', data)),
  respondGuardianRequest: (id: string, accept: boolean) =>
    call<{ success: boolean }>(api.post(`/safety/guardians/requests/${id}/respond`, { accept })),
  getGuardians: () => call<import('../types').GuardianRelation[]>(api.get('/safety/guardians/list')),
  getGuardianRequests: () => call<unknown[]>(api.get('/safety/guardians/requests')),
  startSession: (data: unknown) => call<import('../types').SafetySession>(api.post('/safety/sessions/start', data)),
  submitHeartbeat: (id: string, data: unknown) =>
    call<{ success: boolean; nextDue: string; missedCount: number }>(api.post(`/safety/sessions/${id}/heartbeat`, data)),
  triggerWhistle: (id: string, data: unknown) => call<unknown>(api.post(`/safety/sessions/${id}/whistle`, data)),
  endSession: (id: string) => call<{ success: boolean }>(api.post(`/safety/sessions/${id}/end`)),
  getSessions: () => call<import('../types').SafetySession[]>(api.get('/safety/sessions/list')),
  getSession: (id: string) => call<import('../types').SafetySession>(api.get(`/safety/sessions/${id}`)),
  acknowledgeAlert: (alertId: string) =>
    call<{ success: boolean }>(api.post(`/safety/alerts/${alertId}/acknowledge`)),
  resolveAlert: (alertId: string, note: string) =>
    call<{ success: boolean }>(api.post(`/safety/alerts/${alertId}/resolve`, { note })),
};

export const chatApi = {
  sendMessage: (receiverId: string, content: string) =>
    call<{ message: import('../types').ChatMessage; conversationId: string }>(
      api.post('/ai-chat/messages', { receiverId, content })
    ),
  getConversations: () => call<import('../types').Conversation[]>(api.get('/ai-chat/conversations')),
  getMessages: (id: string) => call<import('../types').ChatMessage[]>(api.get(`/ai-chat/conversations/${id}/messages`)),
  getTopicSuggestions: (id: string) =>
    call<import('../types').TopicSuggestion[]>(api.get(`/ai-chat/conversations/${id}/topic-suggestions`)),
  getContext: (id: string) =>
    call<{ suggestedTopics: import('../types').TopicSuggestion[]; commonTopics: string[]; friendshipScore: number }>(
      api.get(`/ai-chat/conversations/${id}/context`)
    ),
  getFriends: () => call<unknown[]>(api.get('/ai-chat/friends/list')),
};

export const couponApi = {
  list: (params: Record<string, unknown>) =>
    call<import('../types').Paginated<import('../types').Coupon>>(api.get('/local-service/coupons', { params })),
  getDetail: (id: string) => call<import('../types').Coupon>(api.get(`/local-service/coupons/${id}`)),
  purchase: (id: string, data: unknown) =>
    call<import('../types').CouponOrder>(api.post(`/local-service/coupons/${id}/purchase`, data)),
  redeem: (id: string, location?: string) =>
    call<{ success: boolean }>(api.post(`/local-service/orders/${id}/redeem`, { location })),
  getOrders: () => call<import('../types').CouponOrder[]>(api.get('/local-service/orders/list')),
  getSyncStatus: (id: string) => call<unknown>(api.get(`/local-service/orders/${id}/sync-status`)),
};

export const riskApi = {
  checkContent: (content: string, contextType: string) =>
    call<{ allowed: boolean; censoredContent: string }>(api.post('/risk/check-content', { content, contextType })),
  reportUser: (data: unknown) => call<unknown>(api.post('/risk/reports', data)),
  getStatus: () => call<import('../types').RiskStatus>(api.get('/risk/status')),
};

export { unwrap };
