import { Controller, Post, Get, Body, Param, Request } from '@nestjs/common';
import { ColdChainExceptionEngine } from '../services/cold-chain-exception-engine.service';
import { ColdChainRecordDto, ColdChainExceptionDto } from '../dto/cold-chain-exception.dto';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../modules/auth/decorators/public.decorator';

@ApiTags('冷链异常回滚引擎')
@ApiBearerAuth()
@Controller('engine/cold-chain')
export class ColdChainExceptionController {
  constructor(private coldChainExceptionEngine: ColdChainExceptionEngine) {}

  @Public()
  @Post('record')
  @ApiOperation({ summary: '记录冷链数据（设备上报）' })
  async recordColdChainData(@Body() dto: ColdChainRecordDto) {
    return this.coldChainExceptionEngine.recordColdChainData(dto);
  }

  @Get('orders/:orderId/status')
  @ApiOperation({ summary: '获取订单冷链状态' })
  async getOrderColdChainStatus(@Param('orderId') orderId: string) {
    return this.coldChainExceptionEngine.getOrderColdChainStatus(orderId);
  }

  @Post('exceptions/:exceptionId/calculate')
  @Roles(Role.FINANCE, Role.OPERATOR)
  @ApiOperation({ summary: '计算冷链异常补偿金额' })
  async calculateCompensation(@Param('exceptionId') exceptionId: string) {
    return this.coldChainExceptionEngine.calculateCompensation(exceptionId);
  }

  @Post('exceptions/compensate')
  @Roles(Role.FINANCE)
  @ApiOperation({ summary: '执行冷链异常补偿' })
  async executeCompensation(
    @Request() req,
    @Body() dto: ColdChainExceptionDto,
  ) {
    return this.coldChainExceptionEngine.executeCompensation(
      dto,
      req.user.id,
      req.user.realName,
      req.user.role
    );
  }
}
