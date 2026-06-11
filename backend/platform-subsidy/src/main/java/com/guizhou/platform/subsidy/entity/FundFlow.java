package com.guizhou.platform.subsidy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("fund_flow")
public class FundFlow extends BaseEntity {

    private String flowNo;

    private Long grantId;

    private String grantNo;

    private Long policyId;

    private String policyCode;

    private Integer flowType;

    private String fromAccount;

    private String fromAccountName;

    private String fromType;

    private String toAccount;

    private String toAccountName;

    private String toType;

    private BigDecimal amount;

    private String currency;

    private LocalDateTime occurTime;

    private String transactionNo;

    private String bankOrderNo;

    private String traceId;

    private String parentFlowNo;

    private Integer traceDepth;

    private String remark;

    private String blockchainTxHash;

    private Boolean onChain;

    private LocalDateTime onChainTime;

    private String onChainOperator;
}
