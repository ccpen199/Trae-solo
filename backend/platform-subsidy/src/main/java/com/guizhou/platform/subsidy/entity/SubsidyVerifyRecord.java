package com.guizhou.platform.subsidy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("subsidy_verify_record")
public class SubsidyVerifyRecord extends BaseEntity {

    private String verifyNo;

    private Long grantId;

    private String grantNo;

    private Long policyId;

    private String policyCode;

    private String beneficiaryId;

    private String beneficiaryName;

    private String merchantId;

    private String merchantName;

    private BigDecimal verifyAmount;

    private BigDecimal originalAmount;

    private BigDecimal subsidyAmount;

    private BigDecimal selfPayAmount;

    private LocalDateTime verifyTime;

    private String verifyPlace;

    private String verifyItems;

    private String certificateNo;

    private String transactionNo;

    private String paymentVoucher;

    private Integer verifyStatus;

    private String auditorId;

    private String auditorName;

    private LocalDateTime auditTime;

    private String auditOpinion;

    private String remark;

    private String blockchainTxHash;
}
