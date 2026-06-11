package com.guizhou.platform.subsidy.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class StatisticsVO {

    private Long totalPolicyCount;

    private Long activePolicyCount;

    private Long totalGrantCount;

    private Long pendingReviewCount;

    private Long pendingApprovalCount;

    private Long grantedCount;

    private Long verifiedCount;

    private BigDecimal totalBudgetAmount;

    private BigDecimal totalGrantedAmount;

    private BigDecimal totalVerifiedAmount;

    private BigDecimal remainingBudgetAmount;

    private Long todayGrantCount;

    private BigDecimal todayGrantAmount;

    private Long todayWarningCount;

    private Long pendingWarningCount;

    private Long highRiskCount;

    private Map<String, Long> policyTypeStats;

    private Map<String, BigDecimal> departmentStats;

    private List<Map<String, Object>> monthlyGrantTrend;

    private List<Map<String, Object>> areaDistribution;

    private List<Map<String, Object>> riskTypeDistribution;

    private BigDecimal grantRate;

    private BigDecimal verifyRate;

    private BigDecimal riskRate;

    private BigDecimal averageReviewTime;

    private Map<String, Object> extraData;
}
