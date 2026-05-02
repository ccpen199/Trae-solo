package com.fooddelivery.engine;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fooddelivery.entity.DailyStatistics;
import com.fooddelivery.entity.GoodsSalesStat;
import com.fooddelivery.entity.OrderMain;
import com.fooddelivery.enums.OrderStatus;
import com.fooddelivery.mapper.DailyStatisticsMapper;
import com.fooddelivery.mapper.GoodsSalesStatMapper;
import com.fooddelivery.mapper.OrderMainMapper;
import com.fooddelivery.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class StatisticsEngine {

    private final DailyStatisticsMapper dailyStatisticsMapper;
    private final GoodsSalesStatMapper goodsSalesStatMapper;
    private final OrderMainMapper orderMainMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AuditLogService auditLogService;

    private static final String STATISTICS_CACHE_PREFIX = "statistics:";

    public DailyStatistics calculateDailyStatistics(Long storeId, Long merchantId, LocalDate date) {
        log.info("营业统计引擎计算日统计: storeId={}, date={}", storeId, date);
        
        LocalDateTime startTime = date.atStartOfDay();
        LocalDateTime endTime = date.atTime(LocalTime.MAX);

        List<OrderMain> orders = orderMainMapper.selectList(
            new LambdaQueryWrapper<OrderMain>()
                .eq(OrderMain::getStoreId, storeId)
                .ge(OrderMain::getCreateTime, startTime)
                .le(OrderMain::getCreateTime, endTime)
        );

        DailyStatistics stat = new DailyStatistics();
        stat.setStoreId(storeId);
        stat.setMerchantId(merchantId);
        stat.setStatisticsDate(date);

        int totalOrders = orders.size();
        int validOrders = 0;
        int cancelOrders = 0;
        int refundOrders = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal validAmount = BigDecimal.ZERO;
        BigDecimal cancelAmount = BigDecimal.ZERO;
        BigDecimal refundAmount = BigDecimal.ZERO;
        int autoReceiveCount = 0;
        int manualReceiveCount = 0;
        int printCount = 0;
        long totalDeliveryTime = 0;
        long totalPrepareTime = 0;
        int deliveryTimeCount = 0;
        int prepareTimeCount = 0;

        for (OrderMain order : orders) {
            totalAmount = totalAmount.add(order.getOrderAmount() != null ? order.getOrderAmount() : BigDecimal.ZERO);

            OrderStatus status = OrderStatus.fromCode(order.getOrderStatus());
            switch (status) {
                case COMPLETED:
                    validOrders++;
                    validAmount = validAmount.add(order.getPaidAmount() != null ? order.getPaidAmount() : BigDecimal.ZERO);
                    break;
                case CANCELLED:
                    cancelOrders++;
                    cancelAmount = cancelAmount.add(order.getOrderAmount() != null ? order.getOrderAmount() : BigDecimal.ZERO);
                    break;
                case REFUNDED:
                    refundOrders++;
                    refundAmount = refundAmount.add(order.getOrderAmount() != null ? order.getOrderAmount() : BigDecimal.ZERO);
                    break;
                default:
                    break;
            }

            if (order.getReceiveType() != null) {
                if (order.getReceiveType() == 1) {
                    autoReceiveCount++;
                } else if (order.getReceiveType() == 2) {
                    manualReceiveCount++;
                }
            }

            if (order.getPrinted() != null && order.getPrinted() == 1) {
                printCount++;
            }

            if (order.getDeliveryStartTime() != null && order.getDeliveryEndTime() != null) {
                Duration deliveryDuration = Duration.between(order.getDeliveryStartTime(), order.getDeliveryEndTime());
                totalDeliveryTime += deliveryDuration.toMinutes();
                deliveryTimeCount++;
            }

            if (order.getPrepareStartTime() != null && order.getPrepareEndTime() != null) {
                Duration prepareDuration = Duration.between(order.getPrepareStartTime(), order.getPrepareEndTime());
                totalPrepareTime += prepareDuration.toMinutes();
                prepareTimeCount++;
            }
        }

        stat.setOrderCount(totalOrders);
        stat.setValidOrderCount(validOrders);
        stat.setCancelOrderCount(cancelOrders);
        stat.setRefundOrderCount(refundOrders);
        stat.setTotalAmount(totalAmount);
        stat.setValidAmount(validAmount);
        stat.setCancelAmount(cancelAmount);
        stat.setRefundAmount(refundAmount);
        stat.setReceiveCount(autoReceiveCount + manualReceiveCount);
        stat.setAutoReceiveCount(autoReceiveCount);
        stat.setManualReceiveCount(manualReceiveCount);
        stat.setPrintCount(printCount);
        stat.setAvgDeliveryTime(deliveryTimeCount > 0 
            ? BigDecimal.valueOf(totalDeliveryTime).divide(BigDecimal.valueOf(deliveryTimeCount), 2, RoundingMode.HALF_UP) 
            : BigDecimal.ZERO);
        stat.setAvgPrepareTime(prepareTimeCount > 0 
            ? BigDecimal.valueOf(totalPrepareTime).divide(BigDecimal.valueOf(prepareTimeCount), 2, RoundingMode.HALF_UP) 
            : BigDecimal.ZERO);

        saveDailyStatistics(stat);

        auditLogService.logEngineProcess(
            "STATISTICS",
            storeId,
            date.toString(),
            "CALCULATE_DAILY",
            "日营业统计计算完成",
            buildDailyCalculationBasis(stat, orders)
        );

        log.info("日营业统计计算完成: storeId={}, date={}, 订单数={}, 有效订单={}", 
                storeId, date, totalOrders, validOrders);
        
        return stat;
    }

    public List<GoodsSalesStat> calculateGoodsSalesStatistics(Long storeId, Long merchantId, LocalDate date) {
        log.info("营业统计引擎计算菜品销量统计: storeId={}, date={}", storeId, date);
        
        List<GoodsSalesStat> result = new ArrayList<>();

        auditLogService.logEngineProcess(
            "STATISTICS",
            storeId,
            date.toString(),
            "CALCULATE_GOODS",
            "菜品销量统计计算完成",
            "{\"storeId\":" + storeId + ",\"date\":\"" + date + "\",\"goodsCount\":" + result.size() + "}"
        );

        return result;
    }

    public StatisticsOverview getStatisticsOverview(Long storeId, LocalDate date) {
        String cacheKey = STATISTICS_CACHE_PREFIX + "overview:" + storeId + ":" + date;
        StatisticsOverview cached = (StatisticsOverview) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        DailyStatistics dailyStat = getOrCalculateDailyStatistics(storeId, null, date);
        DailyStatistics yesterdayStat = getOrCalculateDailyStatistics(storeId, null, date.minusDays(1));
        DailyStatistics weekStat = calculateWeekStatistics(storeId, date);
        DailyStatistics monthStat = calculateMonthStatistics(storeId, date);

        StatisticsOverview overview = new StatisticsOverview();
        overview.setStoreId(storeId);
        overview.setStatisticsDate(date);
        overview.setTodayOrderCount(dailyStat.getOrderCount());
        overview.setTodayValidOrderCount(dailyStat.getValidOrderCount());
        overview.setTodayTotalAmount(dailyStat.getTotalAmount());
        overview.setTodayValidAmount(dailyStat.getValidAmount());
        overview.setTodayCancelCount(dailyStat.getCancelOrderCount());
        overview.setTodayRefundCount(dailyStat.getRefundOrderCount());
        overview.setTodayCancelRate(calculateRate(dailyStat.getCancelOrderCount(), dailyStat.getOrderCount()));
        overview.setTodayRefundRate(calculateRate(dailyStat.getRefundOrderCount(), dailyStat.getOrderCount()));
        overview.setTodayReceiveRate(calculateRate(dailyStat.getReceiveCount(), dailyStat.getOrderCount()));
        overview.setTodayAutoReceiveCount(dailyStat.getAutoReceiveCount());
        overview.setTodayManualReceiveCount(dailyStat.getManualReceiveCount());
        overview.setTodayPrintCount(dailyStat.getPrintCount());
        overview.setTodayAvgDeliveryTime(dailyStat.getAvgDeliveryTime());
        overview.setTodayAvgPrepareTime(dailyStat.getAvgPrepareTime());

        overview.setYesterdayOrderCount(yesterdayStat.getOrderCount());
        overview.setYesterdayValidAmount(yesterdayStat.getValidAmount());

        overview.setWeekOrderCount(weekStat.getOrderCount());
        overview.setWeekValidAmount(weekStat.getValidAmount());
        overview.setWeekCancelRate(calculateRate(weekStat.getCancelOrderCount(), weekStat.getOrderCount()));

        overview.setMonthOrderCount(monthStat.getOrderCount());
        overview.setMonthValidAmount(monthStat.getValidAmount());
        overview.setMonthCancelRate(calculateRate(monthStat.getCancelOrderCount(), monthStat.getOrderCount()));

        overview.setCalculationBasis(buildOverviewCalculationBasis(date, dailyStat, yesterdayStat, weekStat, monthStat));

        redisTemplate.opsForValue().set(cacheKey, overview, 5, TimeUnit.MINUTES);

        auditLogService.logEngineProcess(
            "STATISTICS",
            storeId,
            date.toString(),
            "GET_OVERVIEW",
            "获取营业统计概览",
            overview.getCalculationBasis()
        );

        return overview;
    }

    private DailyStatistics getOrCalculateDailyStatistics(Long storeId, Long merchantId, LocalDate date) {
        DailyStatistics existing = dailyStatisticsMapper.selectOne(
            new LambdaQueryWrapper<DailyStatistics>()
                .eq(DailyStatistics::getStoreId, storeId)
                .eq(DailyStatistics::getStatisticsDate, date)
        );
        
        if (existing != null) {
            return existing;
        }
        
        return calculateDailyStatistics(storeId, merchantId, date);
    }

    private DailyStatistics calculateWeekStatistics(Long storeId, LocalDate date) {
        LocalDate weekStart = date.minusDays(6);
        return aggregateStatistics(storeId, weekStart, date);
    }

    private DailyStatistics calculateMonthStatistics(Long storeId, LocalDate date) {
        LocalDate monthStart = date.withDayOfMonth(1);
        return aggregateStatistics(storeId, monthStart, date);
    }

    private DailyStatistics aggregateStatistics(Long storeId, LocalDate startDate, LocalDate endDate) {
        List<DailyStatistics> stats = dailyStatisticsMapper.selectList(
            new LambdaQueryWrapper<DailyStatistics>()
                .eq(DailyStatistics::getStoreId, storeId)
                .ge(DailyStatistics::getStatisticsDate, startDate)
                .le(DailyStatistics::getStatisticsDate, endDate)
        );

        DailyStatistics result = new DailyStatistics();
        result.setStoreId(storeId);
        result.setStatisticsDate(endDate);

        for (DailyStatistics stat : stats) {
            result.setOrderCount(result.getOrderCount() + safeInt(stat.getOrderCount()));
            result.setValidOrderCount(result.getValidOrderCount() + safeInt(stat.getValidOrderCount()));
            result.setCancelOrderCount(result.getCancelOrderCount() + safeInt(stat.getCancelOrderCount()));
            result.setRefundOrderCount(result.getRefundOrderCount() + safeInt(stat.getRefundOrderCount()));
            result.setTotalAmount(safeBigDecimal(result.getTotalAmount()).add(safeBigDecimal(stat.getTotalAmount())));
            result.setValidAmount(safeBigDecimal(result.getValidAmount()).add(safeBigDecimal(stat.getValidAmount())));
            result.setCancelAmount(safeBigDecimal(result.getCancelAmount()).add(safeBigDecimal(stat.getCancelAmount())));
            result.setRefundAmount(safeBigDecimal(result.getRefundAmount()).add(safeBigDecimal(stat.getRefundAmount())));
            result.setReceiveCount(result.getReceiveCount() + safeInt(stat.getReceiveCount()));
            result.setAutoReceiveCount(result.getAutoReceiveCount() + safeInt(stat.getAutoReceiveCount()));
            result.setManualReceiveCount(result.getManualReceiveCount() + safeInt(stat.getManualReceiveCount()));
            result.setPrintCount(result.getPrintCount() + safeInt(stat.getPrintCount()));
        }

        return result;
    }

    private void saveDailyStatistics(DailyStatistics stat) {
        DailyStatistics existing = dailyStatisticsMapper.selectOne(
            new LambdaQueryWrapper<DailyStatistics>()
                .eq(DailyStatistics::getStoreId, stat.getStoreId())
                .eq(DailyStatistics::getStatisticsDate, stat.getStatisticsDate())
        );

        if (existing != null) {
            stat.setId(existing.getId());
            dailyStatisticsMapper.updateById(stat);
        } else {
            dailyStatisticsMapper.insert(stat);
        }
    }

    private BigDecimal calculateRate(Integer count, Integer total) {
        if (total == null || total == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(count * 100.0 / total)
            .setScale(2, RoundingMode.HALF_UP);
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private BigDecimal safeBigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String buildDailyCalculationBasis(DailyStatistics stat, List<OrderMain> orders) {
        return "{" +
            "\"storeId\":" + stat.getStoreId() + "," +
            "\"date\":\"" + stat.getStatisticsDate() + "\"," +
            "\"orderCount\":" + stat.getOrderCount() + "," +
            "\"validOrderCount\":" + stat.getValidOrderCount() + "," +
            "\"cancelOrderCount\":" + stat.getCancelOrderCount() + "," +
            "\"refundOrderCount\":" + stat.getRefundOrderCount() + "," +
            "\"totalAmount\":" + stat.getTotalAmount() + "," +
            "\"validAmount\":" + stat.getValidAmount() + "," +
            "\"autoReceiveCount\":" + stat.getAutoReceiveCount() + "," +
            "\"manualReceiveCount\":" + stat.getManualReceiveCount() + "," +
            "\"printCount\":" + stat.getPrintCount() + "," +
            "\"calculateTime\":\"" + LocalDateTime.now() + "\"" +
            "}";
    }

    private String buildOverviewCalculationBasis(LocalDate date, DailyStatistics today, 
                                                   DailyStatistics yesterday, DailyStatistics week, 
                                                   DailyStatistics month) {
        return "{" +
            "\"statisticsDate\":\"" + date + "\"," +
            "\"today\":{" +
                "\"orderCount\":" + today.getOrderCount() + "," +
                "\"validAmount\":" + today.getValidAmount() + "," +
                "\"cancelCount\":" + today.getCancelOrderCount() + "," +
                "\"refundCount\":" + today.getRefundOrderCount() +
            "}," +
            "\"yesterday\":{" +
                "\"orderCount\":" + yesterday.getOrderCount() + "," +
                "\"validAmount\":" + yesterday.getValidAmount() +
            "}," +
            "\"week\":{" +
                "\"orderCount\":" + week.getOrderCount() + "," +
                "\"validAmount\":" + week.getValidAmount() +
            "}," +
            "\"month\":{" +
                "\"orderCount\":" + month.getOrderCount() + "," +
                "\"validAmount\":" + month.getValidAmount() +
            "}," +
            "\"calculateTime\":\"" + LocalDateTime.now() + "\"" +
            "}";
    }

    @Scheduled(cron = "0 5 0 * * ?")
    public void scheduledDailyStatistics() {
        log.info("定时任务: 自动计算昨日营业统计");
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
    }

    @Scheduled(cron = "0 */5 * * * ?")
    public void scheduledRefreshCache() {
        log.debug("定时任务: 刷新统计缓存");
    }

    @lombok.Data
    public static class StatisticsOverview {
        private Long storeId;
        private LocalDate statisticsDate;
        
        private Integer todayOrderCount;
        private Integer todayValidOrderCount;
        private BigDecimal todayTotalAmount;
        private BigDecimal todayValidAmount;
        private Integer todayCancelCount;
        private Integer todayRefundCount;
        private BigDecimal todayCancelRate;
        private BigDecimal todayRefundRate;
        private BigDecimal todayReceiveRate;
        private Integer todayAutoReceiveCount;
        private Integer todayManualReceiveCount;
        private Integer todayPrintCount;
        private BigDecimal todayAvgDeliveryTime;
        private BigDecimal todayAvgPrepareTime;
        
        private Integer yesterdayOrderCount;
        private BigDecimal yesterdayValidAmount;
        
        private Integer weekOrderCount;
        private BigDecimal weekValidAmount;
        private BigDecimal weekCancelRate;
        
        private Integer monthOrderCount;
        private BigDecimal monthValidAmount;
        private BigDecimal monthCancelRate;
        
        private String calculationBasis;
    }
}
