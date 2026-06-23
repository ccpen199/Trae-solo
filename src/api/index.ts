import { client } from "./client";
import type {
  SocialSecurityAccount,
  TrafficEvent,
  BusPrediction,
  PaymentAccount,
  PaymentRecord,
  PaymentCategory,
  CommunityPost,
  OpinionDashboard,
  PointOfInterest,
  PoiType,
  PolicyDocument,
  WeatherInfo,
  ServiceEntry,
  UserProfile,
  UserLocation,
  Favorite,
  CertificateResponse,
  PaymentAccountWithMatch,
  VerificationRecord,
  TrafficOverview,
  AccidentEvent,
  MetroDelayEvent,
  NotificationSubscription,
} from "../../shared/types";

export const socialSecurityApi = {
  getAccount: (): Promise<SocialSecurityAccount> =>
    client.get<SocialSecurityAccount>("/social-security/370202199001011234"),
  getHistory: (): Promise<SocialSecurityAccount["contributionHistory"]> =>
    client.get<SocialSecurityAccount["contributionHistory"]>(
      "/social-security/370202199001011234/history"
    ),
  getVerifications: (): Promise<VerificationRecord[]> =>
    client.get<VerificationRecord[]>(
      "/social-security/370202199001011234/verifications"
    ),
  generateCertificate: (): Promise<CertificateResponse> =>
    client.post<CertificateResponse>(
      "/social-security/370202199001011234/certificate"
    ),
};

interface PaymentSystemStatus {
  district: string;
  category: string;
  categoryLabel: string;
  systemSource: string;
  systemStatus: "online" | "offline" | "maintenance";
}

interface PaymentPayResult extends PaymentRecord {
  retryable?: boolean;
}

export const paymentApi = {
  searchAccounts: (keyword?: string, district?: string): Promise<PaymentAccountWithMatch[]> =>
    client.get<PaymentAccountWithMatch[]>("/payment/accounts", { keyword, district }),
  getAccounts: (category?: PaymentCategory): Promise<PaymentAccount[]> =>
    client.get<PaymentAccount[]>("/payment/accounts", { category }),
  getRecords: (accountId?: string): Promise<PaymentRecord[]> =>
    client.get<PaymentRecord[]>("/payment/records", { accountId }),
  pay: (accountId: string, amount: number): Promise<PaymentPayResult> =>
    client.post<PaymentPayResult>("/payment/pay", { accountId, amount }),
  getSystemsStatus: (): Promise<PaymentSystemStatus[]> =>
    client.get<PaymentSystemStatus[]>("/payment/systems-status"),
};

export const trafficApi = {
  getEvents: (params?: {
    type?: string;
    severity?: string;
  }): Promise<TrafficEvent[]> =>
    client.get<TrafficEvent[]>("/traffic/events", params),
  getOverview: (): Promise<TrafficOverview> =>
    client.get<TrafficOverview>("/traffic/overview"),
  getAccidents: (params?: {
    severity?: string;
    district?: string;
    status?: string;
  }): Promise<AccidentEvent[]> =>
    client.get<AccidentEvent[]>("/traffic/accidents", params),
  getMetroDelays: (params?: { status?: string }): Promise<MetroDelayEvent[]> =>
    client.get<MetroDelayEvent[]>("/traffic/metro/delays", params),
  getBusAbnormal: (): Promise<TrafficEvent[]> =>
    client.get<TrafficEvent[]>("/traffic/bus/abnormal"),
  getBusPredictions: (params?: { favorite?: boolean }): Promise<BusPrediction[]> =>
    client.get<BusPrediction[]>("/traffic/bus/predictions", params),
  searchBusRoutes: (keyword?: string): Promise<any[]> =>
    client.get<any[]>("/traffic/bus/routes", { keyword }),
  reportEvent: (data: Partial<TrafficEvent>): Promise<TrafficEvent> =>
    client.post<TrafficEvent>("/traffic/events", data),
  markAsRead: (id: string): Promise<{ id: string; read: boolean }> =>
    client.post<{ id: string; read: boolean }>(`/traffic/events/${id}/read`),
  subscribeEvent: (id: string): Promise<{
    id: string;
    subscribed: boolean;
    subscription: NotificationSubscription;
    message: string;
  }> =>
    client.post<{
      id: string;
      subscribed: boolean;
      subscription: NotificationSubscription;
      message: string;
    }>(`/traffic/events/${id}/subscribe`),
  unsubscribeEvent: (id: string): Promise<{
    id: string;
    subscribed: boolean;
    message: string;
  }> =>
    client.post<{
      id: string;
      subscribed: boolean;
      message: string;
    }>(`/traffic/events/${id}/unsubscribe`),
};

export const communityApi = {
  getPosts: (params?: {
    board?: string;
    page?: number;
    pageSize?: number;
    reviewStatus?: string;
  }): Promise<CommunityPost[]> =>
    client.get<CommunityPost[]>("/community/posts", params),
  getPost: (id: string): Promise<CommunityPost> =>
    client.get<CommunityPost>(`/community/posts/${id}`),
  getDashboard: (): Promise<OpinionDashboard> =>
    client.get<OpinionDashboard>("/community/dashboard"),
  createPost: (data: Partial<CommunityPost>): Promise<CommunityPost> =>
    client.post<CommunityPost>("/community/posts", data),
  likePost: (id: string): Promise<void> =>
    client.post<void>(`/community/posts/${id}/like`),
  reviewPost: (
    id: string,
    data: {
      opinionLevel?: 1 | 2 | 3 | 4 | 5;
      reviewComment?: string;
      reviewedBy?: string;
    }
  ): Promise<CommunityPost> =>
    client.post<CommunityPost>(`/community/posts/${id}/review`, data),
};

export const poiApi = {
  getList: (params?: {
    type?: PoiType;
    keyword?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<PointOfInterest[]> =>
    client.get<PointOfInterest[]>("/poi", params),
  getDetail: (id: string): Promise<PointOfInterest> =>
    client.get<PointOfInterest>(`/poi/${id}`),
};

export const policiesApi = {
  getList: (params?: {
    category?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PolicyDocument[]> =>
    client.get<PolicyDocument[]>("/policies", params),
  getDetail: (id: string): Promise<PolicyDocument> =>
    client.get<PolicyDocument>(`/policies/${id}`),
};

export const servicesApi = {
  getList: (category?: ServiceEntry["category"]): Promise<ServiceEntry[]> =>
    client.get<ServiceEntry[]>("/services", { category }),
  getRecommendations: (): Promise<ServiceEntry[]> =>
    client.get<ServiceEntry[]>("/services/recommendations"),
  rank: (
    location: Partial<UserLocation>
  ): Promise<
    (ServiceEntry & { distance: number; rankScore: number })[]
  > =>
    client.post<
      (ServiceEntry & { distance: number; rankScore: number })[]
    >("/services/rank", location),
};

export const weatherApi = {
  getCurrent: (location?: Partial<UserLocation>): Promise<WeatherInfo> =>
    client.get<WeatherInfo>("/weather", location),
};

export const userApi = {
  getProfile: (): Promise<UserProfile> => client.get<UserProfile>("/user/profile"),
  updateProfile: (data: Partial<UserProfile>): Promise<UserProfile> =>
    client.put<UserProfile>("/user/profile", data),
  getFavorites: (): Promise<Favorite[]> => client.get<Favorite[]>("/user/favorites"),
  addFavorite: (
    data: Omit<Favorite, "id" | "createdAt">
  ): Promise<Favorite> => client.post<Favorite>("/user/favorites", data),
  removeFavorite: (id: string): Promise<void> =>
    client.delete<void>(`/user/favorites/${id}`),
};

export const adminApi = {
  getOverview: (): Promise<{
    serviceStatus: Array<{
      name: string;
      status: "online" | "cached" | "offline";
      requestsToday: number;
      successRate: number;
    }>;
    alerts: Array<{ id: string; level: string; title: string; owner: string }>;
    metrics: {
      usersOnline: number;
      apiSuccessRate: number;
      pendingTickets: number;
      cachedPolicies: number;
    };
  }> => client.get("/admin/overview"),
};
