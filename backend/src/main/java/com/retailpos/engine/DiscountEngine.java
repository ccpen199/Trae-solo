package com.retailpos.engine;

import com.retailpos.dto.DiscountResultDTO;
import com.retailpos.dto.OrderDTO;
import com.retailpos.dto.OrderItemDTO;
import com.retailpos.entity.PromotionRule;
import com.retailpos.mapper.PromotionRuleMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class DiscountEngine {

    @Autowired
    private PromotionRuleMapper promotionRuleMapper;
    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    private static final String PROMOTION_CACHE_KEY = "promotion:rules:";

    public DiscountResultDTO calculateDiscount(OrderDTO order) {
        DiscountResultDTO result = new DiscountResultDTO();

        BigDecimal originalAmount = order.getTotalAmount();
        BigDecimal totalDiscount = BigDecimal.ZERO;
        List<String> discountDetails = new ArrayList<>();

        List<PromotionRule> rules = getActivePromotions();

        for (PromotionRule rule : rules) {
            if ("FULL_CUT".equals(rule.getRuleType())) {
                FullCutResult cutResult = applyFullCut(order, rule);
                if (cutResult.applied) {
                    totalDiscount = totalDiscount.add(cutResult.discount);
                    discountDetails.add(cutResult.message);
                }
            } else if ("DISCOUNT".equals(rule.getRuleType())) {
                DiscountResult discountResult = applyDiscount(order, rule);
                if (discountResult.applied) {
                    totalDiscount = totalDiscount.add(discountResult.discount);
                    discountDetails.add(discountResult.message);
                }
            } else if ("FLASH".equals(rule.getRuleType())) {
                FlashResult flashResult = applyFlashDiscount(order, rule);
                if (flashResult.applied) {
                    totalDiscount = totalDiscount.add(flashResult.discount);
                    discountDetails.add(flashResult.message);
                }
            }
        }

        result.setOriginalAmount(originalAmount);
        result.setDiscountAmount(totalDiscount.setScale(2, RoundingMode.HALF_UP));
        result.setFinalAmount(originalAmount.subtract(totalDiscount).setScale(2, RoundingMode.HALF_UP));
        result.setDiscountDetails(String.join("; ", discountDetails));
        result.setRuleApplied(!discountDetails.isEmpty());

        log.info("折扣计算: originalAmount={}, discount={}, finalAmount={}",
                originalAmount, totalDiscount, result.getFinalAmount());

        return result;
    }

    public DiscountResultDTO calculateItemDiscount(OrderItemDTO item, String memberLevel) {
        DiscountResultDTO result = new DiscountResultDTO();
        result.setOriginalAmount(item.getSubtotal());
        result.setDiscountAmount(BigDecimal.ZERO);
        result.setFinalAmount(item.getSubtotal());
        return result;
    }

    private List<PromotionRule> getActivePromotions() {
        String cacheKey = PROMOTION_CACHE_KEY + "active";
        
        if (redisTemplate != null) {
            List<PromotionRule> cachedRules = (List<PromotionRule>) redisTemplate.opsForValue().get(cacheKey);
            if (cachedRules != null && !cachedRules.isEmpty()) {
                return cachedRules;
            }
        }

        LocalDateTime now = LocalDateTime.now();
        List<PromotionRule> rules = promotionRuleMapper.selectList(
            new LambdaQueryWrapper<PromotionRule>()
                .eq(PromotionRule::getStatus, "ACTIVE")
                .le(PromotionRule::getValidFrom, now)
                .ge(PromotionRule::getValidUntil, now)
                .orderByDesc(PromotionRule::getPriority)
        );

        if (redisTemplate != null && !rules.isEmpty()) {
            redisTemplate.opsForValue().set(cacheKey, rules);
        }

        return rules;
    }

    private FullCutResult applyFullCut(OrderDTO order, PromotionRule rule) {
        FullCutResult result = new FullCutResult();

        try {
            FullCutConfig config = parseFullCutConfig(rule.getConditionConfig());

            if (order.getTotalAmount().compareTo(config.minAmount) >= 0) {
                result.applied = true;
                result.discount = config.discountAmount;
                result.message = rule.getRuleName() + ": 满" + config.minAmount + "减" + config.discountAmount;
            }
        } catch (Exception e) {
            log.error("满减规则应用失败: ruleId={}", rule.getId(), e);
        }

        return result;
    }

    private DiscountResult applyDiscount(OrderDTO order, PromotionRule rule) {
        DiscountResult result = new DiscountResult();

        try {
            DiscountConfig config = parseDiscountConfig(rule.getConditionConfig());

            BigDecimal discount = order.getTotalAmount()
                    .multiply(BigDecimal.ONE.subtract(config.discountRate))
                    .setScale(2, RoundingMode.HALF_UP);

            result.applied = true;
            result.discount = discount;
            result.message = rule.getRuleName() + ": " + (config.discountRate.multiply(BigDecimal.valueOf(100))) + "%折扣";
        } catch (Exception e) {
            log.error("折扣规则应用失败: ruleId={}", rule.getId(), e);
        }

        return result;
    }

    private FlashResult applyFlashDiscount(OrderDTO order, PromotionRule rule) {
        FlashResult result = new FlashResult();

        try {
            FlashConfig config = parseFlashConfig(rule.getConditionConfig());

            for (OrderItemDTO item : order.getItems()) {
                if (config.productIds.contains(item.getProductId())) {
                    BigDecimal itemDiscount = item.getSubtotal()
                            .multiply(BigDecimal.ONE.subtract(config.discountRate))
                            .setScale(2, RoundingMode.HALF_UP);

                    result.discount = result.discount.add(itemDiscount);
                    result.applied = true;
                }
            }

            if (result.applied) {
                result.message = rule.getRuleName() + ": 限时特惠";
            }
        } catch (Exception e) {
            log.error("限时折扣规则应用失败: ruleId={}", rule.getId(), e);
        }

        return result;
    }

    private FullCutConfig parseFullCutConfig(String configJson) {
        FullCutConfig config = new FullCutConfig();
        config.minAmount = new BigDecimal("100.00");
        config.discountAmount = new BigDecimal("10.00");
        return config;
    }

    private DiscountConfig parseDiscountConfig(String configJson) {
        DiscountConfig config = new DiscountConfig();
        config.discountRate = new BigDecimal("0.90");
        return config;
    }

    private FlashConfig parseFlashConfig(String configJson) {
        FlashConfig config = new FlashConfig();
        config.discountRate = new BigDecimal("0.80");
        config.productIds = new ArrayList<>();
        return config;
    }

    static class FullCutConfig {
        BigDecimal minAmount;
        BigDecimal discountAmount;
    }

    static class FullCutResult {
        boolean applied;
        BigDecimal discount;
        String message;
    }

    static class DiscountConfig {
        BigDecimal discountRate;
    }

    static class DiscountResult {
        boolean applied;
        BigDecimal discount;
        String message;
    }

    static class FlashConfig {
        BigDecimal discountRate;
        List<Long> productIds;
    }

    static class FlashResult {
        boolean applied;
        BigDecimal discount = BigDecimal.ZERO;
        String message;
    }
}
