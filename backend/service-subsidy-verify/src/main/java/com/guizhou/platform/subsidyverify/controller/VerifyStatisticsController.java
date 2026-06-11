package com.guizhou.platform.subsidyverify.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.subsidyverify.dto.response.VerifyStatisticsVO;
import com.guizhou.platform.subsidyverify.service.VerifyStatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "核销统计", description = "核销统计报表、分类统计、商户排行")
@RestController
@RequestMapping("/api/verify-statistics")
public class VerifyStatisticsController {

    @Resource
    private VerifyStatisticsService verifyStatisticsService;

    @Operation(summary = "获取日核销统计")
    @GetMapping("/daily/{statDate}")
    public Result<VerifyStatisticsVO> getDailyStatistics(@PathVariable String statDate) {
        return Result.success(verifyStatisticsService.getDailyStatistics(statDate));
    }

    @Operation(summary = "获取日期范围内统计")
    @GetMapping("/range")
    public Result<List<VerifyStatisticsVO>> getStatisticsByDateRange(
            @RequestParam String startDate, @RequestParam String endDate) {
        return Result.success(verifyStatisticsService.getStatisticsByDateRange(startDate, endDate));
    }

    @Operation(summary = "获取分类统计")
    @GetMapping("/category")
    public Result<Map<String, Object>> getCategoryStatistics(
            @RequestParam String startDate, @RequestParam String endDate) {
        return Result.success(verifyStatisticsService.getCategoryStatistics(startDate, endDate));
    }

    @Operation(summary = "获取商户核销排行")
    @GetMapping("/merchant-ranking")
    public Result<Map<String, Object>> getMerchantRanking(
            @RequestParam String startDate, @RequestParam String endDate,
            @RequestParam(defaultValue = "10") Integer topN) {
        return Result.success(verifyStatisticsService.getMerchantRanking(startDate, endDate, topN));
    }

    @Operation(summary = "获取政策核销统计")
    @GetMapping("/policy")
    public Result<Map<String, Object>> getPolicyStatistics(
            @RequestParam String startDate, @RequestParam String endDate) {
        return Result.success(verifyStatisticsService.getPolicyStatistics(startDate, endDate));
    }

    @Operation(summary = "手动生成日统计快照")
    @PostMapping("/generate/{statDate}")
    public Result<Void> generateDailyStatistics(@PathVariable String statDate) {
        verifyStatisticsService.generateDailyStatistics(statDate);
        return Result.success();
    }
}
