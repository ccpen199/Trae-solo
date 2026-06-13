import {
  DeviceCategory,
  DeviceConnectivity,
  DeviceStatus,
  DeviceCapability,
  SharePermission,
} from '../enums/device.enum';
import { VendorAuthType } from '../enums/vendor.enum';

export interface IDeviceProperty {
  key: string;
  value: any;
  unit?: string;
  updatedAt: Date;
}

export interface IDeviceCapability {
  capability: DeviceCapability;
  name: string;
  readable: boolean;
  writable: boolean;
  range?: { min?: number; max?: number; step?: number };
  options?: { label: string; value: any }[];
}

export interface IAbstractDevice {
  id: string;
  name: string;
  vendorId: string;
  vendorName: string;
  vendorDeviceId: string;
  category: DeviceCategory;
  model: string;
  connectivity: DeviceConnectivity[];
  status: DeviceStatus;
  firmwareVersion: string;
  properties: IDeviceProperty[];
  capabilities: IDeviceCapability[];
  roomId?: string;
  homeId?: string;
  lastSeen: Date;
}

export interface IVendor {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  authType: VendorAuthType;
  apiKey?: string;
  apiSecret?: string;
  whitelistEnabled: boolean;
  allowedIpRanges?: string[];
  rateLimit?: number;
  deviceCount: number;
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
}

export interface IDeviceShare {
  id: string;
  deviceId: string;
  ownerId: string;
  shareeId: string;
  permission: SharePermission;
  expiredAt?: Date;
  createdAt: Date;
}

export interface IRoom {
  id: string;
  homeId: string;
  name: string;
  sortOrder: number;
}

export interface IHome {
  id: string;
  name: string;
  address?: string;
  ownerId: string;
}
