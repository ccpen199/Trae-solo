package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderDTO {
    private String orderNo;
    private Long storeId;
    private Long cashierId;
    private Long memberId;
    private List<OrderItemDTO> items;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal actualAmount;
    private BigDecimal pointsDiscount;
    private BigDecimal couponDiscount;
    private Integer pointsToUse;
    private Long couponId;
}
