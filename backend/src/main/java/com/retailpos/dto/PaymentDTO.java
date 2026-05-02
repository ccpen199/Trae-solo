package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentDTO {
    private String orderNo;
    private String paymentMethod;
    private BigDecimal amount;
    private Integer pointsToUse;
    private Long couponId;
}
