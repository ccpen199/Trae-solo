export interface Waybill {
  id: string;
  waybillNo: string;
  status: 'pending' | 'picked' | 'in_transit' | 'arrived' | 'delivered' | 'exception';
  sender: Address;
  receiver: Address;
  cargo: CargoInfo;
  appointmentTime: {
    date: string;
    timeWindow: string;
  };
  freight: number;
  createTime: string;
  priority: 'normal' | 'high' | 'urgent';
  isGreenChannel: boolean;
  customerId: string;
  customerName: string;
  currentLocation?: string;
  estimatedArrival?: string;
  trackingNodes: TrackingNode[];
  photos: string[];
}

export interface Address {
  name: string;
  phone: string;
  company?: string;
  province: string;
  city: string;
  district: string;
  address: string;
  isDefault?: boolean;
  id?: string;
}

export interface CargoInfo {
  name: string;
  type: string;
  weight: number;
  volume: number;
  quantity: number;
  value: number;
  temperatureControlled?: boolean;
  temperatureRange?: string;
  fragile?: boolean;
  hazardous?: boolean;
  remark?: string;
}

export interface TrackingNode {
  time: string;
  location: string;
  status: string;
  description: string;
  operator?: string;
  photo?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleNo: string;
  vehicleType: string;
  capacity: number;
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'idle' | 'loading' | 'in_transit' | 'unloading' | 'rest';
  currentOrders: number;
  totalLoad: number;
  todayCompleted: number;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  creditLimit: number;
  usedCredit: number;
  level: 'normal' | 'silver' | 'gold' | 'diamond';
  monthlySettlement: boolean;
  accountNo: string;
  createTime: string;
  address: Address[];
}

export interface FreightRule {
  id: string;
  name: string;
  basePrice: number;
  weightPrice: number;
  volumePrice: number;
  minCharge: number;
  steps: {
    minWeight: number;
    maxWeight?: number;
    pricePerKg: number;
  }[];
  expressType: 'standard' | 'fast' | 'overnight';
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  amount: number;
  type: 'vat' | 'normal';
  title: string;
  taxNo: string;
  status: 'pending' | 'issued' | 'mailed';
  createTime: string;
  issueTime?: string;
  waybillNos: string[];
}

export interface Statement {
  id: string;
  statementNo: string;
  period: string;
  totalAmount: number;
  paidAmount: number;
  status: 'unpaid' | 'partial' | 'paid';
  createTime: string;
  dueDate: string;
  waybillCount: number;
}

export interface CustomsDeclaration {
  id: string;
  declarationNo: string;
  waybillNo: string;
  status: 'draft' | 'submitted' | 'reviewing' | 'cleared' | 'rejected';
  customsCode: string;
  goodsDescription: string;
  hsCode: string;
  declaredValue: number;
  currency: string;
  submitTime?: string;
  clearTime?: string;
  remark?: string;
}

export interface SystemAlert {
  id: string;
  type: 'delay' | 'exception' | 'credit' | 'customs';
  level: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  relatedWaybillNo?: string;
  relatedCustomerId?: string;
  time: string;
  isRead: boolean;
}

export interface GpsPoint {
  time: string;
  lat: number;
  lng: number;
  speed: number;
  address: string;
}
