import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { VendorEntity } from '../../database/entities/vendor.entity';

@Injectable()
export class VendorAuthStrategy extends PassportStrategy(Strategy, 'vendor-auth') {
  constructor(
    @InjectRepository(VendorEntity) private readonly vendorRepo: Repository<VendorEntity>,
    private readonly jwtService: JwtService,
  ) {
    super();
  }

  async validate(req: any): Promise<any> {
    const authHeader = req.headers['authorization'];
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = this.jwtService.verify(token);
        if (payload.type === 'vendor') {
          return { type: 'vendor', vendorId: payload.sub, vendorName: payload.vendorName };
        }
      } catch {}
    }

    if (apiKey) {
      const vendor = await this.vendorRepo.findOne({ where: { apiKey } });
      if (vendor && vendor.status === 'active') {
        const isSecretValid = vendor.apiSecret === apiSecret ||
          require('bcrypt').compareSync(apiSecret, vendor.apiSecret);
        if (isSecretValid) {
          return { type: 'vendor', vendorId: vendor.id, vendorName: vendor.name };
        }
      }
    }

    throw new UnauthorizedException('Vendor authentication required');
  }
}
