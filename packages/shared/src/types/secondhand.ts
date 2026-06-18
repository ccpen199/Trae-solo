import type { GeoLocation } from './common';

export type SecondhandStatus = 'draft' | 'on_sale' | 'reserved' | 'sold' | 'deleted';

export type SecondhandOrderStatus =
  | 'pending_payment'
  | 'paid_held'
  | 'buyer_confirmed'
  | 'seller_shipped'
  | 'buyer_received'
  | 'completed'
  | 'dispute'
  | 'refunding'
  | 'refunded'
  | 'cancelled';

export interface SecondhandListing {
  id: string;
  tenantId: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  images: string[];
  location?: GeoLocation;
  locationName?: string;
  allowDelivery: boolean;
  allowMeetup: boolean;
  meetupLocation?: string;
  tags?: string[];
  status: SecondhandStatus;
  viewCount: number;
  favoriteCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecondhandOrder {
  id: string;
  orderNo: string;
  tenantId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  serviceFee: number;
  totalAmount: number;
  sellerReceiveAmount: number;
  paymentMethod: 'wechat' | 'alipay';
  paymentStatus: 'unpaid' | 'paid_held' | 'released' | 'refunded';
  status: SecondhandOrderStatus;
  transactionId?: string;
  paidAt?: Date;
  escrowReleasedAt?: Date;
  deliveryType: 'delivery' | 'meetup';
  buyerNotes?: string;
  sellerNotes?: string;
  disputeReason?: string;
  disputeHandlerId?: string;
  disputeResolution?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecondhandFavorite {
  id: string;
  listingId: string;
  userId: string;
  createdAt: Date;
}

export interface EscrowTransaction {
  id: string;
  orderId: string;
  type: 'hold' | 'release' | 'refund';
  amount: number;
  fromAccount: string;
  toAccount: string;
  transactionId?: string;
  status: 'pending' | 'success' | 'failed';
  operatorId?: string;
  remark?: string;
  createdAt: Date;
}
