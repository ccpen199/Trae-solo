export interface UserLocation {
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
}

export interface EducationTag {
  school: string;
  level: 'bachelor' | 'master' | 'phd' | 'other';
  major: string;
  graduationYear: number;
  verified: boolean;
}

export interface CareerTag {
  company: string;
  position: string;
  industry: string;
  yearsOfExperience: number;
  verified: boolean;
}

export interface UserVerification {
  realName: string;
  idCardLast4: string;
  verifiedAt: Date | null;
  verified: boolean;
  faceVerified: boolean;
}

export interface CreditRecord {
  id: string;
  type: 'activity_feedback' | 'report_punish' | 'whistle_violation' | 'redpacket_abuse' | 'match_abuse' | 'initial_score';
  scoreChange: number;
  reason: string;
  relatedId?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  gender: 'male' | 'female' | 'unknown';
  age: number;
  bio: string;
  phone: string;
  email?: string;
  location: UserLocation;
  verification: UserVerification;
  education: EducationTag;
  career: CareerTag;
  interestTags: string[];
  creditScore: number;
  creditRecords: CreditRecord[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  privacySettings: {
    showRealName: boolean;
    showEducation: boolean;
    showCareer: boolean;
    showLocation: boolean;
    allowMatch: boolean;
  };
  createdAt: Date;
  lastActiveAt: Date;
}

export type UserProfile = Omit<User, 'phone' | 'verification' | 'email' | 'emergencyContact'>;

export interface UserCreateInput {
  nickname: string;
  avatar: string;
  gender: 'male' | 'female' | 'unknown';
  age: number;
  phone: string;
  bio?: string;
  location: Omit<UserLocation, 'lastUpdated'>;
  education: EducationTag;
  career: CareerTag;
  interestTags: string[];
  emergencyContact?: User['emergencyContact'];
}
