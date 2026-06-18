import type { GeoLocation } from './common';

export type ProductStatus = 'draft' | 'on_sale' | 'off_sale' | 'sold_out' | 'deleted';

export type ProductType = 'self_operated' | 'third_party' | 'partner';

export interface ProductCategory {
  id: string;
  tenantId?: string;
  parentId?: string;
  name: string;
  icon?: string;
  sortOrder: number;
  level: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  productType: ProductType;
  partnerId?: string;
  name: string;
  subtitle?: string;
  description: string;
  images: string[];
  mainImage: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  stock: number;
  soldCount: number;
  unit: string;
  weight?: number;
  isFreeShipping: boolean;
  shippingFee?: number;
  deliveryRadiusKm?: number;
  deliveryTypes: DeliveryType[];
  pickupPoints?: string[];
  status: ProductStatus;
  tags?: string[];
  sortOrder: number;
  isRecommend: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type DeliveryType = 'self_pickup' | 'warehouse_delivery' | 'property_pickup';

export interface ProductSku {
  id: string;
  productId: string;
  skuCode: string;
  specs: Record<string, string>;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  stock: number;
  image?: string;
  status: 'active' | 'inactive';
}

export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  location: GeoLocation;
  address: string;
  contactName?: string;
  contactPhone?: string;
  type: 'central' | 'community';
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface PickupPoint {
  id: string;
  tenantId: string;
  name: string;
  buildingId?: string;
  address: string;
  location?: GeoLocation;
  contactName?: string;
  contactPhone?: string;
  businessHours?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface InventoryRecord {
  id: string;
  warehouseId?: string;
  pickupPointId?: string;
  productId: string;
  skuId?: string;
  quantity: number;
  changeType: 'in' | 'out' | 'adjust' | 'return';
  relatedOrderId?: string;
  remark?: string;
  operatorId?: string;
  createdAt: Date;
}
