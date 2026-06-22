export type ActivityStatus = 'draft' | 'recruiting' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';

export type ActivityCategory =
  | 'food'
  | 'sports'
  | 'movie'
  | 'travel'
  | 'study'
  | 'game'
  | 'music'
  | 'art'
  | 'outdoor'
  | 'party'
  | 'other';

export interface ActivityLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
}

export interface ActivityParticipant {
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'attended' | 'no_show';
  appliedAt: Date;
  reviewedAt?: Date;
  reviewNote?: string;
  feedbackScore?: number;
  feedbackComment?: string;
  feedbackAt?: Date;
}

export interface ActivityCoupon {
  couponId: string;
  couponName: string;
  originalPrice: number;
  discountedPrice: number;
  redemptionStatus: 'pending' | 'redeemed' | 'expired' | 'refunded';
  redeemedAt?: Date;
  provider: 'xiaohu_preferred';
  externalOrderId?: string;
}

export interface Activity {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: ActivityCategory;
  tags: string[];
  location: ActivityLocation;
  startTime: Date;
  endTime: Date;
  meetingTime: Date;
  maxParticipants: number;
  minParticipants: number;
  feePerPerson: number;
  genderPreference: 'any' | 'male_only' | 'female_only' | 'balanced';
  ageRange: {
    min: number;
    max: number;
  };
  minCreditScore: number;
  educationPreference?: string[];
  careerPreference?: string[];
  status: ActivityStatus;
  participants: ActivityParticipant[];
  coupons?: ActivityCoupon[];
  coverImage?: string;
  images: string[];
  riskFlags: {
    flagged: boolean;
    reason?: string;
    flaggedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
}

export interface ActivityCreateInput {
  title: string;
  description: string;
  category: ActivityCategory;
  tags?: string[];
  location: ActivityLocation;
  startTime: Date | string;
  endTime: Date | string;
  meetingTime: Date | string;
  maxParticipants: number;
  minParticipants?: number;
  feePerPerson?: number;
  genderPreference?: Activity['genderPreference'];
  ageRange?: Activity['ageRange'];
  minCreditScore?: number;
  educationPreference?: string[];
  careerPreference?: string[];
  coverImage?: string;
  images?: string[];
  couponId?: string;
}
