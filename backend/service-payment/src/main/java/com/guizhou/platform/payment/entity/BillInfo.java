package com.guizhou.platform.payment.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("bill_info")
public class BillInfo extends BaseEntity {

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

    private String billMonth;

    private BigDecimal lastReading;

    private BigDecimal currentReading;

    private BigDecimal usageAmount;

    private String unit;

    private BigDecimal unitPrice;

    private String remark;
}
