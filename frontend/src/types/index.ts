export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DEALER = 'DEALER',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  BANNED = 'BANNED',
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  dealerCompany?: string;
  dealerLicense?: string;
  dealerRegion?: string;
  dealerLevel?: number;
  createdAt: string;
  lastLoginAt?: string;
}

export enum NewsType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum NewsStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface NewsCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  sortOrder: number;
  parentId?: string;
  _count?: {
    news: number;
  };
}

export interface NewsAuthor {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
}

export interface News {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  content: string;
  coverImage?: string;
  videoUrl?: string;
  type: NewsType;
  status: NewsStatus;
  views: number;
  likes: number;
  isTop: boolean;
  isHot: boolean;
  categoryId: string;
  authorId?: string;
  category: NewsCategory;
  author?: NewsAuthor;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  _count?: {
    comments: number;
  };
}

export interface NewsComment {
  id: string;
  content: string;
  newsId: string;
  userId: string;
  parentId?: string;
  user: {
    id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  };
  replies?: NewsComment[];
  createdAt: string;
  updatedAt: string;
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ON_SALE = 'ON_SALE',
  OFF_SALE = 'OFF_SALE',
  SOLD_OUT = 'SOLD_OUT',
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  sortOrder: number;
  parentId?: string;
  icon?: string;
  _count?: {
    products: number;
  };
}

export interface ProductSpec {
  id: string;
  productId: string;
  name: string;
  value: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  summary?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sales: number;
  coverImage?: string;
  images?: string;
  videoUrl?: string;
  status: ProductStatus;
  isNew: boolean;
  isHot: boolean;
  isRecommend: boolean;
  categoryId: string;
  category: ProductCategory;
  productSpecs: ProductSpec[];
  cultureContent?: string;
  planContent?: string;
  activityContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  specId?: string;
  product: {
    id: string;
    name: string;
    code: string;
    price: number;
    coverImage?: string;
    status: ProductStatus;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
  message: string;
}
