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
} from "../../shared/types";

export const socialSecurityApi = {
  getAccount: (): Promise<SocialSecurityAccount> =>
    client.get<SocialSecurityAccount>("/social-security/370202199001011234"),
  getHistory: (): Promise<SocialSecurityAccount["contributionHistory"]> =>
    client.get<SocialSecurityAccount["contributionHistory"]>(
      "/social-security/370202199001011234/history"
    ),
  generateCertificate: (): Promise<{ base64: string; filename: string }> =>
    client.post<{ base64: string; filename: string }>(
      "/social-security/370202199001011234/certificate"
    ),
};

export const trafficApi = {
  getEvents: (params?: {
    type?: string;
    severity?: string;
  }): Promise<TrafficEvent[]> =>
    client.get<TrafficEvent[]>("/traffic/events", params),
  getBusPredictions: (): Promise<BusPrediction[]> =>
    client.get<BusPrediction[]>("/traffic/bus/predictions"),
  reportEvent: (data: Partial<TrafficEvent>): Promise<TrafficEvent> =>
    client.post<TrafficEvent>("/traffic/events", data),
};

export const paymentApi = {
  searchAccounts: (keyword?: string): Promise<PaymentAccount[]> =>
    client.get<PaymentAccount[]>("/payment/accounts", { keyword }),
  getAccounts: (category?: PaymentCategory): Promise<PaymentAccount[]> =>
    client.get<PaymentAccount[]>("/payment/accounts", { category }),
  getRecords: (accountId?: string): Promise<PaymentRecord[]> =>
    client.get<PaymentRecord[]>("/payment/records", { accountId }),
  pay: (accountId: string, amount: number): Promise<PaymentRecord> =>
    client.post<PaymentRecord>("/payment/pay", { accountId, amount }),
};

export const communityApi = {
  getPosts: (params?: {
    board?: string;
    page?: number;
    pageSize?: number;
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
