package com.fooddelivery.engine;

import com.fooddelivery.entity.OrderMain;
import com.fooddelivery.enums.AuditSource;
import com.fooddelivery.enums.OrderEvent;
import com.fooddelivery.service.AuditLogService;
import com.fooddelivery.service.OrderStateMachineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderAggregationEngine {

    private final RedisTemplate<String, Object> redisTemplate;
    private final OrderStateMachineService orderStateMachineService;
    private final AuditLogService auditLogService;

    private static final String AGGREGATION_CACHE_PREFIX = "order:aggregation:";
    private static final String PLATFORM_ORDER_PREFIX = "platform:order:";

    public AggregationResult aggregateOrders(Long storeId, List<PlatformOrderInfo> platformOrders) {
        log.info("订单聚合引擎开始处理: storeId={}, 平台订单数={}", storeId, platformOrders.size());
        
        List<OrderMain> newOrders = new ArrayList<>();
        List<OrderMain> updatedOrders = new ArrayList<>();
        List<String> skippedOrders = new ArrayList<>();

        for (PlatformOrderInfo platformOrder : platformOrders) {
            String cacheKey = PLATFORM_ORDER_PREFIX + platformOrder.getPlatformType() + ":" + platformOrder.getPlatformOrderNo();
            
            Boolean exists = redisTemplate.hasKey(cacheKey);
            if (Boolean.TRUE.equals(exists)) {
                skippedOrders.add(platformOrder.getPlatformOrderNo());
                continue;
            }

            OrderMain order = convertToOrderMain(platformOrder, storeId);
            newOrders.add(order);

            redisTemplate.opsForValue().set(cacheKey, order, 7, TimeUnit.DAYS);

            auditLogService.logEngineProcess(
                "ORDER_AGGREGATION",
                order.getId(),
                order.getOrderNo(),
                "AGGREGATE",
                "从平台" + platformOrder.getPlatformTypeName() + "拉取订单并聚合",
                buildCalculationBasis(platformOrder)
            );
        }

        AggregationResult result = new AggregationResult();
        result.setNewOrders(newOrders);
        result.setUpdatedOrders(updatedOrders);
        result.setSkippedOrders(skippedOrders);
        result.setTotalProcessed(platformOrders.size());
        result.setStoreId(storeId);
        result.setAggregateTime(LocalDateTime.now());

        log.info("订单聚合引擎处理完成: storeId={}, 新增={}, 跳过={}", 
                storeId, newOrders.size(), skippedOrders.size());
        
        return result;
    }

    public void processPaymentConfirmed(OrderMain order) {
        log.info("订单聚合引擎处理支付确认: orderId={}", order.getId());
        
        boolean success = orderStateMachineService.triggerEvent(
            order.getId(),
            OrderEvent.PAYMENT_CONFIRMED,
            null,
            AuditSource.PLATFORM_CALLBACK,
            "平台支付确认回调"
        );

        if (success) {
            auditLogService.logEngineProcess(
                "ORDER_AGGREGATION",
                order.getId(),
                order.getOrderNo(),
                "PAYMENT_CONFIRMED",
                "支付确认完成，订单进入待接单状态",
                "{\"source\":\"PLATFORM_CALLBACK\",\"timestamp\":\"" + LocalDateTime.now() + "\"}"
            );
        }
    }

    private OrderMain convertToOrderMain(PlatformOrderInfo platformOrder, Long storeId) {
        OrderMain order = new OrderMain();
        order.setOrderNo(generateOrderNo());
        order.setPlatformOrderNo(platformOrder.getPlatformOrderNo());
        order.setStoreId(storeId);
        order.setPlatformType(platformOrder.getPlatformType());
        order.setPlatformStoreId(platformOrder.getPlatformStoreId());
        order.setCustomerName(platformOrder.getCustomerName());
        order.setCustomerPhone(platformOrder.getCustomerPhone());
        order.setDeliveryAddress(platformOrder.getDeliveryAddress());
        order.setLongitude(platformOrder.getLongitude());
        order.setLatitude(platformOrder.getLatitude());
        order.setOrderAmount(platformOrder.getOrderAmount());
        order.setGoodsAmount(platformOrder.getGoodsAmount());
        order.setDeliveryFee(platformOrder.getDeliveryFee());
        order.setPackageFee(platformOrder.getPackageFee());
        order.setDiscountAmount(platformOrder.getDiscountAmount());
        order.setPaidAmount(platformOrder.getPaidAmount());
        order.setOrderRemark(platformOrder.getOrderRemark());
        order.setDeliveryType(platformOrder.getDeliveryType());
        order.setPrinted(0);
        order.setPrintCount(0);
        order.setHasAfterSale(0);
        
        orderStateMachineService.initializeOrderState(order);
        
        return order;
    }

    private String generateOrderNo() {
        return "OD" + System.currentTimeMillis();
    }

    private String buildCalculationBasis(PlatformOrderInfo info) {
        return "{" +
            "\"platformType\":" + info.getPlatformType() + "," +
            "\"platformTypeName\":\"" + info.getPlatformTypeName() + "\"," +
            "\"platformOrderNo\":\"" + info.getPlatformOrderNo() + "\"," +
            "\"platformStoreId\":\"" + info.getPlatformStoreId() + "\"," +
            "\"pullTime\":\"" + LocalDateTime.now() + "\"," +
            "\"isNewOrder\":true" +
            "}";
    }

    @lombok.Data
    public static class PlatformOrderInfo {
        private Integer platformType;
        private String platformTypeName;
        private String platformOrderNo;
        private String platformStoreId;
        private String customerName;
        private String customerPhone;
        private String deliveryAddress;
        private String longitude;
        private String latitude;
        private java.math.BigDecimal orderAmount;
        private java.math.BigDecimal goodsAmount;
        private java.math.BigDecimal deliveryFee;
        private java.math.BigDecimal packageFee;
        private java.math.BigDecimal discountAmount;
        private java.math.BigDecimal paidAmount;
        private String orderRemark;
        private Integer deliveryType;
        private Integer platformStatus;
    }

    @lombok.Data
    public static class AggregationResult {
        private Long storeId;
        private List<OrderMain> newOrders;
        private List<OrderMain> updatedOrders;
        private List<String> skippedOrders;
        private Integer totalProcessed;
        private LocalDateTime aggregateTime;
    }
}
