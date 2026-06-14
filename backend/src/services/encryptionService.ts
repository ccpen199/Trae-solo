import CryptoJS from "crypto-js";
import config from "../config";

class EncryptionService {
  private secretKey: string;
  private iv: string;

  constructor() {
    this.secretKey = config.encryptionKey;
    this.iv = config.encryptionIv;
  }

  encrypt(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.secretKey, {
        iv: CryptoJS.enc.Hex.parse(this.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      return encrypted.toString();
    } catch (error) {
      throw new Error("数据加密失败");
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.secretKey, {
        iv: CryptoJS.enc.Hex.parse(this.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error("数据解密失败");
    }
  }

  encryptObject<T extends object>(data: T): string {
    return this.encrypt(JSON.stringify(data));
  }

  decryptObject<T>(encryptedData: string): T {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted) as T;
  }

  hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  maskIdCard(idCard: string): string {
    if (idCard.length !== 18) return idCard;
    return idCard.substring(0, 6) + "********" + idCard.substring(14);
  }

  maskPhone(phone: string): string {
    if (phone.length !== 11) return phone;
    return phone.substring(0, 3) + "****" + phone.substring(7);
  }
}

export default new EncryptionService();
