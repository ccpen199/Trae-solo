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
