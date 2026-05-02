package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DiscountResultDTO {
    private BigDecimal originalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String discountDetails;
    private boolean ruleApplied;
}
