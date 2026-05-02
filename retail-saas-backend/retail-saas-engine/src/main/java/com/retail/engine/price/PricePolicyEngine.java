package com.retail.engine.price;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface PricePolicyEngine {

    PriceResult calculatePrice(Long productId, Long orgId, String priceSystemCode, LocalDateTime time);

    PriceResult calculatePromotionPrice(Long productId, Long orgId, LocalDateTime time);

    boolean validateMargin(Long productId, BigDecimal price);

    PriceResult getCurrentPrice(Long productId, Long orgId);

    List<PriceVersionVO> getPriceHistory(Long productId);
}
