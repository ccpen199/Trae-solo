import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '智慧农场监测平台后端已启动';
  }
}
