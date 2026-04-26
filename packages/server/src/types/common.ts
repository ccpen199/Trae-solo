export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  PLATFORM_ADMIN = 'platform_admin',
  MANUFACTURER_ADMIN = 'manufacturer_admin',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  RETAIL_STORE_OWNER = 'retail_store_owner',
  RETAIL_STORE_STAFF = 'retail_store_staff',
  FARMER = 'farmer',
  EXPERT = 'expert',
  CUSTOMER_SERVICE = 'customer_service',
}

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING_PAYMENT = 'pending_payment',
  PENDING_CREDIT_APPROVAL = 'pending_credit_approval',
  CREDIT_APPROVED = 'credit_approved',
  CREDIT_REJECTED = 'credit_rejected',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  IN_DISPUTE = 'in_dispute',
}

export enum PickupRequestStatus {
  PENDING = 'pending',
  PENDING_CREDIT_CHECK = 'pending_credit_check',
  CREDIT_APPROVED = 'credit_approved',
  CREDIT_REJECTED = 'credit_rejected',
  ASSIGNED_TO_WAREHOUSE = 'assigned_to_warehouse',
  INVENTORY_UPDATED = 'inventory_updated',
  LOGISTICS_CREATED = 'logistics_created',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum LogisticsStatus {
  CREATED = 'created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  ARRIVED_AT_WAREHOUSE = 'arrived_at_warehouse',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  DELAYED = 'delayed',
  LOST = 'lost',
}

export enum CreditApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  AWAITING_EXPERT = 'awaiting_expert',
  EXPERT_REVIEWED = 'expert_reviewed',
  AWAITING_EVIDENCE = 'awaiting_evidence',
  EVIDENCE_SUBMITTED = 'evidence_submitted',
  RESOLVED_PAID = 'resolved_paid',
  RESOLVED_REFUND = 'resolved_refund',
  RESOLVED_PARTIAL = 'resolved_partial',
  CLOSED = 'closed',
}

export enum PricePolicyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

export enum InventoryStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  DAMAGED = 'damaged',
  EXPIRED = 'expired',
  IN_TRANSIT = 'in_transit',
}

export enum CreditAccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  OVERDUE = 'overdue',
  DEFAULTED = 'defaulted',
  CLOSED = 'closed',
}

export enum TraceabilityEventType {
  PRODUCTION = 'production',
  QUALITY_CHECK = 'quality_check',
  WAREHOUSE_IN = 'warehouse_in',
  WAREHOUSE_OUT = 'warehouse_out',
  LOGISTICS_START = 'logistics_start',
  LOGISTICS_CHECKPOINT = 'logistics_checkpoint',
  LOGISTICS_END = 'logistics_end',
  RETAIL_SALE = 'retail_sale',
  COMPLAINT = 'complaint',
  DISPUTE = 'dispute',
  RESOLUTION = 'resolution',
}
