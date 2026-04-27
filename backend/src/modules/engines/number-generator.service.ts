import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NumberGeneratorService {
  private readonly prefixes = {
    style: 'ST',
    pattern: 'PT',
    bom: 'BM',
    purchaseOrder: 'PO',
    productionOrder: 'WO',
    materialReceipt: 'MR',
    notification: 'NT',
    communication: 'CM',
    issue: 'ISS',
  };

  generateStyleNumber(year?: number): string {
    const y = year || new Date().getFullYear();
    const random = this.generateRandomString(6);
    return `${this.prefixes.style}${y}${random}`;
  }

  generatePatternNumber(styleNumber?: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = this.generateRandomString(4);
    if (styleNumber) {
      return `${styleNumber}-${this.prefixes.pattern}${timestamp}${random}`;
    }
    return `${this.prefixes.pattern}${timestamp}${random}`;
  }

  generateBomNumber(styleNumber?: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = this.generateRandomString(4);
    if (styleNumber) {
      return `${styleNumber}-${this.prefixes.bom}${timestamp}${random}`;
    }
    return `${this.prefixes.bom}${timestamp}${random}`;
  }

  generatePurchaseOrderNumber(): string {
    const dateStr = this.formatDate(new Date());
    const random = this.generateRandomString(6);
    return `${this.prefixes.purchaseOrder}${dateStr}${random}`;
  }

  generateProductionOrderNumber(): string {
    const dateStr = this.formatDate(new Date());
    const random = this.generateRandomString(6);
    return `${this.prefixes.productionOrder}${dateStr}${random}`;
  }

  generateMaterialReceiptNumber(): string {
    const dateStr = this.formatDate(new Date());
    const random = this.generateRandomString(6);
    return `${this.prefixes.materialReceipt}${dateStr}${random}`;
  }

  generateIssueNumber(): string {
    const dateStr = this.formatDate(new Date());
    const random = this.generateRandomString(6);
    return `${this.prefixes.issue}${dateStr}${random}`;
  }

  generateMessageNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = this.generateRandomString(4);
    return `${this.prefixes.communication}${timestamp}${random}`;
  }

  generateUuid(): string {
    return uuidv4();
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
