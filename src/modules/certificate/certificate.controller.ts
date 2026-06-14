import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CertificateService } from './certificate.service';
import { CurrentUser, CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { IssueCertificateDto } from './dto/certificate.dto';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('证照')
@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post('issue')
  @ApiBearerAuth()
  @ApiOperation({ summary: '签发电子证照' })
  async issue(@Body() dto: IssueCertificateDto) {
    return this.certificateService.issueCertificate(dto);
  }

  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的证照列表' })
  async getMine(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
  ) {
    return this.certificateService.findByUser(user, { page, pageSize, status });
  }

  @Public()
  @Get('verify/:certNo')
  @ApiOperation({ summary: '公开证照验证接口' })
  async verify(@Param('certNo') certNo: string) {
    return this.certificateService.verify(certNo);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取证照详情' })
  async findOne(@Param('id') id: string) {
    return this.certificateService.findOne(id);
  }

  @Post(':certNo/revoke')
  @ApiBearerAuth()
  @ApiOperation({ summary: '吊销证照' })
  async revoke(@Param('certNo') certNo: string, @Body('reason') reason: string) {
    return this.certificateService.revoke(certNo, reason);
  }
}
