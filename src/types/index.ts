export interface PointsAccount {
  id: string;
  holderId: string;
  type: 'insurance' | 'bank' | 'airline' | 'telecom';
  sourceName: string;
  balance: number;
  frozen: number;
  expireSoon: number;
  unit: string;
  valueRate: number;
  lastSyncAt: string;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  appId: string;
  apiSecret: string;
  publicKey: string;
  privateKey: string;
  ipWhitelist: string[];
  rateLimit: number;
  profitShareRate: number;
  settledAmount: number;
  pendingAmount: number;
  createdAt: string;
}

export interface POSTerminal {
  id: string;
  terminalNo: string;
  nfcPairCode: string;
  beaconUUID: string;
  location: string;
  lastHeartbeat: string;
}

export interface Merchant {
  id: string;
  name: string;
  type: 'offline_pos' | 'online_ecom';
  status: 'active' | 'inactive';
  posTerminals: POSTerminal[];
  settlementCycle: string;
  totalVerified: number;
  totalRevenue: number;
}

export interface BenefitCost {
  points: number;
  cash: number;
  type: string;
}

export interface BenefitItem {
  id: string;
  name: string;
  category: string;
  coverImage: string;
  description: string;
  baseCost: BenefitCost[];
  stock: number;
  soldCount: number;
  rating: number;
  isHot: boolean;
}

export interface PointsDeducted {
  source: string;
  amount: number;
}

export interface OrderSignature {
  party: string;
  sig: string;
}

export interface ExchangeOrder {
  id: string;
  orderNo: string;
  holderId: string;
  benefitId: string;
  benefitName: string;
  pointsDeducted: PointsDeducted[];
  cashDeducted: number;
  status: 'pending' | 'locked' | 'completed' | 'refunded';
  blockchainHash: string;
  timestamp: string;
  signatures: OrderSignature[];
}

export interface ChainSignature {
  party: string;
  pubKey: string;
  sig: string;
}

export interface ChainRecord {
  hash: string;
  blockHeight: number;
  txId: string;
  orderNo: string;
  timestamp: string;
  action: 'exchange' | 'verify' | 'settle' | 'ar_mutual_aid';
  participants: string[];
  signatures: ChainSignature[];
  payloadHash: string;
}

export interface ContractRule {
  id: string;
  name: string;
  type: 'split_combine' | 'cash_stack' | 'ar_aid';
  description: string;
  rules: any;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoFence {
  id: string;
  name: string;
  shape: 'circle' | 'polygon';
  center?: LatLng;
  radius?: number;
  coordinates?: LatLng[];
  createdBy: string;
  infoCount: number;
}

export interface ARMutualAidInfo {
  id: string;
  title: string;
  content: string;
  type: 'help' | 'notice' | 'activity';
  publisherId: string;
  publisherName: string;
  fenceId: string;
  chainHash: string;
  status: 'pending' | 'published' | 'rejected' | 'expired';
  createdAt: string;
  expireAt: string;
}

export interface VerificationRecord {
  id: string;
  orderId: string;
  orderNo: string;
  couponCode: string;
  mode: 'qrcode' | 'nfc' | 'bluetooth_beacon';
  merchantId: string;
  terminalId: string;
  holderId: string;
  status: 'success' | 'failed' | 'already_used';
  verifiedAt: string;
  chainHash: string;
}

export interface HealthRadar {
  expireRate: number;
  exchangeRate: number;
  verifyRate: number;
  activity: number;
  settleRate: number;
}

export interface VolumeTrend {
  date: string;
  value: number;
}

export interface DashboardStats {
  todayVolume: number;
  activeUsers: number;
  totalChainRecords: number;
  partnerCount: number;
  totalAssetValue: number;
  verifyToday: number;
  warnCount: number;
  riskCount: number;
  volumeTrend: VolumeTrend[];
  healthRadar: HealthRadar;
}

export interface LiveTx {
  id: string;
  orderNo: string;
  action: string;
  amount: number;
  party: string;
  time: string;
  status: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: 'holder' | 'partner' | 'merchant' | 'admin';
  avatar: string;
}
