import { v4 as uuidv4 } from 'uuid';

export class NumberGeneratorService {
  private static instance: NumberGeneratorService;
  private counter: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): NumberGeneratorService {
    if (!NumberGeneratorService.instance) {
      NumberGeneratorService.instance = new NumberGeneratorService();
    }
    return NumberGeneratorService.instance;
  }

  generateUUID(): string {
    return uuidv4();
  }

  generateMasterNo(prefix: string = 'AWB'): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = this.getRandomNumber(6);
    return `${prefix}${year}${month}${day}${random}`;
  }

  generateBookingNo(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = this.getRandomNumber(6);
    return `BK${year}${month}${day}${random}`;
  }

  generateDetailNo(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = this.getRandomNumber(6);
    return `DT${year}${month}${day}${random}`;
  }

  generateTodoNo(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = this.getRandomNumber(6);
    return `TD${year}${month}${day}${random}`;
  }

  generateCheckNo(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = this.getRandomNumber(6);
    return `SC${year}${month}${day}${random}`;
  }

  generateSpaceNo(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = this.getRandomNumber(6);
    return `SP${year}${month}${day}${random}`;
  }

  generateFlightNo(airlineCode: string): string {
    const random = this.getRandomNumber(4);
    return `${airlineCode}${random}`;
  }

  private getRandomNumber(length: number): string {
    const max = Math.pow(10, length);
    const random = Math.floor(Math.random() * max);
    return random.toString().padStart(length, '0');
  }

  generateTimestampId(): string {
    const now = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${now}${random.toString().padStart(4, '0')}`;
  }
}

export const numberGenerator = NumberGeneratorService.getInstance();
