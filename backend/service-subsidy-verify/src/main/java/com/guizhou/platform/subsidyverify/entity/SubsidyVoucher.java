package com.guizhou.platform.subsidyverify.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("subsidy_voucher")
public class SubsidyVoucher extends BaseEntity {

    private String voucherNo;

    private Long policyId;

    private String policyCode;

    private String policyName;

    private Long beneficiaryId;

    private String beneficiaryName;

    private String idCard;

    private BigDecimal totalAmount;

    private BigDecimal usedAmount;

    private BigDecimal remainingAmount;

    private Integer voucherStatus;

    private LocalDateTime effectiveTime;

    private LocalDateTime expiryTime;

    private String issueBatchNo;

    private String issueReason;

    private LocalDateTime usedTime;

    private String remark;
}
