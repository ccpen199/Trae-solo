package com.guizhou.platform.subsidyverify.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.subsidyverify.dto.response.VerifyStatisticsVO;
import com.guizhou.platform.subsidyverify.entity.VerifyStatistics;
import com.guizhou.platform.subsidyverify.mapper.VerifyStatisticsMapper;
import com.guizhou.platform.subsidyverify.service.VerifyStatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerifyStatisticsServiceImpl implements VerifyStatisticsService {

    private final VerifyStatisticsMapper statisticsMapper;

    @Override
    public VerifyStatisticsVO getDailyStatistics(String statDate) {
        VerifyStatistics stats = statisticsMapper.selectOne(new LambdaQueryWrapper<VerifyStatistics>()
                .eq(VerifyStatistics::getStatDate, statDate));
        if (stats == null) {
            return null;
        }
        return convertToVO(stats);
    }

    @Override
    public List<VerifyStatisticsVO> getStatisticsByDateRange(String startDate, String endDate) {
        List<VerifyStatistics> stats = statisticsMapper.selectList(new LambdaQueryWrapper<VerifyStatistics>()
                .between(VerifyStatistics::getStatDate, startDate, endDate)
                .orderByAsc(VerifyStatistics::getStatDate));
        return stats.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getCategoryStatistics(String startDate, String endDate) {
        return statisticsMapper.getCategoryStatistics(startDate, endDate);
    }

    @Override
    public Map<String, Object> getMerchantRanking(String startDate, String endDate, Integer topN) {
        List<VerifyStatistics> stats = statisticsMapper.selectList(new LambdaQueryWrapper<VerifyStatistics>()
                .between(VerifyStatistics::getStatDate, startDate, endDate)
                .groupBy(VerifyStatistics::getMerchantId)
                .orderByDesc(VerifyStatistics::getVerifyCount)
                .last("LIMIT " + topN));
        Map<String, Object> result = new HashMap<>();
        result.put("ranking", stats.stream().map(this::convertToVO).collect(Collectors.toList()));
        return result;
    }

    @Override
    public Map<String, Object> getPolicyStatistics(String startDate, String endDate) {
        List<VerifyStatistics> stats = statisticsMapper.selectList(new LambdaQueryWrapper<VerifyStatistics>()
                .between(VerifyStatistics::getStatDate, startDate, endDate));
        Map<Long, List<VerifyStatistics>> grouped = stats.stream()
                .collect(Collectors.groupingBy(VerifyStatistics::getPolicyId));

        Map<String, Object> result = new HashMap<>();
        for (Map.Entry<Long, List<VerifyStatistics>> entry : grouped.entrySet()) {
            Map<String, Object> policyStat = new HashMap<>();
            List<VerifyStatistics> policyStats = entry.getValue();
            int totalVerify = policyStats.stream().mapToInt(s -> s.getVerifyCount() != null ? s.getVerifyCount() : 0).sum();
            BigDecimal totalSubsidy = policyStats.stream()
                    .map(s -> s.getTotalSubsidyAmount() != null ? s.getTotalSubsidyAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            policyStat.put("policyId", entry.getKey());
            policyStat.put("policyName", policyStats.get(0).getPolicyName());
            policyStat.put("totalVerifyCount", totalVerify);
            policyStat.put("totalSubsidyAmount", totalSubsidy);
            result.put(entry.getKey().toString(), policyStat);
        }
        return result;
    }

    @Override
    public void generateDailyStatistics(String statDate) {
        log.info("开始生成核销统计快照, statDate={}", statDate);
        // 统计逻辑由定时任务触发，从verify_record聚合数据写入verify_statistics
    }

    private VerifyStatisticsVO convertToVO(VerifyStatistics stats) {
        VerifyStatisticsVO vo = new VerifyStatisticsVO();
        BeanUtils.copyProperties(stats, vo);
        return vo;
    }
}
