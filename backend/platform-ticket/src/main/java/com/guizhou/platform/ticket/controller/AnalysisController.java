package com.guizhou.platform.ticket.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.ticket.dto.response.HotspotVO;
import com.guizhou.platform.ticket.dto.response.TicketStatisticsVO;
import com.guizhou.platform.ticket.service.AnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "诉求分析统计", description = "诉求热点分析、统计报表、趋势分析")
@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    @Resource
    private AnalysisService analysisService;

    @Operation(summary = "获取工单统计数据")
    @GetMapping("/statistics")
    public Result<TicketStatisticsVO> getStatistics() {
        return Result.success(analysisService.getStatistics());
    }

    @Operation(summary = "获取分类热点")
    @GetMapping("/category-hotspot")
    public Result<List<HotspotVO>> getCategoryHotspots(
            @RequestParam(defaultValue = "#{T(java.time.LocalDateTime).now().minusMonths(1).toString()}") String startTime,
            @RequestParam(defaultValue = "#{T(java.time.LocalDateTime).now().toString()}") String endTime) {
        return Result.success(analysisService.getCategoryHotspots(startTime, endTime));
    }

    @Operation(summary = "获取区域热点")
    @GetMapping("/region-hotspot")
    public Result<List<HotspotVO>> getRegionHotspots(
            @RequestParam String startTime,
            @RequestParam String endTime) {
        return Result.success(analysisService.getRegionHotspots(startTime, endTime));
    }

    @Operation(summary = "获取时间趋势")
    @GetMapping("/time-trend")
    public Result<List<HotspotVO>> getTimeTrend(
            @RequestParam String startTime,
            @RequestParam String endTime) {
        return Result.success(analysisService.getTimeTrend(startTime, endTime));
    }

    @Operation(summary = "获取部门工作量")
    @GetMapping("/department-workload")
    public Result<List<HotspotVO>> getDepartmentWorkload(
            @RequestParam String startTime,
            @RequestParam String endTime) {
        return Result.success(analysisService.getDepartmentWorkload(startTime, endTime));
    }
}
