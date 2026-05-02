package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RefundDTO {
    private Long transactionId;
    private String refundReason;
    private BigDecimal refundAmount;
    private String refundMethod;
    private Long operatorId;
}
