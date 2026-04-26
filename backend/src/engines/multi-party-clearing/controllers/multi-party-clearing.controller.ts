import { Controller, Post, Get, Body, Param, Request } from '@nestjs/common';
import { MultiPartyClearingEngine } from '../services/multi-party-clearing-engine.service';
import { SettlementDto } from '../dto/multi-party-clearing.dto';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('多方清分引擎')
@ApiBearerAuth()
@Controller('engine/clearing')
export class MultiPartyClearingController {
  constructor(private multiPartyClearingEngine: MultiPartyClearingEngine) {}

  @Get('orders/:orderId/tolerance-check')
  @ApiOperation({ summary: '检查订单重量容差' })
  async checkWeightTolerance(@Param('orderId') orderId: string) {
    return this.multiPartyClearingEngine.checkWeightTolerance(orderId);
  }

  @Get('orders/:orderId/calculate')
  @Roles(Role.FINANCE, Role.OPERATOR)
  @ApiOperation({ summary: '计算清分结果（预览）' })
  async calculateClearing(@Param('orderId') orderId: string) {
    return this.multiPartyClearingEngine.calculateClearing(orderId);
  }

  @Post('settle')
  @Roles(Role.FINANCE)
  @ApiOperation({ summary: '执行结算' })
  async executeSettlement(
    @Request() req,
    @Body() dto: SettlementDto,
  ) {
    return this.multiPartyClearingEngine.executeSettlement(
      dto,
      req.user.id,
      req.user.realName,
      req.user.role
    );
  }

  @Post('orders/:orderId/process-overdue')
  @Roles(Role.FINANCE, Role.OPERATOR)
  @ApiOperation({ summary: '处理逾期订单（货权转移）' })
  async processOverdueOrder(@Param('orderId') orderId: string) {
    return this.multiPartyClearingEngine.processOverdueOrder(orderId);
  }
}
