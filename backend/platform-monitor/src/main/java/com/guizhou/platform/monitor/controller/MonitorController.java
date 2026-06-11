package com.guizhou.platform.monitor.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.monitor.dto.response.MonitorDashboardVO;
import com.guizhou.platform.monitor.dto.response.ServiceHealthVO;
import com.guizhou.platform.monitor.entity.ServiceInstance;
import com.guizhou.platform.monitor.service.MonitorService;
import com.guizhou.platform.monitor.service.ProbeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "服务监控", description = "服务监控数据、健康检查、监控大屏")
@RestController
@RequestMapping("/monitor")
@RequiredArgsConstructor
public class MonitorController {

    private final MonitorService monitorService;
    private final ProbeService probeService;

    @Operation(summary = "获取监控大屏数据")
    @GetMapping("/dashboard")
    public Result<MonitorDashboardVO> getDashboard() {
        return Result.success(monitorService.getDashboard());
    }

    @Operation(summary = "分页查询服务列表")
    @GetMapping("/services")
    public Result<IPage<ServiceInstance>> listServices(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(monitorService.listServices(pageNum, pageSize));
    }

    @Operation(summary = "获取服务健康状态")
    @GetMapping("/service/{serviceId}/health")
    public Result<ServiceHealthVO> getServiceHealth(@PathVariable Long serviceId) {
        return Result.success(monitorService.getServiceHealth(serviceId));
    }

    @Operation(summary = "获取所有服务健康状态")
    @GetMapping("/services/health")
    public Result<List<ServiceHealthVO>> getAllServiceHealth() {
        return Result.success(monitorService.getAllServiceHealth());
    }

    @Operation(summary = "手动触发全量拨测")
    @PostMapping("/probe/all")
    public Result<Void> triggerProbeAll() {
        probeService.executeProbeAll();
        return Result.success();
    }

    @Operation(summary = "手动触发单个服务拨测")
    @PostMapping("/probe/{serviceId}")
    public Result<Void> triggerProbe(@PathVariable Long serviceId) {
        ServiceInstance instance = monitorService.listServices(1, 1)
                .getRecords().stream()
                .filter(s -> s.getId().equals(serviceId))
                .findFirst().orElse(null);
        if (instance == null) {
            return Result.error("服务实例不存在");
        }
        probeService.probeServiceAsync(instance);
        return Result.success();
    }
}
