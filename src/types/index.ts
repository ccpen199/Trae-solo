export interface Merchant {
  id: string;
  name: string;
  address: string;
  phone: string;
  category: string[];
  status: "open" | "closed";
  description: string;
  images: string[];
  location: { lat: number; lng: number };
  township: string;
  rating: number;
  verified: boolean;
  businessHours?: string;
}

export interface InfoPost {
  id: string;
  type: "job" | "housing" | "food" | "dating";
  title: string;
  content: string;
  images: string[];
  author: string;
  authorAvatar: string;
  createdAt: string;
  location: { lat: number; lng: number; township: string };
  tags: string[];
  status: "pending" | "approved" | "rejected";
  views: number;
  structuredData?: Record<string, string>;
}

export interface NewsArticle {
  id: string;
  category: "local" | "policy" | "township" | "guide";
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  views: number;
  township?: string;
}

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  interestTags: string[];
  location: { township: string; community?: string };
  role: "user" | "merchant" | "admin";
  publishedPosts: string[];
  favorites: string[];
}

export interface Township {
  name: string;
  code: string;
  center: { lat: number; lng: number };
}

export interface DashboardStats {
  hotCategories: { name: string; count: number; trend: number }[];
  activeTownships: { name: string; activeUsers: number; postCount: number }[];
  updateFrequency: { date: string; jobs: number; housing: number; food: number; dating: number }[];
  totalPosts: number;
  totalMerchants: number;
  totalUsers: number;
}

export interface AdminOrder {
  id: string;
  orderNo: string;
  source: "用户发布" | "商户发布" | "平台推送" | "第三方合作";
  type: "招聘" | "租房" | "售房" | "美食推荐" | "交友" | "资讯投稿";
  title: string;
  content: string;
  contactName: string;
  contactPhone: string;
  location: { township: string; address: string; lat: number; lng: number };
  images: string[];
  status: "待审核" | "已发布" | "已下架" | "已拒绝" | "处理中";
  amount: number;
  createdAt: string;
  publishedAt?: string;
  auditRecords: { id: string; status: string; operator: string; time: string; remark: string }[];
  publisher: { id: string; name: string; avatar: string; type: "user" | "merchant" };
}

export interface AuditRecord {
  id: string;
  auditNo: string;
  type: "UGC图文" | "UGC短视频" | "商户资质" | "招聘信息" | "房产信息" | "美食推荐" | "交友信息" | "资讯投稿";
  title: string;
  submitter: string;
  submitterRole: "普通用户" | "认证商户" | "管理员";
  submittedAt: string;
  operator: string;
  status: "待审核" | "审核通过" | "审核拒绝" | "待复查" | "已复查通过" | "已复查拒绝";
  reviewTraces: { step: number; operator: string; action: string; time: string; remark: string }[];
  township: string;
  evidence: string[];
  remark: string;
}

export interface AdminMerchant {
  id: string;
  name: string;
  category: string[];
  contactName: string;
  contactPhone: string;
  address: string;
  township: string;
  qualificationStatus: "未提交" | "待审核" | "已通过" | "已拒绝" | "已过期";
  businessStatus: "营业中" | "休息中" | "已停业";
  verified: boolean;
  registerTime: string;
  licenseExpiry: string;
  postCount: number;
  viewCount: number;
}

export interface TownshipDistribution {
  id: string;
  contentId: string;
  contentType: string;
  title: string;
  sourceTownship: string;
  targetTownships: string[];
  status: "待分发" | "分发中" | "已完成" | "已撤回";
  publisher: string;
  publishedAt: string;
  distributedAt?: string;
  reachCount: number;
}
