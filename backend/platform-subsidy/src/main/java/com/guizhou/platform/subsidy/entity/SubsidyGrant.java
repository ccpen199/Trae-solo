package com.guizhou.platform.subsidy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("subsidy_grant")
public class SubsidyGrant extends BaseEntity {

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
}
