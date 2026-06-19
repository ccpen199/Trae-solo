export interface CitizenProfile {
    id: string;
    idCard: string;
    name: string;
    gender: 'male' | 'female';
    age: number;
    phone: string;
    avatar?: string;
    address: CitizenAddress;
    tags: CitizenTag[];
    behaviorStats: BehaviorStats;
    preferences: ServicePreferences;
    familyMembers?: FamilyMember[];
    lastUpdateTime: string;
}
export interface CitizenAddress {
    province: string;
    city: string;
    district: string;
    street: string;
    detail: string;
    community: string;
}
export interface CitizenTag {
    id: string;
    name: string;
    category: 'demographic' | 'behavior' | 'preference' | 'life-event';
    weight: number;
    source: string;
    createTime: string;
}
export interface BehaviorStats {
    totalServiceCount: number;
    lastServiceTime: string;
    serviceFrequency: Record<string, number>;
    clickHotspots: Record<string, number>;
    paymentFrequency: Record<string, number>;
    avgHandleTime: number;
    successRate: number;
}
export interface ServicePreferences {
    favoriteCategories: string[];
    commonServices: string[];
    notificationChannels: ('sms' | 'push' | 'wechat')[];
    language: 'zh-CN';
    accessibilityMode: AccessibilityConfig;
}
export interface AccessibilityConfig {
    enabled: boolean;
    highContrast: boolean;
    largeFont: boolean;
    voiceNavigation: boolean;
    screenReaderOptimized: boolean;
}
export interface FamilyMember {
    id: string;
    name: string;
    relation: string;
    idCard: string;
    profile?: CitizenProfile;
}
export interface GovernmentService {
    id: string;
    code: string;
    name: string;
    category: ServiceCategory;
    department: string;
    description: string;
    conditions: ServiceCondition[];
    materials: ServiceMaterial[];
    process: ServiceStep[];
    feeInfo: FeeInfo[];
    handlingTime: string;
    onlineAvailable: boolean;
    offlineAvailable: boolean;
    offlineAddress?: string;
    hotspots: string[];
    relatedPolicies: string[];
    relatedServices: string[];
    aiKeywords: string[];
    status: 'active' | 'maintenance' | 'offline';
}
export type ServiceCategory = 'housing' | 'social-security' | 'education' | 'medical' | 'household' | 'tax' | 'traffic' | 'business' | 'civil-affairs' | 'environment' | 'culture' | 'other';
export interface ServiceCondition {
    id: string;
    description: string;
    required: boolean;
    autoCheckable?: boolean;
    checkRule?: string;
}
export interface ServiceMaterial {
    id: string;
    name: string;
    required: boolean;
    format: string[];
    maxSize: number;
    sampleUrl?: string;
    autoFetchable?: boolean;
    fetchSource?: string;
}
export interface ServiceStep {
    step: number;
    name: string;
    description: string;
    handler: 'citizen' | 'system' | 'staff';
    estimatedTime: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
}
export interface FeeInfo {
    name: string;
    amount: number;
    unit: string;
    description: string;
}
export interface ServiceApplication {
    id: string;
    serviceId: string;
    serviceName: string;
    citizenId: string;
    applyTime: string;
    status: ApplicationStatus;
    currentStep: number;
    materials: SubmittedMaterial[];
    formData: Record<string, unknown>;
    processHistory: ProcessRecord[];
    appointmentInfo?: AppointmentInfo;
    estimatedCompleteTime?: string;
    actualCompleteTime?: string;
    remark?: string;
}
export type ApplicationStatus = 'draft' | 'submitted' | 'reviewing' | 'supplementing' | 'processing' | 'approved' | 'rejected' | 'completed' | 'cancelled';
export interface SubmittedMaterial {
    materialId: string;
    materialName: string;
    fileUrls: string[];
    submitTime: string;
    status: 'submitted' | 'verified' | 'rejected';
    rejectReason?: string;
}
export interface ProcessRecord {
    step: number;
    action: string;
    operator: string;
    operatorType: 'citizen' | 'system' | 'staff';
    time: string;
    remark?: string;
}
export interface AppointmentInfo {
    date: string;
    timeSlot: string;
    address: string;
    window: string;
}
export interface ServiceOrchestration {
    id: string;
    name: string;
    triggerEvent: OrchestrationTrigger;
    steps: OrchestrationStep[];
    conditions?: OrchestrationCondition[];
    status: 'active' | 'paused' | 'deprecated';
    version: string;
}
export interface OrchestrationTrigger {
    type: 'service-complete' | 'time-based' | 'event-based' | 'manual';
    serviceId?: string;
    eventName?: string;
    cronExpression?: string;
}
export interface OrchestrationStep {
    step: number;
    name: string;
    type: 'api-call' | 'notification' | 'data-sync' | 'approval' | 'condition';
    action: string;
    params?: Record<string, unknown>;
    timeout?: number;
    retryCount?: number;
    onFailure?: 'stop' | 'continue' | 'rollback';
}
export interface OrchestrationCondition {
    id: string;
    expression: string;
    description: string;
}
export interface DepartmentAdapter {
    id: string;
    code: string;
    name: string;
    category: string;
    baseUrl: string;
    authType: 'apikey' | 'oauth2' | 'certificate' | 'token';
    authConfig: Record<string, unknown>;
    endpoints: ApiEndpoint[];
    status: 'online' | 'offline' | 'degraded';
    lastHealthCheck: string;
    requestCount: number;
    avgResponseTime: number;
}
export interface ApiEndpoint {
    id: string;
    name: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    description: string;
    requestSchema?: string;
    responseSchema?: string;
    rateLimit?: number;
    timeout?: number;
}
export interface Policy {
    id: string;
    code: string;
    title: string;
    category: string;
    issuingDepartment: string;
    issueDate: string;
    effectiveDate: string;
    expiryDate?: string;
    content: string;
    summary: string;
    keywords: string[];
    targetAudience: string[];
    relatedServices: string[];
    relatedPolicies: string[];
    graphNodes: KnowledgeNode[];
    status: 'draft' | 'published' | 'archived';
    views: number;
    downloads: number;
}
export interface KnowledgeNode {
    id: string;
    type: 'policy' | 'condition' | 'material' | 'service' | 'concept' | 'faq';
    title: string;
    content: string;
    relations: KnowledgeRelation[];
    metadata?: Record<string, unknown>;
}
export interface KnowledgeRelation {
    targetId: string;
    targetType: string;
    relationType: 'reference' | 'prerequisite' | 'example' | 'interpretation' | 'related';
    description?: string;
}
export interface KnowledgeQAPair {
    id: string;
    question: string;
    answer: string;
    category: string;
    relatedPolicies: string[];
    relatedServices: string[];
    keywords: string[];
    clickCount: number;
    helpfulCount: number;
    source: 'manual' | 'auto-generated' | 'user-contributed';
    createTime: string;
}
export interface ServiceFeedback {
    id: string;
    applicationId?: string;
    serviceId: string;
    serviceName: string;
    citizenId: string;
    citizenName: string;
    rating: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    content: string;
    images?: string[];
    contact?: string;
    anonymous: boolean;
    createTime: string;
    handleStatus: 'pending' | 'processing' | 'handled' | 'closed';
    workOrderId?: string;
    clusterId?: string;
    reply?: FeedbackReply;
}
export interface FeedbackReply {
    content: string;
    replier: string;
    replyTime: string;
    attachments?: string[];
}
export interface FeedbackCluster {
    id: string;
    name: string;
    category: string;
    keywords: string[];
    feedbackIds: string[];
    count: number;
    avgRating: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    createTime: string;
    lastUpdateTime: string;
    assignedDept?: string;
    status: 'open' | 'analyzing' | 'resolved';
    suggestion?: string;
}
export interface WorkOrder {
    id: string;
    code: string;
    title: string;
    type: 'complaint' | 'suggestion' | 'consultation' | 'supervision';
    source: 'feedback' | 'manual' | 'auto-generated';
    sourceId?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'assigned' | 'processing' | 'reviewing' | 'completed' | 'closed';
    content: string;
    citizenId?: string;
    citizenName?: string;
    contact?: string;
    assignedDept: string;
    assignedStaff?: string;
    createTime: string;
    deadline: string;
    handleHistory: WorkOrderRecord[];
    attachments?: string[];
    tags: string[];
}
export interface WorkOrderRecord {
    action: string;
    operator: string;
    operatorType: 'system' | 'staff' | 'citizen';
    time: string;
    remark?: string;
    attachments?: string[];
}
export interface Notification {
    id: string;
    citizenId: string;
    type: 'reminder' | 'alert' | 'policy' | 'service' | 'system';
    title: string;
    content: string;
    priority: 'normal' | 'high' | 'urgent';
    relatedServiceId?: string;
    relatedApplicationId?: string;
    relatedPolicyId?: string;
    sendTime: string;
    readTime?: string;
    channels: ('push' | 'sms' | 'wechat' | 'email')[];
    status: 'draft' | 'sent' | 'failed' | 'read';
}
export interface DashboardStats {
    totalCitizens: number;
    todayActiveCitizens: number;
    totalServices: number;
    todayApplications: number;
    todayCompletedApplications: number;
    avgProcessingTime: number;
    satisfactionRate: number;
    pendingWorkOrders: number;
    topServices: RankedItem[];
    recentFeedbacks: ServiceFeedback[];
    applicationTrend: TrendData[];
    districtDistribution: DistributionItem[];
    categoryDistribution: DistributionItem[];
}
export interface RankedItem {
    id: string;
    name: string;
    count: number;
    rank: number;
}
export interface TrendData {
    date: string;
    value: number;
    type: string;
}
export interface DistributionItem {
    name: string;
    value: number;
    percentage: number;
}
export interface OfflineServicePackage {
    id: string;
    name: string;
    version: string;
    size: number;
    services: string[];
    policies: string[];
    guidelines: string[];
    checksum: string;
    publishDate: string;
    requiredMinVersion: string;
}
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
    timestamp: string;
    requestId: string;
}
export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface UserAuth {
    token: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        name: string;
        role: 'citizen' | 'staff' | 'admin';
        department?: string;
    };
}
//# sourceMappingURL=index.d.ts.map