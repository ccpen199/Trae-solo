package com.guizhou.platform.subsidy.service.impl;

import com.guizhou.platform.subsidy.dto.response.StatisticsVO;
import com.guizhou.platform.subsidy.entity.SubsidyGrant;
import com.guizhou.platform.subsidy.enums.GrantStatusEnum;
import com.guizhou.platform.subsidy.enums.PolicyStatusEnum;
import com.guizhou.platform.subsidy.mapper.*;
import com.guizhou.platform.subsidy.service.StatisticsService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class StatisticsServiceImpl implements StatisticsService {

    private static final String STATISTICS_CACHE_KEY = "subsidy:statistics:overview";

    @Resource
    private SubsidyPolicyMapper policyMapper;

    @Resource
    private SubsidyGrantMapper grantMapper;

    @Resource
    private FundFlowMapper fundFlowMapper;

    @Resource
    private RiskWarningMapper warningMapper;

    @Resource
    private SubsidyVerifyRecordMapper verifyRecordMapper;

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    @Override
    @SuppressWarnings("unchecked")
    public StatisticsVO getOverviewStatistics() {
        StatisticsVO cached = (StatisticsVO) redisTemplate.opsForValue().get(STATISTICS_CACHE_KEY);
        if (cached != null) {
            return cached;
        }

        StatisticsVO vo = buildStatistics();
        redisTemplate.opsForValue().set(STATISTICS_CACHE_KEY, vo, 5, TimeUnit.MINUTES);
        return vo;
    }

    private StatisticsVO buildStatistics() {
        StatisticsVO vo = new StatisticsVO();

        vo.setTotalPolicyCount(policyMapper.selectCount(null));
        vo.setActivePolicyCount(policyMapper.selectCount(w -> w.eq("policy_status", PolicyStatusEnum.ACTIVE.getCode())));

        vo.setTotalGrantCount(grantMapper.selectCount(null));
        vo.setPendingReviewCount(grantMapper.countByStatus(GrantStatusEnum.PENDING_REVIEW.getCode()));
        vo.setPendingApprovalCount(grantMapper.countByStatus(GrantStatusEnum.PENDING_APPROVAL.getCode()));
        vo.setGrantedCount(grantMapper.countByStatus(GrantStatusEnum.GRANTED.getCode()));
        vo.setVerifiedCount(verifyRecordMapper.selectCount(null));

        BigDecimal totalBudget = policyMapper.sumRemainingBudget();
        BigDecimal totalGranted = grantMapper.sumGrantedAmount();
        BigDecimal totalVerified = verifyRecordMapper.sumVerifiedAmount();

        vo.setTotalBudgetAmount(totalBudget != null ? totalBudget : BigDecimal.ZERO);
        vo.setTotalGrantedAmount(totalGranted != null ? totalGranted : BigDecimal.ZERO);
        vo.setTotalVerifiedAmount(totalVerified != null ? totalVerified : BigDecimal.ZERO);
        vo.setRemainingBudgetAmount(policyMapper.sumRemainingBudget());

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        vo.setTodayGrantCount(grantMapper.countByCreateTime(todayStart));
        vo.setTodayGrantAmount(grantMapper.sumGrantedAmountByTime(todayStart));
        vo.setTodayWarningCount(warningMapper.countByCreateTime(todayStart));
        vo.setPendingWarningCount(warningMapper.countPending());
        vo.setHighRiskCount(warningMapper.countHighRisk());

        Map<String, Long> policyTypeStats = new HashMap<>();
        List<Map<String, Object>> typeList = policyMapper.countByPolicyType();
        for (Map<String, Object> map : typeList) {
            policyTypeStats.put((String) map.get("policy_type"), (Long) map.get("count"));
        }
        vo.setPolicyTypeStats(policyTypeStats);

        Map<String, BigDecimal> deptStats = new HashMap<>();
        List<Map<String, Object>> deptList = policyMapper.sumBudgetByDepartment();
        for (Map<String, Object> map : deptList) {
            deptStats.put((String) map.get("department"), (BigDecimal) map.get("total"));
        }
        vo.setDepartmentStats(deptStats);

        LocalDateTime trendStart = LocalDateTime.now().minusMonths(6);
        vo.setMonthlyGrantTrend(grantMapper.getMonthlyTrend(trendStart));

        vo.setRiskTypeDistribution(warningMapper.countByRiskType());

        long totalGrant = vo.getTotalGrantCount() != null ? vo.getTotalGrantCount() : 1;
        long granted = vo.getGrantedCount() != null ? vo.getGrantedCount() : 0;
        long verified = vo.getVerifiedCount() != null ? vo.getVerifiedCount() : 0;
        long warnings = warningMapper.selectCount(null);

        vo.setGrantRate(BigDecimal.valueOf(granted * 100.0 / totalGrant).setScale(2, RoundingMode.HALF_UP));
        vo.setVerifyRate(BigDecimal.valueOf(verified * 100.0 / Math.max(granted, 1)).setScale(2, RoundingMode.HALF_UP));
        vo.setRiskRate(BigDecimal.valueOf(warnings * 100.0 / totalGrant).setScale(2, RoundingMode.HALF_UP));
        vo.setAverageReviewTime(grantMapper.getAverageReviewTime());

        return vo;
    }

    @Override
    public Map<String, Object> getPolicyStatistics() {
        Map<String, Object> result = new HashMap<>();
        result.put("total", policyMapper.selectCount(null));
        result.put("active", policyMapper.selectCount(w -> w.eq("policy_status", PolicyStatusEnum.ACTIVE.getCode())));
        result.put("draft", policyMapper.selectCount(w -> w.eq("policy_status", PolicyStatusEnum.DRAFT.getCode())));
        result.put("published", policyMapper.selectCount(w -> w.eq("policy_status", PolicyStatusEnum.PUBLISHED.getCode())));
        result.put("expired", policyMapper.selectCount(w -> w.eq("policy_status", PolicyStatusEnum.EXPIRED.getCode())));
        result.put("byType", policyMapper.countByPolicyType());
        result.put("byDepartment", policyMapper.sumBudgetByDepartment());
        return result;
    }

    @Override
    public Map<String, Object> getGrantStatistics() {
        Map<String, Object> result = new HashMap<>();
        result.put("total", grantMapper.selectCount(null));
        result.put("pendingReview", grantMapper.countByStatus(GrantStatusEnum.PENDING_REVIEW.getCode()));
        result.put("pendingApproval", grantMapper.countByStatus(GrantStatusEnum.PENDING_APPROVAL.getCode()));
        result.put("pendingGrant", grantMapper.countByStatus(GrantStatusEnum.PENDING_GRANT.getCode()));
        result.put("granted", grantMapper.countByStatus(GrantStatusEnum.GRANTED.getCode()));
        result.put("rejected", grantMapper.countByStatus(GrantStatusEnum.REVIEW_REJECTED.getCode())
                + grantMapper.countByStatus(GrantStatusEnum.APPROVAL_REJECTED.getCode()));
        result.put("revoked", grantMapper.countByStatus(GrantStatusEnum.REVOKED.getCode()));
        result.put("frozen", grantMapper.countByStatus(GrantStatusEnum.FROZEN.getCode()));
        result.put("totalAmount", grantMapper.sumGrantedAmount());
        return result;
    }

    @Override
    public Map<String, Object> getFundStatistics() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalBudget", policyMapper.sumRemainingBudget());
        result.put("totalGranted", grantMapper.sumGrantedAmount());
        result.put("totalVerified", verifyRecordMapper.sumVerifiedAmount());
        BigDecimal remaining = policyMapper.sumRemainingBudget();
        result.put("remaining", remaining);
        BigDecimal budget = policyMapper.sumRemainingBudget();
        if (budget != null && budget.compareTo(BigDecimal.ZERO) > 0) {
            result.put("usageRate", grantMapper.sumGrantedAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(budget, 2, RoundingMode.HALF_UP));
        }
        return result;
    }

    @Override
    public Map<String, Object> getRiskStatistics() {
        Map<String, Object> result = new HashMap<>();
        result.put("total", warningMapper.selectCount(null));
        result.put("pending", warningMapper.countPending());
        result.put("highRisk", warningMapper.countHighRisk());
        result.put("byType", warningMapper.countByRiskType());
        result.put("today", warningMapper.countByCreateTime(LocalDateTime.of(LocalDate.now(), LocalTime.MIN)));
        return result;
    }

    @Override
    public List<Map<String, Object>> getMonthlyGrantTrend(LocalDate startDate, LocalDate endDate) {
        return grantMapper.getMonthlyTrend(LocalDateTime.of(startDate, LocalTime.MIN));
    }

    @Override
    public List<Map<String, Object>> getAreaDistribution() {
        return Collections.emptyList();
    }

    @Override
    public List<Map<String, Object>> getDepartmentDistribution() {
        List<Map<String, Object>> list = new ArrayList<>();
        List<Map<String, Object>> deptList = policyMapper.sumBudgetByDepartment();
        for (Map<String, Object> map : deptList) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", map.get("department"));
            item.put("value", map.get("total"));
            list.add(item);
        }
        return list;
    }

    @Override
    public List<Map<String, Object>> getPolicyTypeDistribution() {
        List<Map<String, Object>> list = new ArrayList<>();
        List<Map<String, Object>> typeList = policyMapper.countByPolicyType();
        for (Map<String, Object> map : typeList) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", map.get("policy_type"));
            item.put("value", map.get("count"));
            list.add(item);
        }
        return list;
    }

    @Override
    public List<Map<String, Object>> getRiskTypeDistribution() {
        return warningMapper.countByRiskType();
    }

    @Override
    public Map<String, Object> getBeneficiaryAnalysis(String beneficiaryId) {
        Map<String, Object> result = new HashMap<>();
        List<SubsidyGrant> grants = grantMapper.selectList(
                w -> w.eq("beneficiary_id", beneficiaryId));
        result.put("grantCount", grants.size());
        BigDecimal totalAmount = grants.stream()
                .map(SubsidyGrant::getGrantedAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        result.put("totalAmount", totalAmount);
        result.put("warnings", warningMapper.findByBeneficiaryId(beneficiaryId).size());
        result.put("grants", grants);
        return result;
    }

    @Override
    @Scheduled(cron = "${subsidy.schedule.statistics-cron:0 0 3 * * ?}")
    public void rebuildStatisticsCache() {
        log.info("开始重建统计数据缓存");
        try {
            StatisticsVO vo = buildStatistics();
            redisTemplate.opsForValue().set(STATISTICS_CACHE_KEY, vo, 1, TimeUnit.HOURS);
            log.info("统计数据缓存重建完成");
        } catch (Exception e) {
            log.error("重建统计数据缓存失败", e);
        }
    }
}
