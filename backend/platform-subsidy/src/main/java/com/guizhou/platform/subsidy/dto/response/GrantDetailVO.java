package com.guizhou.platform.subsidy.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class GrantDetailVO {

    private Long id;

    private String grantNo;

    private Long policyId;

    private String policyCode;

    private String policyName;

    private String beneficiaryType;

    private String beneficiaryId;

    private String beneficiaryName;

    private String idCard;

    private String phone;

    private String bankAccount;

    private String bankName;

    private String bankCode;

    private BigDecimal applyAmount;

    private BigDecimal approvedAmount;

    private BigDecimal grantedAmount;

    private Integer grantStatus;

    private String grantStatusDesc;

    private String applyReason;

    private String applyMaterials;

    private String reviewOpinion;

    private String approveOpinion;

    private Long reviewerId;

    private String reviewerName;

    private LocalDateTime reviewTime;

    private Long approverId;

    private String approverName;

    private LocalDateTime approveTime;

    private LocalDateTime grantTime;

    private String transactionNo;

    private String remark;

    private String blockchainTxHash;

    private Boolean riskFlag;

    private String riskLevel;

    private String riskDesc;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
