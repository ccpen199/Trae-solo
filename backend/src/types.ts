export interface User {
  id: string;
  name: string;
  company: string;
  role: 'cargo_owner' | 'ship_owner' | 'forwarder' | 'container_operator' | 'special_transport' | 'admin';
  email: string;
  phone?: string;
  qualifications?: string;
  created_at?: string;
}

export interface Vessel {
  id: string;
  name: string;
  imo?: string;
  type: string;
  dwt?: number;
  teu?: number;
  built_year?: number;
  flag?: string;
  speed?: number;
  status: string;
  owner_id?: string;
  current_port?: string;
  latitude?: number;
  longitude?: number;
  specs?: Record<string, any>;
  created_at?: string;
}

export interface Voyage {
  id: string;
  vessel_id: string;
  voyage_number: string;
  origin_port: string;
  destination_port: string;
  etd: string;
  eta: string;
  status: string;
  available_teu?: number;
  available_weight?: number;
  container_types?: string[];
  base_rate?: number;
  carbon_estimate?: number;
  compliance_certificates?: string[];
  created_at?: string;
}

export interface CargoBooking {
  id: string;
  cargo_owner_id: string;
  voyage_id?: string;
  cargo_type: string;
  weight: number;
  teu: number;
  origin_port: string;
  destination_port: string;
  earliest_departure?: string;
  latest_arrival?: string;
  budget_rate?: number;
  status: string;
  special_requirements?: string[];
  compliance_docs?: string[];
  created_at?: string;
}

export interface VesselListing {
  id: string;
  vessel_id: string;
  seller_id: string;
  price: number;
  currency: string;
  description?: string;
  status: string;
  due_diligence_docs?: string[];
  inspection_date?: string;
  created_at?: string;
}

export interface MatchResult {
  booking: CargoBooking;
  voyages: Array<{
    voyage: Voyage;
    vessel: Vessel;
    score: number;
    reasons: string[];
    estimated_rate: number;
    carbon_estimate: number;
  }>;
}

export interface Order {
  id: string;
  order_number: string;
  cargo_booking_id?: string;
  spot_container_id?: string;
  bid_slot_id?: string;
  buyer_id: string;
  seller_id: string;
  order_type: string;
  amount: number;
  currency: string;
  status: string;
  contract_signed: boolean;
  bill_of_lading?: string;
  tracking_data?: Record<string, any>;
  payment_status: string;
  created_at?: string;
  updated_at?: string;
}
