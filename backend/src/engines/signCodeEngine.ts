export interface SignCodeInfo {
  code: string;
  packageId: string;
  receiverPhone: string;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  packageInfo?: {
    trackingNumber: string;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
  };
}

export class SignCodeEngine {
  private static activeCodes: Map<string, SignCodeInfo> = new Map();
  
  static generatePickupCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    const letterPart = Array.from({ length: 2 }, () => 
      letters.charAt(Math.floor(Math.random() * letters.length))
    ).join('');
    
    const numberPart = Array.from({ length: 4 }, () => 
      numbers.charAt(Math.floor(Math.random() * numbers.length))
    ).join('');
    
    return `${letterPart}${numberPart}`;
  }

  static generateSignCode(): string {
    return Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 10).toString()
    ).join('');
  }

  static createSignCode(
    packageId: string,
    receiverPhone: string,
    validityMinutes: number = 30
  ): SignCodeInfo {
    const code = this.generateSignCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000);

    const codeInfo: SignCodeInfo = {
      code,
      packageId,
      receiverPhone,
      createdAt: now,
      expiresAt,
      isUsed: false
    };

    this.activeCodes.set(`${packageId}_${code}`, codeInfo);
    
    setTimeout(() => {
      this.activeCodes.delete(`${packageId}_${code}`);
    }, validityMinutes * 60 * 1000);

    return codeInfo;
  }

  static verifySignCode(
    packageId: string,
    code: string,
    receiverPhone?: string
  ): VerificationResult {
    const key = `${packageId}_${code}`;
    const codeInfo = this.activeCodes.get(key);

    if (!codeInfo) {
      return {
        success: false,
        message: '签收码无效或已过期'
      };
    }

    if (codeInfo.isUsed) {
      return {
        success: false,
        message: '签收码已被使用'
      };
    }

    if (new Date() > codeInfo.expiresAt) {
      this.activeCodes.delete(key);
      return {
        success: false,
        message: '签收码已过期'
      };
    }

    if (receiverPhone && codeInfo.receiverPhone !== receiverPhone) {
      return {
        success: false,
        message: '手机号与签收码不匹配'
      };
    }

    codeInfo.isUsed = true;
    codeInfo.usedAt = new Date();

    return {
      success: true,
      message: '签收码验证成功'
    };
  }

  static verifyPickupCode(
    pickupCode: string,
    storedPickupCode: string,
    receiverPhone?: string,
    storedPhone?: string
  ): VerificationResult {
    if (!pickupCode || pickupCode.trim() !== storedPickupCode) {
      return {
        success: false,
        message: '取件码错误'
      };
    }

    if (receiverPhone && storedPhone && receiverPhone !== storedPhone) {
      const lastFour = storedPhone.slice(-4);
      if (!receiverPhone.endsWith(lastFour)) {
        return {
          success: false,
          message: '手机号验证失败'
        };
      }
    }

    return {
      success: true,
      message: '取件码验证成功'
    };
  }

  static getActiveCode(packageId: string, code: string): SignCodeInfo | null {
    const key = `${packageId}_${code}`;
    return this.activeCodes.get(key) || null;
  }

  static invalidateCode(packageId: string, code: string): void {
    const key = `${packageId}_${code}`;
    this.activeCodes.delete(key);
  }

  static clearExpiredCodes(): number {
    const now = new Date();
    let cleared = 0;

    for (const [key, codeInfo] of this.activeCodes.entries()) {
      if (now > codeInfo.expiresAt) {
        this.activeCodes.delete(key);
        cleared++;
      }
    }

    return cleared;
  }
}

export default SignCodeEngine;
