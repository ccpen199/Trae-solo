export type Language = 'zh' | 'en' | 'ja' | 'ko';
export type Currency = 'CNY' | 'HKD' | 'TWD' | 'JPY' | 'KRW' | 'USD' | 'SGD';
export type Region = 'mainland' | 'HKMT' | 'JP_KR' | 'SEA';
export type TicketGrade = 'VIP' | 'A' | 'B' | 'C' | 'S';
export type IssueType = 'FAKE_TICKET' | 'VERIFY_FAIL' | 'NO_TICKET_COMP' | 'PAYMENT_ANOMALY';
export type IssueStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'compensated' | 'failed';
export type PaymentChannel =
  | 'ALIPAY_PLUS'
  | 'VISA'
  | 'MASTERCARD'
  | 'GCASH'
  | 'PAYME'
  | 'LINEPAY'
  | 'PAYNOW'
  | 'PROMPTPAY';

export interface MultiLang {
  zh: string;
  en: string;
  ja?: string;
  ko?: string;
}

export interface Artist {
  id: string;
  name: MultiLang;
  avatar: string;
  heatIndex: number;
  genre: string;
  region: Region;
}

export interface Venue {
  id: string;
  name: MultiLang;
  city: MultiLang;
  region: Region;
  capacity: number;
  lng: number;
  lat: number;
}

export interface Organizer {
  id: string;
  name: MultiLang;
  logo: string;
  region: Region;
}

export interface Agent {
  id: string;
  name: MultiLang;
}

export type EventType = 'concert' | 'musical' | 'play' | 'festival' | 'exhibition';
export type EventStatus = 'upcoming' | 'on_sale' | 'ended';

export interface EventSummary {
  id: string;
  title: MultiLang;
  poster: string;
  region: Region;
  venueName: MultiLang;
  city: MultiLang;
  startTime: string;
  type: EventType;
  status: EventStatus;
  artistNames: MultiLang[];
  priceMin: number;
  priceMax: number;
  languages: Language[];
  currencies: Currency[];
  hotIndex: number;
}

export interface EventDetail extends EventSummary {
  organizerId: string;
  organizerName: MultiLang;
  agentId?: string;
  endTime: string;
  description: MultiLang;
  notice: MultiLang;
  tiers: TicketTier[];
}

export interface TicketTier {
  id: string;
  eventId: string;
  grade: TicketGrade;
  basePrice: number;
  currentPrice: number;
  deltaPct: number;
  totalSeats: number;
  soldSeats: number;
  hotIndex: number;
}

export interface Order {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: MultiLang;
  venueName: MultiLang;
  startTime: string;
  tierId: string;
  tierGrade: TicketGrade;
  seats: string[];
  quantity: number;
  currency: Currency;
  channel: PaymentChannel;
  status: OrderStatus;
  amountInCurrency: number;
  amountInCny: number;
  cryptoTag: string;
  createdAt: string;
  verified?: boolean;
  compensation?: {
    flight?: number;
    hotel?: number;
    total: number;
    status: 'requested' | 'approved' | 'paid';
  };
}

export interface TicketIssue {
  id: string;
  type: IssueType;
  summary: string;
  evidence?: string;
  relatedOrderId?: string;
  cryptoTag?: string | null;
  status: IssueStatus;
  eventId?: string;
  eventTitle: MultiLang;
  tierGrade?: string;
  region?: Region;
  compensationAmount: number;
  reporter?: string;
  paymentChannel?: PaymentChannel;
  createdAt: string;
  slaDeadline?: string;
}

export interface VerifyTerminal {
  id: string;
  venueId: string;
  venueName: MultiLang;
  terminalType: string;
  gateNo: string;
  online: boolean;
  signKey: string;
  todayScans: number;
  todayAnomalies: number;
  lastHeartbeat: string;
}

export interface PricingTick {
  ts: string;
  price: number;
  remaining: number;
  heat: number;
}

export interface PricingTierSeries {
  tierId: string;
  grade: TicketGrade;
  ticks: PricingTick[];
}

export interface IpGraphNode {
  id: string;
  name: MultiLang;
  kind: 'artist' | 'venue' | 'organizer' | 'agent';
  avgHotIndex?: number;
  totalGmv?: number;
  totalAttendance?: number;
  linkedOrganizers?: string[];
  linkedVenues?: string[];
  linkedArtists?: string[];
  region?: Region;
}

export interface IpGraphEdge {
  edgeId: string;
  sourceKind: 'artist' | 'venue' | 'organizer';
  targetKind: 'artist' | 'venue' | 'organizer';
  sourceId: string;
  targetId: string;
  kind: 'A_V' | 'A_O' | 'A_Agt' | 'O_V' | 'COLLAB';
  strength: number;
}

export interface IpGraph {
  artists: IpGraphNode[];
  venues: IpGraphNode[];
  organizers: IpGraphNode[];
  edges: IpGraphEdge[];
}

export interface CityFlow {
  id: string;
  fromCity: string;
  toCity: string;
  count: number;
  distanceKm: number;
  eventId: string;
  eventTitle: MultiLang;
  eventPoster: string;
}

export interface OrganizerReview {
  organizerId: string;
  organizerName: MultiLang;
  period: string;
  shows: number;
  ticketsTotal: number;
  selloutRate: number;
  gmv: number;
  complaintRate: number;
  radar: { dim: string; current: number; baseline: number }[];
  series: Record<string, number>[];
  revenue: { show: string; VIP: number; A: number; B: number; C: number }[];
  showsList?: {
    poster: string;
    title: MultiLang;
    date: string;
    sold: number;
    total: number;
    revenue: number;
    heat: number;
  }[];
}

export interface EventScheduleSummary {
  id: string;
  title: MultiLang;
  poster: string;
  region: Region;
  venueName: MultiLang;
  city: MultiLang;
  startTime: string;
  endTime: string;
  soldSeats: number;
  totalSeats: number;
  hotIndex: number;
}

export interface DashboardKpi {
  onSaleEvents: number;
  activeTiers: number;
  crossGMV: number;
  seatsSold: number;
  compensation: number;
  verifiedEntries: number;
  currencyBreakdown: { c: Currency; amount: number }[];
  pricingHeat: {
    eventId: string;
    title: MultiLang;
    deltaPct: number;
    heatIndex: number;
    remainingPct: number;
  }[];
  trendingArtists: { id: string; name: MultiLang; heatIndex: number; delta: number }[];
  topEvents: EventSummary[];
}

export interface UserTicket {
  id: string;
  eventTitle: string;
  eventPoster: string;
  venue: string;
  time: string;
  tierGrade: TicketGrade;
  section: string;
  row: string;
  seat: string;
  status: OrderStatus;
  cryptoTag: string;
  issueTime: string;
}

export interface ClaimRecord {
  id: string;
  reason: string;
  eventName: string;
  amount: number;
  flightAmount: number;
  hotelAmount: number;
  status: 'processing' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
}

export interface WalletTx {
  txId: string;
  type: 'deposit' | 'withdraw' | 'purchase' | 'refund' | 'compensation';
  desc: string;
  amount: number;
  positive: boolean;
  currency: Currency;
  channel: PaymentChannel;
  date: string;
}

export interface Wallet {
  walletId: string;
  balances: { currency: Currency; amount: number; cnyEquivalent: number }[];
  tx: WalletTx[];
}

export interface Profile {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  memberLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'black';
  memberPoints: number;
  totalSpent: number;
  kycStatus: 'none' | 'pending' | 'passed' | 'failed';
  joinedAt: string;
  tickets?: UserTicket[];
  claims?: ClaimRecord[];
}
