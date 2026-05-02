import { v4 as uuidv4 } from 'uuid';

export enum BusinessOrderType {
  MEMBER_SIGNUP = 'MS',
  PACKAGE_PURCHASE = 'PP',
  RESERVATION = 'RS',
  CHECK_IN = 'CI',
  VERIFICATION = 'VF',
  WORK_ORDER = 'WO',
  TRANSACTION = 'TX',
  AUDIT = 'AD'
}

export class BusinessOrderService {
  static generateOrderNumber(type: BusinessOrderType): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${type}${year}${month}${day}${hours}${minutes}${seconds}${random}`;
  }

  static generateMemberCardNumber(): string {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    return `GM${year}${random}`;
  }

  static generateUUID(): string {
    return uuidv4();
  }

  static validateOrderNumber(orderNumber: string): boolean {
    const pattern = /^[A-Z]{2}\d{14}\d{4}$/;
    return pattern.test(orderNumber);
  }

  static getOrderType(orderNumber: string): BusinessOrderType | null {
    const typeCode = orderNumber.slice(0, 2);
    
    const typeMap: Record<string, BusinessOrderType> = {
      'MS': BusinessOrderType.MEMBER_SIGNUP,
      'PP': BusinessOrderType.PACKAGE_PURCHASE,
      'RS': BusinessOrderType.RESERVATION,
      'CI': BusinessOrderType.CHECK_IN,
      'VF': BusinessOrderType.VERIFICATION,
      'WO': BusinessOrderType.WORK_ORDER,
      'TX': BusinessOrderType.TRANSACTION,
      'AD': BusinessOrderType.AUDIT
    };
    
    return typeMap[typeCode] || null;
  }
}
