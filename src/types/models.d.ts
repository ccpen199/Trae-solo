declare namespace API {
  interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
    timestamp: number;
  }

  interface PageResult<T = any> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
    pages: number;
  }

  interface PageParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }

  type UserRole = 'super_admin' | 'admin' | 'operator' | 'inspector' | 'viewer';

  interface LoginRequest {
    username: string;
    password: string;
    captcha?: string;
    captchaKey?: string;
    remember?: boolean;
  }

  interface LoginResponse {
    token: string;
    refreshToken: string;
    expiresIn: number;
    userInfo: UserInfo;
  }

  interface UserInfo {
    id: string;
    username: string;
    realName: string;
    role: UserRole;
    roleName: string;
    avatar?: string;
    phone?: string;
    email?: string;
    department?: string;
    region?: string;
    regionCode?: string;
    permissions: string[];
    lastLoginTime?: string;
    lastLoginIp?: string;
    status: 'active' | 'disabled' | 'locked';
    createTime: string;
    updateTime: string;
  }

  type PlaceStatus = 'pending' | 'approved' | 'rejected' | 'closed';
  type PlaceType = 'internet_cafe' | 'arcade' | 'ktv' | 'other';
  type PlaceLevel = '5A' | '4A' | '3A' | '2A' | '1A' | 'none';

  interface PlaceCertificate {
    type: 'fire' | 'security' | 'business';
    typeName: string;
    url: string;
    name: string;
  }

  interface PlaceAuditRecord {
    id: string;
    action: 'submit' | 'approve' | 'reject' | 'revoke' | 'edit';
    actionName: string;
    operator: string;
    remark?: string;
    time: string;
  }

  interface PlaceInfo {
    id: string;
    name: string;
    type: PlaceType;
    typeName: string;
    level?: PlaceLevel;
    address: string;
    province: string;
    city: string;
    district: string;
    regionCode: string;
    longitude?: number;
    latitude?: number;
    legalPerson: string;
    contactPerson: string;
    contactPhone: string;
    phone: string;
    businessLicense?: string;
    businessScope?: string;
    openingHours?: string;
    businessHours?: string;
    capacity: number;
    computerCount: number;
    area?: number;
    description?: string;
    images?: string[];
    certificates?: PlaceCertificate[];
    auditRecords?: PlaceAuditRecord[];
    currentOccupancy?: number;
    status: PlaceStatus;
    statusName: string;
    auditTime?: string;
    auditRemark?: string;
    rejectReason?: string;
    createTime: string;
    updateTime: string;
  }

  interface PlaceCreateRequest {
    name: string;
    type: PlaceType;
    level?: PlaceLevel;
    address: string;
    province: string;
    city: string;
    district: string;
    regionCode: string;
    longitude?: number;
    latitude?: number;
    legalPerson: string;
    contactPerson: string;
    contactPhone: string;
    phone: string;
    businessLicense?: string;
    businessScope?: string;
    openingHours?: string;
    businessHours?: string;
    capacity: number;
    computerCount: number;
    area?: number;
    description?: string;
    images?: string[];
    certificates?: PlaceCertificate[];
  }

  interface PlaceAuditRequest {
    id: string;
    status: 'approved' | 'rejected';
    remark?: string;
  }

  interface PlaceRevokeRequest {
    id: string;
    reason: string;
  }

  type VerifyType = 'id_card' | 'face' | 'ticket' | 'reservation';
  type VerifyStatus = 'success' | 'failed' | 'pending';

  interface VerificationRecord {
    id: string;
    placeId: string;
    placeName: string;
    verifyType: VerifyType;
    verifyTypeName: string;
    idCard?: string;
    name?: string;
    ticketNo?: string;
    reservationId?: string;
    verifyTime: string;
    status: VerifyStatus;
    statusName: string;
    failReason?: string;
    deviceId?: string;
    deviceName?: string;
    operator?: string;
    remark?: string;
  }

  interface VerifyRequest {
    placeId: string;
    verifyType: VerifyType;
    idCard?: string;
    name?: string;
    ticketNo?: string;
    reservationId?: string;
    faceImage?: string;
    deviceId?: string;
  }

  interface VerifyResponse {
    success: boolean;
    message: string;
    recordId?: string;
    verifyTime?: string;
    userInfo?: Partial<UserInfo>;
    placeInfo?: Partial<PlaceInfo>;
  }

  type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired';

  interface TimeSlot {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
    reserved: number;
    available: number;
    status: 'available' | 'full' | 'closed';
  }

  interface ReservationConfig {
    id: string;
    placeId: string;
    placeName: string;
    maxDaily: number;
    maxPerSlot: number;
    advanceDays: number;
    cancelHours: number;
    requireIdCard: boolean;
    requirePhone: boolean;
    requireFace: boolean;
    timeSlots: TimeSlot[];
    effectiveDate: string;
    expiryDate?: string;
    status: 'active' | 'inactive';
    createTime: string;
    updateTime: string;
  }

  interface ReservationRecord {
    id: string;
    reservationNo: string;
    placeId: string;
    placeName: string;
    visitorName: string;
    visitorPhone: string;
    visitorIdCard?: string;
    visitorCount: number;
    visitDate: string;
    timeSlotId: string;
    timeSlot: string;
    status: ReservationStatus;
    statusName: string;
    verifyTime?: string;
    cancelTime?: string;
    cancelReason?: string;
    createTime: string;
    updateTime: string;
  }

  type AlarmLevel = 'critical' | 'major' | 'minor' | 'warning' | 'info';
  type AlarmType = 'overcrowd' | 'fire' | 'intrusion' | 'device_fault' | 'system_error' | 'other';
  type AlarmStatus = 'pending' | 'processing' | 'resolved' | 'ignored';

  interface AlarmRecord {
    id: string;
    alarmNo: string;
    placeId: string;
    placeName: string;
    type: AlarmType;
    typeName: string;
    level: AlarmLevel;
    levelName: string;
    title: string;
    content: string;
    location?: string;
    image?: string;
    deviceId?: string;
    deviceName?: string;
    status: AlarmStatus;
    statusName: string;
    alarmTime: string;
    handleTime?: string;
    handler?: string;
    handleRemark?: string;
    createTime: string;
    updateTime: string;
  }

  interface AlarmHandleRequest {
    id: string;
    status: 'processing' | 'resolved' | 'ignored';
    remark?: string;
  }

  interface AlarmStatistics {
    total: number;
    pending: number;
    processing: number;
    resolved: number;
    ignored: number;
    critical: number;
    major: number;
    minor: number;
    warning: number;
    info: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: {
      date: string;
      count: number;
    }[];
  }

  type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
  type InspectionResult = 'pass' | 'fail' | 'partial';

  interface CheckItem {
    id: string;
    name: string;
    category: string;
    standard: string;
    required: boolean;
    result?: InspectionResult;
    remark?: string;
    images?: string[];
  }

  interface InspectionTask {
    id: string;
    taskNo: string;
    placeId: string;
    placeName: string;
    title: string;
    type: 'routine' | 'special' | 'random' | 'complaint';
    typeName: string;
    inspectorId: string;
    inspectorName: string;
    planDate: string;
    actualDate?: string;
    checkItems: CheckItem[];
    status: InspectionStatus;
    statusName: string;
    overallResult?: InspectionResult;
    overallResultName?: string;
    remark?: string;
    createTime: string;
    updateTime: string;
  }

  interface InspectionResultRecord {
    id: string;
    taskId: string;
    itemId: string;
    itemName: string;
    result: InspectionResult;
    resultName: string;
    remark?: string;
    images?: string[];
    checkTime: string;
  }

  interface BusinessData {
    id: string;
    placeId: string;
    placeName: string;
    statDate: string;
    visitorCount: number;
    ticketRevenue: number;
    otherRevenue: number;
    totalRevenue: number;
    avgStayTime?: number;
    satisfaction?: number;
    complaints: number;
    createTime: string;
  }

  interface DataOverview {
    totalPlaces: number;
    activePlaces: number;
    todayVisitors: number;
    todayRevenue: number;
    pendingAudits: number;
    pendingAlarms: number;
    todayInspections: number;
    todayReservations: number;
    weekVisitors: number[];
    weekRevenue: number[];
    placeTypeStats: {
      type: string;
      typeName: string;
      count: number;
    }[];
    regionStats: {
      region: string;
      regionName: string;
      count: number;
    }[];
  }

  interface RoleInfo {
    id: string;
    name: string;
    code: string;
    description?: string;
    permissions: string[];
    dataScope: 'all' | 'region' | 'own';
    status: 'active' | 'inactive';
    createTime: string;
    updateTime: string;
  }

  interface OperationLog {
    id: string;
    logNo: string;
    userId: string;
    username: string;
    realName: string;
    module: string;
    operation: string;
    method: string;
    params?: string;
    result?: string;
    ip: string;
    location?: string;
    userAgent?: string;
    status: 'success' | 'failed';
    statusName: string;
    failReason?: string;
    costTime?: number;
    createTime: string;
  }

  interface LoginLog {
    id: string;
    logNo: string;
    userId: string;
    username: string;
    realName?: string;
    loginType: 'password' | 'token' | 'sso' | 'other';
    loginTypeName: string;
    ip: string;
    location?: string;
    userAgent?: string;
    device?: string;
    status: 'success' | 'failed';
    statusName: string;
    failReason?: string;
    createTime: string;
  }

  interface SecurityConfig {
    id: string;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumber: boolean;
    passwordRequireSpecial: boolean;
    passwordExpireDays: number;
    loginFailTimes: number;
    loginLockMinutes: number;
    sessionTimeoutMinutes: number;
    allowMultiDevice: boolean;
    requireCaptcha: boolean;
    captchaLength: number;
    ipWhiteList?: string[];
    ipBlackList?: string[];
    updateTime: string;
  }

  interface OptionItem {
    label: string;
    value: string | number;
    disabled?: boolean;
    children?: OptionItem[];
  }

  interface RegionItem {
    code: string;
    name: string;
    level: 'province' | 'city' | 'district';
    parentCode?: string;
    children?: RegionItem[];
  }
}

declare global {
  interface Window {
    __APP_VERSION__: string;
    __APP_ENV__: 'development' | 'production' | 'test';
  }
}

export {};
