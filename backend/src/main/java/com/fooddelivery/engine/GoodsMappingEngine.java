package com.fooddelivery.engine;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fooddelivery.entity.GoodsMapping;
import com.fooddelivery.entity.OrderDetail;
import com.fooddelivery.entity.StoreGoods;
import com.fooddelivery.mapper.GoodsMappingMapper;
import com.fooddelivery.mapper.StoreGoodsMapper;
import com.fooddelivery.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class GoodsMappingEngine {

    private final GoodsMappingMapper goodsMappingMapper;
    private final StoreGoodsMapper storeGoodsMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AuditLogService auditLogService;

    private static final String MAPPING_CACHE_PREFIX = "goods:mapping:";
    private static final String MAPPING_RULE_PREFIX = "goods:mapping:rule:";

    public MappingResult mapOrderDetails(Long orderId, String orderNo, Long storeId, 
                                          Integer platformType, List<PlatformGoodsInfo> platformGoodsList) {
        log.info("菜品映射引擎开始处理: orderId={}, platformType={}, 菜品数={}", 
                orderId, platformType, platformGoodsList.size());
        
        List<OrderDetail> mappedDetails = new ArrayList<>();
        List<MappingLog> mappingLogs = new ArrayList<>();

        for (PlatformGoodsInfo platformGoods : platformGoodsList) {
            MappingResultDetail detail = mapSingleGoods(storeId, platformType, platformGoods);
            
            OrderDetail orderDetail = buildOrderDetail(orderId, orderNo, platformGoods, detail);
            mappedDetails.add(orderDetail);

            MappingLog logEntry = new MappingLog();
            logEntry.setPlatformGoodsId(platformGoods.getPlatformGoodsId());
            logEntry.setPlatformGoodsName(platformGoods.getPlatformGoodsName());
            logEntry.setMappedGoodsId(detail.getMappedGoodsId());
            logEntry.setMappedGoodsName(detail.getMappedGoodsName());
            logEntry.setMatchType(detail.getMatchType());
            logEntry.setMatchRule(detail.getMatchRule());
            logEntry.setSuccess(detail.isSuccess());
            logEntry.setMessage(detail.getMessage());
            mappingLogs.add(logEntry);

            auditLogService.logEngineProcess(
                "GOODS_MAPPING",
                orderId,
                orderNo,
                "MAP",
                "平台菜品[" + platformGoods.getPlatformGoodsName() + "]映射为[" + detail.getMappedGoodsName() + "]",
                buildCalculationBasis(platformGoods, detail)
            );
        }

        MappingResult result = new MappingResult();
        result.setOrderId(orderId);
        result.setOrderNo(orderNo);
        result.setStoreId(storeId);
        result.setPlatformType(platformType);
        result.setMappedDetails(mappedDetails);
        result.setMappingLogs(mappingLogs);
        result.setMapTime(LocalDateTime.now());

        long successCount = mappingLogs.stream().filter(MappingLog::isSuccess).count();
        log.info("菜品映射引擎处理完成: orderId={}, 总数={}, 成功={}", 
                orderId, platformGoodsList.size(), successCount);
        
        return result;
    }

    private MappingResultDetail mapSingleGoods(Long storeId, Integer platformType, 
                                                 PlatformGoodsInfo platformGoods) {
        MappingResultDetail result = new MappingResultDetail();
        result.setSuccess(false);
        result.setMatchType(0);

        String cacheKey = MAPPING_CACHE_PREFIX + storeId + ":" + platformType + ":" 
            + platformGoods.getPlatformGoodsId() + ":" + platformGoods.getPlatformSpecId();
        
        GoodsMapping cachedMapping = (GoodsMapping) redisTemplate.opsForValue().get(cacheKey);
        if (cachedMapping != null) {
            result.setSuccess(true);
            result.setMatchType(1);
            result.setMatchRule("缓存匹配");
            result.setMappedGoodsId(cachedMapping.getMappedGoodsId());
            result.setMappedGoodsName(cachedMapping.getMappedGoodsName());
            result.setMappedSpecId(cachedMapping.getMappedSpecId());
            result.setMappedSpecName(cachedMapping.getMappedSpecName());
            result.setMessage("缓存命中");
            return result;
        }

        GoodsMapping exactMapping = goodsMappingMapper.selectOne(
            new LambdaQueryWrapper<GoodsMapping>()
                .eq(GoodsMapping::getStoreId, storeId)
                .eq(GoodsMapping::getPlatformType, platformType)
                .eq(GoodsMapping::getPlatformGoodsId, platformGoods.getPlatformGoodsId())
                .eq(GoodsMapping::getPlatformSpecId, platformGoods.getPlatformSpecId())
                .eq(GoodsMapping::getMappingStatus, 1)
        );

        if (exactMapping != null) {
            result.setSuccess(true);
            result.setMatchType(2);
            result.setMatchRule("精确ID匹配");
            result.setMappedGoodsId(exactMapping.getMappedGoodsId());
            result.setMappedGoodsName(exactMapping.getMappedGoodsName());
            result.setMappedSpecId(exactMapping.getMappedSpecId());
            result.setMappedSpecName(exactMapping.getMappedSpecName());
            result.setMessage("精确ID匹配成功");
            
            redisTemplate.opsForValue().set(cacheKey, exactMapping, 1, TimeUnit.DAYS);
            return result;
        }

        GoodsMapping nameMapping = goodsMappingMapper.selectOne(
            new LambdaQueryWrapper<GoodsMapping>()
                .eq(GoodsMapping::getStoreId, storeId)
                .eq(GoodsMapping::getPlatformType, platformType)
                .eq(GoodsMapping::getPlatformGoodsName, platformGoods.getPlatformGoodsName())
                .eq(GoodsMapping::getPlatformSpecName, platformGoods.getPlatformSpecName())
                .eq(GoodsMapping::getMappingStatus, 1)
        );

        if (nameMapping != null) {
            result.setSuccess(true);
            result.setMatchType(3);
            result.setMatchRule("名称精确匹配");
            result.setMappedGoodsId(nameMapping.getMappedGoodsId());
            result.setMappedGoodsName(nameMapping.getMappedGoodsName());
            result.setMappedSpecId(nameMapping.getMappedSpecId());
            result.setMappedSpecName(nameMapping.getMappedSpecName());
            result.setMessage("名称精确匹配成功");
            
            redisTemplate.opsForValue().set(cacheKey, nameMapping, 1, TimeUnit.DAYS);
            return result;
        }

        List<StoreGoods> storeGoodsList = storeGoodsMapper.selectList(
            new LambdaQueryWrapper<StoreGoods>()
                .eq(StoreGoods::getStoreId, storeId)
                .eq(StoreGoods::getStatus, 1)
        );

        for (StoreGoods storeGoods : storeGoodsList) {
            if (calculateSimilarity(platformGoods.getPlatformGoodsName(), storeGoods.getGoodsName()) > 0.8) {
                result.setSuccess(true);
                result.setMatchType(4);
                result.setMatchRule("模糊名称匹配");
                result.setMappedGoodsId(storeGoods.getId());
                result.setMappedGoodsName(storeGoods.getGoodsName());
                result.setMessage("模糊匹配: " + platformGoods.getPlatformGoodsName() + " -> " + storeGoods.getGoodsName());
                
                GoodsMapping newMapping = new GoodsMapping();
                newMapping.setStoreId(storeId);
                newMapping.setPlatformType(platformType);
                newMapping.setPlatformGoodsId(platformGoods.getPlatformGoodsId());
                newMapping.setPlatformGoodsName(platformGoods.getPlatformGoodsName());
                newMapping.setPlatformSpecId(platformGoods.getPlatformSpecId());
                newMapping.setPlatformSpecName(platformGoods.getPlatformSpecName());
                newMapping.setMappedGoodsId(storeGoods.getId());
                newMapping.setMappedGoodsName(storeGoods.getGoodsName());
                newMapping.setMatchType(4);
                newMapping.setMatchRule("模糊名称匹配");
                newMapping.setMappingStatus(1);
                goodsMappingMapper.insert(newMapping);
                
                redisTemplate.opsForValue().set(cacheKey, newMapping, 1, TimeUnit.DAYS);
                return result;
            }
        }

        result.setSuccess(false);
        result.setMatchType(0);
        result.setMatchRule("无匹配");
        result.setMappedGoodsName(platformGoods.getPlatformGoodsName());
        result.setMappedSpecName(platformGoods.getPlatformSpecName());
        result.setMessage("未找到匹配菜品，使用平台原始名称");
        
        return result;
    }

    private double calculateSimilarity(String str1, String str2) {
        if (str1 == null || str2 == null) return 0;
        if (str1.equals(str2)) return 1.0;
        
        String s1 = str1.replaceAll("[\\s\\p{Punct}]", "").toLowerCase();
        String s2 = str2.replaceAll("[\\s\\p{Punct}]", "").toLowerCase();
        
        if (s1.contains(s2) || s2.contains(s1)) {
            return 0.85;
        }
        
        int matches = 0;
        for (char c : s1.toCharArray()) {
            if (s2.indexOf(c) >= 0) {
                matches++;
            }
        }
        
        return (double) matches / Math.max(s1.length(), s2.length());
    }

    private OrderDetail buildOrderDetail(Long orderId, String orderNo, 
                                          PlatformGoodsInfo platformGoods, MappingResultDetail detail) {
        OrderDetail orderDetail = new OrderDetail();
        orderDetail.setOrderId(orderId);
        orderDetail.setOrderNo(orderNo);
        orderDetail.setPlatformGoodsId(platformGoods.getPlatformGoodsId());
        orderDetail.setPlatformGoodsName(platformGoods.getPlatformGoodsName());
        orderDetail.setPlatformSpecName(platformGoods.getPlatformSpecName());
        orderDetail.setMappedGoodsId(detail.getMappedGoodsId());
        orderDetail.setMappedGoodsName(detail.getMappedGoodsName());
        orderDetail.setMappedSpecName(detail.getMappedSpecName());
        orderDetail.setQuantity(platformGoods.getQuantity());
        orderDetail.setUnitPrice(platformGoods.getUnitPrice());
        orderDetail.setTotalPrice(platformGoods.getTotalPrice());
        orderDetail.setGoodsRemark(platformGoods.getGoodsRemark());
        orderDetail.setGoodsStatus(1);
        return orderDetail;
    }

    private String buildCalculationBasis(PlatformGoodsInfo goods, MappingResultDetail detail) {
        return "{" +
            "\"platformGoodsId\":\"" + goods.getPlatformGoodsId() + "\"," +
            "\"platformGoodsName\":\"" + goods.getPlatformGoodsName() + "\"," +
            "\"platformSpecId\":\"" + goods.getPlatformSpecId() + "\"," +
            "\"platformSpecName\":\"" + goods.getPlatformSpecName() + "\"," +
            "\"matchType\":" + detail.getMatchType() + "," +
            "\"matchRule\":\"" + detail.getMatchRule() + "\"," +
            "\"mappedGoodsId\":\"" + detail.getMappedGoodsId() + "\"," +
            "\"mappedGoodsName\":\"" + detail.getMappedGoodsName() + "\"," +
            "\"success\":" + detail.isSuccess() + "," +
            "\"message\":\"" + detail.getMessage() + "\"" +
            "}";
    }

    @lombok.Data
    public static class PlatformGoodsInfo {
        private Long platformGoodsId;
        private String platformGoodsName;
        private Long platformSpecId;
        private String platformSpecName;
        private Integer quantity;
        private java.math.BigDecimal unitPrice;
        private java.math.BigDecimal totalPrice;
        private String goodsRemark;
    }

    @lombok.Data
    public static class MappingResultDetail {
        private boolean success;
        private Integer matchType;
        private String matchRule;
        private Long mappedGoodsId;
        private String mappedGoodsName;
        private Long mappedSpecId;
        private String mappedSpecName;
        private String message;
    }

    @lombok.Data
    public static class MappingResult {
        private Long orderId;
        private String orderNo;
        private Long storeId;
        private Integer platformType;
        private List<OrderDetail> mappedDetails;
        private List<MappingLog> mappingLogs;
        private LocalDateTime mapTime;
    }

    @lombok.Data
    public static class MappingLog {
        private Long platformGoodsId;
        private String platformGoodsName;
        private Long mappedGoodsId;
        private String mappedGoodsName;
        private Integer matchType;
        private String matchRule;
        private boolean success;
        private String message;
    }
}
