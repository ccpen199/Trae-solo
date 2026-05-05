export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface UserAddress {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  is_default: boolean;
  created_at: Date;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publish_date?: Date;
  isbn?: string;
  price: number;
  discount_price?: number;
  cover_image?: string;
  description?: string;
  stock: number;
  sales_count: number;
  category_id: string;
  is_new: boolean;
  status: 'active' | 'out_of_stock' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface CartItem {
  id: string;
  user_id: string;
  book_id: string;
  quantity: number;
  added_at: Date;
  book?: Book;
}

export interface Order {
  id: string;
  order_no: string;
  user_id: string;
  total_amount: number;
  discount_amount?: number;
  actual_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  remark?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  book_id: string;
  book_title: string;
  book_author: string;
  book_price: number;
  quantity: number;
  subtotal: number;
}

export interface News {
  id: string;
  title: string;
  content: string;
  type: 'home' | 'store' | 'announcement';
  is_scroll: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Admin {
  id: string;
  username: string;
  password: string;
  real_name: string;
  role_id: string;
  status: 'active' | 'inactive';
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  content?: string;
  is_anonymous: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
