package com.guizhou.platform.subsidy.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class FundTraceVO {

    private String flowNo;

    private Long grantId;

    private String grantNo;

    private Long policyId;

    private String policyCode;

    private Integer flowType;

    private String flowTypeDesc;

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

    private List<FundTraceVO> children;
}
