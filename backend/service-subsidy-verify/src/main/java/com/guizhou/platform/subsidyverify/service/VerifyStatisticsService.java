package com.guizhou.platform.subsidyverify.service;

import com.guizhou.platform.subsidyverify.dto.response.VerifyStatisticsVO;

import java.util.List;
import java.util.Map;

public interface VerifyStatisticsService {

    VerifyStatisticsVO getDailyStatistics(String statDate);

    List<VerifyStatisticsVO> getStatisticsByDateRange(String startDate, String endDate);

    Map<String, Object> getCategoryStatistics(String startDate, String endDate);

    Map<String, Object> getMerchantRanking(String startDate, String endDate, Integer topN);

    Map<String, Object> getPolicyStatistics(String startDate, String endDate);

    void generateDailyStatistics(String statDate);
}
