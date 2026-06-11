package com.guizhou.platform.subsidy.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.subsidy.dto.response.StatisticsVO;
import com.guizhou.platform.subsidy.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Tag(name = "统计分析", description = "补贴资金多维度统计分析、报表生成")
@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    @Resource
    private StatisticsService statisticsService;

    @Operation(summary = "获取概览统计数据")
    @GetMapping("/overview")
    public Result<StatisticsVO> getOverviewStatistics() {
        return Result.success(statisticsService.getOverviewStatistics());
    }

    @Operation(summary = "获取政策统计")
    @GetMapping("/policy")
    public Result<Map<String, Object>> getPolicyStatistics() {
        return Result.success(statisticsService.getPolicyStatistics());
    }

    @Operation(summary = "获取发放统计")
    @GetMapping("/grant")
    public Result<Map<String, Object>> getGrantStatistics() {
        return Result.success(statisticsService.getGrantStatistics());
    }

    @Operation(summary = "获取资金统计")
    @GetMapping("/fund")
    public Result<Map<String, Object>> getFundStatistics() {
        return Result.success(statisticsService.getFundStatistics());
    }

    @Operation(summary = "获取风险统计")
    @GetMapping("/risk")
    public Result<Map<String, Object>> getRiskStatistics() {
        return Result.success(statisticsService.getRiskStatistics());
    }

    @Operation(summary = "获取月度发放趋势")
    @GetMapping("/trend/monthly")
    public Result<List<Map<String, Object>>> getMonthlyGrantTrend(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {
        return Result.success(statisticsService.getMonthlyGrantTrend(startDate, endDate));
    }

    @Operation(summary = "获取地区分布")
    @GetMapping("/distribution/area")
    public Result<List<Map<String, Object>>> getAreaDistribution() {
        return Result.success(statisticsService.getAreaDistribution());
    }

    @Operation(summary = "获取部门分布")
    @GetMapping("/distribution/department")
    public Result<List<Map<String, Object>>> getDepartmentDistribution() {
        return Result.success(statisticsService.getDepartmentDistribution());
    }

    @Operation(summary = "获取政策类型分布")
    @GetMapping("/distribution/policy-type")
    public Result<List<Map<String, Object>>> getPolicyTypeDistribution() {
        return Result.success(statisticsService.getPolicyTypeDistribution());
    }

    @Operation(summary = "获取风险类型分布")
    @GetMapping("/distribution/risk-type")
    public Result<List<Map<String, Object>>> getRiskTypeDistribution() {
        return Result.success(statisticsService.getRiskTypeDistribution());
    }

    @Operation(summary = "获取受益人分析")
    @GetMapping("/beneficiary/{beneficiaryId}")
    public Result<Map<String, Object>> getBeneficiaryAnalysis(@PathVariable String beneficiaryId) {
        return Result.success(statisticsService.getBeneficiaryAnalysis(beneficiaryId));
    }

    @Operation(summary = "重建统计缓存")
    @PostMapping("/cache/rebuild")
    public Result<Void> rebuildStatisticsCache() {
        statisticsService.rebuildStatisticsCache();
        return Result.success();
    }
}
