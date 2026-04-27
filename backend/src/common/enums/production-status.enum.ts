export enum ProductionOrderStatus {
  DRAFT = 'draft',
  PENDING_MATERIALS = 'pending_materials',
  MATERIALS_READY = 'materials_ready',
  PENDING_SCHEDULING = 'pending_scheduling',
  SCHEDULED = 'scheduled',
  IN_PRODUCTION = 'in_production',
  QUALITY_CHECK = 'quality_check',
  PENDING_SHIPMENT = 'pending_shipment',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}
