package com.guizhou.platform.payment.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BillInfoVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String billNo;

    private Integer billType;

    private String billTypeName;

    private String accountNo;

    private String accountName;

    private String accountAddr;

    private String companyCode;

    private String companyName;

    private BigDecimal billAmount;

    private BigDecimal penaltyAmount;

    private BigDecimal totalAmount;

    private LocalDate billPeriodStart;

    private LocalDate billPeriodEnd;

    private LocalDate dueDate;

    private Integer billStatus;

    private String billStatusDesc;

    private String billMonth;

    private BigDecimal lastReading;

    private BigDecimal currentReading;

    private BigDecimal usageAmount;

    private String unit;

    private BigDecimal unitPrice;
}
