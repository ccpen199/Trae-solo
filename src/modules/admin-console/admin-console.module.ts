import { Module } from '@nestjs/common';
import { AdminConsoleController } from './admin-console.controller';
import { AdminConsoleService } from './admin-console.service';
import { LifecycleTraceService } from './lifecycle-trace.service';
import { AuthChainMonitorService } from './auth-chain-monitor.service';
import { BottleneckAnalysisService } from './bottleneck-analysis.service';
import { OpenApiAcceptanceService } from './openapi-acceptance.service';
import { PermissionRoleService } from './permission-role.service';
import { ServiceItemEnhancedService } from './service-item-enhanced.service';
import { PolicyEnhancedService } from './policy-enhanced.service';

@Module({
  controllers: [AdminConsoleController],
  providers: [
    AdminConsoleService,
    LifecycleTraceService,
    AuthChainMonitorService,
    BottleneckAnalysisService,
    OpenApiAcceptanceService,
    PermissionRoleService,
    ServiceItemEnhancedService,
    PolicyEnhancedService,
  ],
  exports: [
    AdminConsoleService,
    LifecycleTraceService,
    AuthChainMonitorService,
    BottleneckAnalysisService,
    OpenApiAcceptanceService,
    PermissionRoleService,
    ServiceItemEnhancedService,
    PolicyEnhancedService,
  ],
})
export class AdminConsoleModule {}
