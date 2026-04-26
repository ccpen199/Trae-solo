import { Controller, Post, Body, Request } from '@nestjs/common';
import { PriceAdjustmentEngine } from '../services/price-adjustment-engine.service';
import { PriceAdjustmentDto } from '../dto/price-adjustment.dto';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('二次调价引擎')
@ApiBearerAuth()
@Controller('engine/price-adjustment')
export class PriceAdjustmentController {
  constructor(private priceAdjustmentEngine: PriceAdjustmentEngine) {}

  @Post('calculate')
  @Roles(Role.OPERATOR, Role.FINANCE)
  @ApiOperation({ summary: '计算二次调价结果（预览）' })
  async calculate(
    @Body() dto: PriceAdjustmentDto,
  ) {
    return this.priceAdjustmentEngine.calculatePriceAdjustment(
      dto.subOrderId,
      dto.gradePrices
    );
  }

  @Post('execute')
  @Roles(Role.OPERATOR, Role.FINANCE)
  @ApiOperation({ summary: '执行二次调价' })
  async execute(
    @Request() req,
    @Body() dto: PriceAdjustmentDto,
  ) {
    return this.priceAdjustmentEngine.executePriceAdjustment(
      dto,
      req.user.id,
      req.user.realName,
      req.user.role
    );
  }
}
