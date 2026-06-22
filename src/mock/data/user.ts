export interface UserAddress {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  isDefault: boolean;
}

export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  coupons: number;
  points: number;
  favorites: number;
}

export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  phone: string;
  email?: string;
  gender: "male" | "female" | "unknown";
  birthday?: string;
  level: string;
  levelName: string;
  isVip: boolean;
  vipExpireAt?: string;
  registerAt: string;
  lastLoginAt: string;
  stats: UserStats;
  addresses: UserAddress[];
}

export const currentUser: User = {
  id: "user-001",
  username: "photo_lover_2025",
  nickname: "照片控小明",
  avatar: "https://picsum.photos/seed/user001/200/200",
  phone: "138****6666",
  email: "xiaoming@example.com",
  gender: "male",
  birthday: "1995-08-15",
  level: "gold",
  levelName: "黄金会员",
  isVip: true,
  vipExpireAt: "2026-12-31",
  registerAt: "2023-06-18",
  lastLoginAt: "2025-06-18 09:30:00",
  stats: {
    totalOrders: 28,
    totalSpent: 2586.5,
    coupons: 5,
    points: 1280,
    favorites: 42,
  },
  addresses: [
    {
      id: "addr-001",
      name: "张小明",
      phone: "138****6666",
      province: "浙江省",
      city: "杭州市",
      district: "西湖区",
      address: "文三路 478 号华星时代广场 B 座 1208 室",
      isDefault: true,
    },
    {
      id: "addr-002",
      name: "李女士",
      phone: "139****8888",
      province: "上海市",
      city: "上海市",
      district: "浦东新区",
      address: "陆家嘴环路 1000 号恒生银行大厦 28 层",
      isDefault: false,
    },
  ],
};
