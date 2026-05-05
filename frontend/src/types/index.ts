export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  address: string;
  is_default: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publish_date?: string;
  isbn?: string;
  price: number;
  discount_price?: number;
  actual_price: number;
  cover_image?: string;
  description?: string;
  stock: number;
  sales_count: number;
  category_id: string;
  category_name?: string;
  is_new: boolean;
  status: 'active' | 'out_of_stock' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  book_id: string;
  quantity: number;
  added_at: string;
  book?: Book;
  price?: number;
  discount_price?: number;
  actual_price?: number;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
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
  created_at: string;
  updated_at: string;
  username?: string;
  email?: string;
  items?: OrderItem[];
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
  created_at: string;
  updated_at: string;
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

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
  isLoading: boolean;
}

export interface BookSearchParams {
  keyword?: string;
  categoryId?: string;
  author?: string;
  publisher?: string;
  minPrice?: number;
  maxPrice?: number;
  isNew?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
