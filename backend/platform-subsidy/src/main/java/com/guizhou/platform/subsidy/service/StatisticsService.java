package com.guizhou.platform.subsidy.service;

import com.guizhou.platform.subsidy.dto.response.StatisticsVO;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface StatisticsService {

    StatisticsVO getOverviewStatistics();

    Map<String, Object> getPolicyStatistics();

    Map<String, Object> getGrantStatistics();

    Map<String, Object> getFundStatistics();

    Map<String, Object> getRiskStatistics();

    List<Map<String, Object>> getMonthlyGrantTrend(LocalDate startDate, LocalDate endDate);

    List<Map<String, Object>> getAreaDistribution();

    List<Map<String, Object>> getDepartmentDistribution();

    List<Map<String, Object>> getPolicyTypeDistribution();

    List<Map<String, Object>> getRiskTypeDistribution();

    Map<String, Object> getBeneficiaryAnalysis(String beneficiaryId);

    void rebuildStatisticsCache();
}
