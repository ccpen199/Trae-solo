package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentResultDTO {
    private boolean success;
    private String transactionNo;
    private BigDecimal actualAmount;
    private String paymentMethod;
    private LocalDateTime transactionTime;
    private String message;
}
