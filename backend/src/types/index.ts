import { Request } from 'express';
import { User } from '../entities';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BookingRequest {
  originAirport: string;
  destinationAirport: string;
  shipperName: string;
  shipperPhone?: string;
  shipperAddress?: string;
  consigneeName: string;
  consigneePhone?: string;
  consigneeAddress?: string;
  airlineCode?: string;
  flightId?: string;
  expectedDepartureDate?: Date;
  expectedArrivalDate?: Date;
  goodsDescription?: string;
  goodsType?: string;
  isDangerous?: boolean;
  dangerousGoodsInfo?: string;
  priority?: string;
  remark?: string;
  details: WaybillDetailRequest[];
  attachments?: AttachmentRequest[];
}

export interface WaybillDetailRequest {
  lineNo: number;
  goodsName: string;
  goodsCode?: string;
  goodsType?: string;
  pieces: number;
  unit?: string;
  weight: number;
  volume?: number;
  length?: number;
  width?: number;
  height?: number;
  isDangerous?: boolean;
  dangerousClass?: string;
  unNumber?: string;
  packingType?: string;
  markNo?: string;
  description?: string;
}

export interface AttachmentRequest {
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  fileType?: string;
  category?: string;
  description?: string;
}

export interface ReceivingRequest {
  waybillId: string;
  spaceId: string;
  details: ReceivingDetailRequest[];
  remark?: string;
}

export interface ReceivingDetailRequest {
  detailId: string;
  actualPieces: number;
  actualWeight: number;
  actualVolume?: number;
  remark?: string;
}

export interface SecurityCheckRequest {
  waybillId: string;
  detailIds?: string[];
  result: string;
  checkLevel?: string;
  checkLocation?: string;
  checkMethod?: string;
  findings?: string;
  rejectReason?: string;
  rejectCategory?: string;
  supplementRequirements?: string;
  reassignedToId?: string;
  reassignedToName?: string;
  reassignmentReason?: string;
  isDangerousGoods?: boolean;
  dangerousGoodsClass?: string;
  dangerousGoodsUnNo?: string;
  dangerousGoodsDescription?: string;
  specialHandlingInstructions?: string;
  remark?: string;
}

export interface LoadingRequest {
  waybillId: string;
  flightId: string;
  actualWeight?: number;
  actualVolume?: number;
  remark?: string;
}

export interface ArrivalRequest {
  waybillId: string;
  actualArrivalTime?: Date;
  remark?: string;
}

export interface PickupRequest {
  waybillId: string;
  pickupTime?: Date;
  pickupBy?: string;
  remark?: string;
}

export interface CommentRequest {
  waybillId: string;
  type?: string;
  relatedNode?: string;
  content: string;
  approvalResult?: string;
  rejectReason?: string;
  isInternal?: boolean;
  attachments?: AttachmentRequest[];
}

export interface TodoRequest {
  waybillId: string;
  relatedNode: string;
  relatedAction?: string;
  assigneeId: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
}

export interface NotificationRequest {
  type?: string;
  channel?: string;
  priority?: string;
  recipientId: string;
  waybillId?: string;
  title: string;
  content?: string;
  actionUrl?: string;
  actionText?: string;
}

export enum BusinessNode {
  BOOKING = 'booking',
  RECEIVING = 'receiving',
  SECURITY = 'security',
  LOADING = 'loading',
  IN_TRANSIT = 'in_transit',
  ARRIVAL = 'arrival',
  PICKUP = 'pickup',
  COMPLETION = 'completion',
}

export enum LoadingActionType {
  PASS = 'pass',
  REJECT = 'reject',
  SUPPLEMENT = 'supplement',
  REASSIGN = 'reassign',
}

export enum ExceptionType {
  LOCATION_DRIFT = 'location_drift',
  ROUTE_DEVIATION = 'route_deviation',
  DRIVER_REJECT = 'driver_reject',
  ARRIVAL_NOT_CONFIRMED = 'arrival_not_confirmed',
  MAP_CALLBACK_DELAY = 'map_callback_delay',
  OTHER = 'other',
}
