export interface User {
  id: number
  phone: string
  passwordHash: string
  realName: string
  idCard: string
  role: 'user' | 'organizer' | 'admin'
  creditScore: number
  zhimaUserId?: string
  createdAt: string
}

export interface AuthUser {
  id: number
  role: string
}

export interface Organizer {
  id: number
  userId: number
  companyName: string
  license: string
  contactName: string
  contactPhone: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  createdAt: string
}

export interface OrganizerApplication {
  id: number
  organizerId: number
  companyName: string
  license: string
  contactName: string
  contactPhone: string
  documents: string
  status: 'pending' | 'approved' | 'rejected'
  reviewReason?: string
  reviewedAt?: string
  createdAt: string
}

export interface Event {
  id: number
  organizerId: number
  title: string
  category: 'concert' | 'drama' | 'talkshow' | 'other'
  description?: string
  venue: string
  poster?: string
  status: 'draft' | 'published' | 'cancelled' | 'ended'
  createdAt: string
}

export interface Showtime {
  id: number
  eventId: number
  startTime: string
  saleStartTime: string
  presaleStartTime?: string
  totalSeats: number
  availableSeats: number
  status: 'presale' | 'on_sale' | 'sold_out' | 'ended' | 'upcoming'
  createdAt: string
}

export interface Zone {
  id: number
  showtimeId: number
  name: string
  color: string
  rows: number
  cols: number
  seatLayout: string
  sortOrder: number
}

export interface Seat {
  id: number
  zoneId: number
  rowNum: number
  colNum: number
  seatLabel: string
  status: 'available' | 'held' | 'sold' | 'disabled'
  pricingTierId?: number
  showtimeId: number
}

export interface PricingTier {
  id: number
  showtimeId: number
  name: string
  tierType: 'early_bird' | 'presale' | 'full' | 'discount' | 'vip'
  price: number
  validFrom?: string
  validTo?: string
  quota: number
  sold: number
}

export interface Order {
  id: number
  userId: number
  orderNo: string
  totalAmount: number
  paymentMethod: 'direct' | 'credit'
  paymentStatus: 'pending' | 'paid' | 'credit_held' | 'refunded' | 'failed'
  zhimaAuthCode?: string
  creditDeductedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Ticket {
  id: number
  orderId: number
  seatId: number
  showtimeId: number
  userId: number
  pricingTierId?: number
  antiFakeCode: string
  blockchainHash?: string
  status: 'valid' | 'used' | 'refunded' | 'expired'
  createdAt: string
}

export interface RefundRecord {
  id: number
  ticketId: number
  orderId: number
  refundAmount: number
  feeAmount: number
  reason?: string
  reasonCategory: 'schedule_change' | 'personal' | 'health' | 'duplicate' | 'other'
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdAt: string
}

export interface CheckinRecord {
  id: number
  ticketId: number
  gateId?: string
  checkedInAt: string
}

export interface QueueEntry {
  id: number
  queueId: string
  userId: number
  showtimeId: number
  position: number
  priorityWeight: number
  status: 'waiting' | 'processing' | 'success' | 'failed'
  seatHolds?: string
  createdAt: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}
