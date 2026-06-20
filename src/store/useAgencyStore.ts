import { create } from 'zustand';
import type { ArtistProfile } from '@shared/types';

export type AgencyRole = 'Owner' | 'Admin' | 'Casting Manager' | 'Talent Scout' | 'Viewer';

export type PermissionKey =
  | 'viewArtists'
  | 'editArtists'
  | 'publishCastings'
  | 'viewAnalytics'
  | 'manageTeam'
  | 'viewContactInfo';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: AgencyRole;
  permissions: PermissionKey[];
  lastActive: string;
  status: 'active' | 'invited' | 'inactive';
}

export type ContactType = 'call' | 'email' | 'meeting' | 'audition';

export interface ContactRecord {
  id: string;
  date: string;
  contactType: ContactType;
  artistId: string;
  artistName: string;
  teamMemberId: string;
  teamMemberName: string;
  notes: string;
  followUpDate?: string;
}

export interface AgencyStats {
  totalArtists: number;
  activeCastings: number;
  pendingApplications: number;
  monthlyRevenue: number;
}

export interface ArtistRanking {
  artist: ArtistProfile;
  bookingCount: number;
  revenue: number;
}

export interface ApplicationTrendPoint {
  date: string;
  applications: number;
  hires: number;
}

export type ContractType = 'exclusive' | 'signed' | 'available' | 'unavailable';
export type ArtistStatus = 'active' | 'inactive';
export type Department = 'fashion' | 'commercial' | 'acting' | 'fitness';

export interface AgencyArtist extends ArtistProfile {
  contractType: ContractType;
  artistStatus: ArtistStatus;
  department: Department;
  upcomingBookings: number;
  revenueGenerated: number;
}

export const ROLE_PERMISSION_PRESETS: Record<AgencyRole, PermissionKey[]> = {
  Owner: ['viewArtists', 'editArtists', 'publishCastings', 'viewAnalytics', 'manageTeam', 'viewContactInfo'],
  Admin: ['viewArtists', 'editArtists', 'publishCastings', 'viewAnalytics', 'manageTeam', 'viewContactInfo'],
  'Casting Manager': ['viewArtists', 'editArtists', 'publishCastings', 'viewAnalytics', 'viewContactInfo'],
  'Talent Scout': ['viewArtists', 'editArtists', 'viewContactInfo'],
  Viewer: ['viewArtists', 'viewAnalytics'],
};

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  viewArtists: '查看艺人',
  editArtists: '编辑艺人',
  publishCastings: '发布选角',
  viewAnalytics: '查看数据分析',
  manageTeam: '管理团队',
  viewContactInfo: '查看联系方式',
};

interface AgencyState {
  stats: AgencyStats;
  teamMembers: TeamMember[];
  contactRecords: ContactRecord[];
  artists: AgencyArtist[];
  applicationTrend: ApplicationTrendPoint[];
  artistRankings: ArtistRanking[];
}

interface AgencyActions {
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMemberPermissions: (id: string, permissions: PermissionKey[]) => void;
  updateTeamMemberRole: (id: string, role: AgencyRole) => void;
  addContactRecord: (record: Omit<ContactRecord, 'id'>) => void;
  addArtist: (artist: Omit<AgencyArtist, 'id'>) => void;
  updateArtist: (id: string, updates: Partial<AgencyArtist>) => void;
}

type AgencyStore = AgencyState & AgencyActions;

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

const IMAGE_API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';
const getImageUrl = (prompt: string): string => {
  return `${IMAGE_API}?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;
};

const mockTeamMembers: TeamMember[] = [
  {
    id: 'member-1',
    name: '张明远',
    email: 'zhangmingyuan@agency.com',
    avatar: getImageUrl('professional asian male business portrait'),
    role: 'Owner',
    permissions: ROLE_PERMISSION_PRESETS.Owner,
    lastActive: '2024-06-19 09:30',
    status: 'active',
  },
  {
    id: 'member-2',
    name: '李雨晴',
    email: 'liyuqing@agency.com',
    avatar: getImageUrl('professional asian female business portrait'),
    role: 'Admin',
    permissions: ROLE_PERMISSION_PRESETS.Admin,
    lastActive: '2024-06-19 10:15',
    status: 'active',
  },
  {
    id: 'member-3',
    name: '王俊杰',
    email: 'wangjunjie@agency.com',
    avatar: getImageUrl('professional asian male casting manager portrait'),
    role: 'Casting Manager',
    permissions: ROLE_PERMISSION_PRESETS['Casting Manager'],
    lastActive: '2024-06-18 18:45',
    status: 'active',
  },
  {
    id: 'member-4',
    name: '陈思琪',
    email: 'chensiqi@agency.com',
    avatar: getImageUrl('professional asian female talent scout portrait'),
    role: 'Talent Scout',
    permissions: ROLE_PERMISSION_PRESETS['Talent Scout'],
    lastActive: '2024-06-19 08:00',
    status: 'active',
  },
  {
    id: 'member-5',
    name: '刘子轩',
    email: 'liuzixuan@agency.com',
    avatar: getImageUrl('professional asian male viewer portrait'),
    role: 'Viewer',
    permissions: ROLE_PERMISSION_PRESETS.Viewer,
    lastActive: '2024-06-15 14:20',
    status: 'invited',
  },
];

const mockContactRecords: ContactRecord[] = [
  {
    id: 'contact-1',
    date: '2024-06-19 14:30',
    contactType: 'meeting',
    artistId: 'artist-1',
    artistName: '林雨婷',
    teamMemberId: 'member-1',
    teamMemberName: '张明远',
    notes: '讨论时装周走秀安排，确认品牌合作意向。林雨婷对国际品牌合作很感兴趣。',
    followUpDate: '2024-06-21',
  },
  {
    id: 'contact-2',
    date: '2024-06-18 10:00',
    contactType: 'call',
    artistId: 'artist-5',
    artistName: '刘美娜',
    teamMemberId: 'member-3',
    teamMemberName: '王俊杰',
    notes: '确认上海时装周走秀时间，发送详细日程表。',
  },
  {
    id: 'contact-3',
    date: '2024-06-17 16:45',
    contactType: 'audition',
    artistId: 'artist-2',
    artistName: '陈浩然',
    teamMemberId: 'member-4',
    teamMemberName: '陈思琪',
    notes: '运动品牌代言人试镜，表现良好，进入复试。',
    followUpDate: '2024-06-20',
  },
  {
    id: 'contact-4',
    date: '2024-06-16 11:20',
    contactType: 'email',
    artistId: 'artist-7',
    artistName: '周雅琪',
    teamMemberId: 'member-2',
    teamMemberName: '李雨晴',
    notes: '发送珠宝品牌合作合同草案，等待确认。',
    followUpDate: '2024-06-23',
  },
  {
    id: 'contact-5',
    date: '2024-06-15 09:00',
    contactType: 'meeting',
    artistId: 'artist-3',
    artistName: '王思琪',
    teamMemberId: 'member-3',
    teamMemberName: '王俊杰',
    notes: '电商拍摄档期协调，确认下周三开始淘宝女装拍摄。',
  },
];

const mockArtists: AgencyArtist[] = [
  {
    id: 'artist-1',
    userId: 'user-artist-1',
    realName: '林雨婷',
    stageName: 'Yuting',
    age: 24,
    gender: 'female',
    height: 175,
    weight: 52,
    bust: 85,
    waist: 60,
    hips: 88,
    eyeColor: '棕色',
    hairColor: '黑色',
    languages: ['中文', '英语', '日语'],
    skills: ['T台走秀', '平面拍摄', '影视表演', '舞蹈', '钢琴'],
    location: '上海市',
    latitude: 31.2304,
    longitude: 121.4737,
    contractStatus: 'exclusive',
    agencyId: 'agency-1',
    mediaAssets: [],
    tags: [],
    contractType: 'exclusive',
    artistStatus: 'active',
    department: 'fashion',
    upcomingBookings: 5,
    revenueGenerated: 285000,
  },
  {
    id: 'artist-5',
    userId: 'user-artist-5',
    realName: '刘美娜',
    stageName: 'Mina',
    age: 23,
    gender: 'female',
    height: 178,
    weight: 54,
    bust: 88,
    waist: 62,
    hips: 90,
    eyeColor: '棕色',
    hairColor: '亚麻色',
    languages: ['中文', '英语'],
    skills: ['T台走秀', '平面拍摄', '舞蹈', '瑜伽', '茶艺'],
    location: '广州市',
    latitude: 23.1291,
    longitude: 113.2644,
    contractStatus: 'signed',
    agencyId: 'agency-1',
    mediaAssets: [],
    tags: [],
    contractType: 'signed',
    artistStatus: 'active',
    department: 'fashion',
    upcomingBookings: 3,
    revenueGenerated: 198000,
  },
  {
    id: 'artist-7',
    userId: 'user-artist-7',
    realName: '周雅琪',
    stageName: 'Grace',
    age: 27,
    gender: 'female',
    height: 172,
    weight: 50,
    bust: 84,
    waist: 59,
    hips: 87,
    eyeColor: '深棕色',
    hairColor: '黑色',
    languages: ['中文', '英语', '西班牙语'],
    skills: ['T台走秀', '平面拍摄', '珠宝展示', '高尔夫', '马术'],
    location: '成都市',
    latitude: 30.5728,
    longitude: 104.0668,
    contractStatus: 'signed',
    agencyId: 'agency-1',
    mediaAssets: [],
    tags: [],
    contractType: 'signed',
    artistStatus: 'active',
    department: 'commercial',
    upcomingBookings: 2,
    revenueGenerated: 156000,
  },
  {
    id: 'artist-2',
    userId: 'user-artist-2',
    realName: '陈浩然',
    stageName: 'Ryan',
    age: 26,
    gender: 'male',
    height: 188,
    weight: 75,
    bust: 100,
    waist: 80,
    hips: 96,
    eyeColor: '深棕色',
    hairColor: '黑色',
    languages: ['中文', '英语'],
    skills: ['T台走秀', '平面拍摄', '健身', '游泳', '篮球'],
    location: '北京市',
    latitude: 39.9042,
    longitude: 116.4074,
    contractStatus: 'signed',
    agencyId: 'agency-1',
    mediaAssets: [],
    tags: [],
    contractType: 'signed',
    artistStatus: 'active',
    department: 'fitness',
    upcomingBookings: 2,
    revenueGenerated: 142000,
  },
  {
    id: 'artist-3',
    userId: 'user-artist-3',
    realName: '王思琪',
    stageName: 'Suki',
    age: 22,
    gender: 'female',
    height: 168,
    weight: 48,
    bust: 82,
    waist: 58,
    hips: 86,
    eyeColor: '黑色',
    hairColor: '棕色',
    languages: ['中文', '韩语'],
    skills: ['平面拍摄', '淘宝直播', '美妆', '穿搭', '短视频拍摄'],
    location: '杭州市',
    latitude: 30.2741,
    longitude: 120.1551,
    contractStatus: 'available',
    agencyId: 'agency-1',
    mediaAssets: [],
    tags: [],
    contractType: 'available',
    artistStatus: 'active',
    department: 'commercial',
    upcomingBookings: 4,
    revenueGenerated: 98000,
  },
  {
    id: 'artist-4',
    userId: 'user-artist-4',
    realName: '张伟明',
    stageName: 'William',
    age: 28,
    gender: 'male',
    height: 185,
    weight: 72,
    bust: 98,
    waist: 78,
    hips: 94,
    eyeColor: '棕色',
    hairColor: '深棕色',
    languages: ['中文', '英语', '法语'],
    skills: ['T台走秀', '影视表演', '主持', '声乐', '吉他'],
    location: '深圳市',
    latitude: 22.5431,
    longitude: 114.0579,
    contractStatus: 'exclusive',
    agencyId: 'agency-1',
    mediaAssets: [],
    tags: [],
    contractType: 'exclusive',
    artistStatus: 'inactive',
    department: 'acting',
    upcomingBookings: 0,
    revenueGenerated: 88000,
  },
];

const mockApplicationTrend: ApplicationTrendPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    applications: Math.floor(Math.random() * 20) + 5,
    hires: Math.floor(Math.random() * 5) + 1,
  };
});

const mockArtistRankings: ArtistRanking[] = mockArtists
  .slice(0, 5)
  .map((a) => ({
    artist: a,
    bookingCount: Math.floor(Math.random() * 20) + 5,
    revenue: a.revenueGenerated,
  }))
  .sort((a, b) => b.bookingCount - a.bookingCount);

export const useAgencyStore = create<AgencyStore>((set) => ({
  stats: {
    totalArtists: 6,
    activeCastings: 4,
    pendingApplications: 23,
    monthlyRevenue: 967000,
  },
  teamMembers: mockTeamMembers,
  contactRecords: mockContactRecords,
  artists: mockArtists,
  applicationTrend: mockApplicationTrend,
  artistRankings: mockArtistRankings,

  addTeamMember: (member) => {
    set((state) => ({
      teamMembers: [...state.teamMembers, { ...member, id: generateId() }],
    }));
  },

  updateTeamMemberPermissions: (id, permissions) => {
    set((state) => ({
      teamMembers: state.teamMembers.map((m) =>
        m.id === id ? { ...m, permissions } : m
      ),
    }));
  },

  updateTeamMemberRole: (id, role) => {
    set((state) => ({
      teamMembers: state.teamMembers.map((m) =>
        m.id === id ? { ...m, role, permissions: ROLE_PERMISSION_PRESETS[role] } : m
      ),
    }));
  },

  addContactRecord: (record) => {
    set((state) => ({
      contactRecords: [{ ...record, id: generateId() }, ...state.contactRecords],
    }));
  },

  addArtist: (artist) => {
    set((state) => ({
      artists: [...state.artists, { ...artist, id: generateId() }],
      stats: { ...state.stats, totalArtists: state.stats.totalArtists + 1 },
    }));
  },

  updateArtist: (id, updates) => {
    set((state) => ({
      artists: state.artists.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },
}));

export default useAgencyStore;
