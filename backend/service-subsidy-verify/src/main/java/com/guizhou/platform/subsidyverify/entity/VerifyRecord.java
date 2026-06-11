package com.guizhou.platform.subsidyverify.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("verify_record")
public class VerifyRecord extends BaseEntity {

    private String verifyNo;

    private Long voucherId;

    private String voucherNo;

    private Long policyId;

    private String policyCode;

    private String policyName;

    private Long beneficiaryId;

    private String beneficiaryName;

    private String idCard;

    private String phone;

    private Long merchantId;

    private String merchantName;

    private String merchantCode;

    private String merchantCategory;

    private BigDecimal originalAmount;

    private BigDecimal subsidyAmount;

    private BigDecimal selfPayAmount;

    private Integer verifyType;

    private Integer verifyStatus;

    private LocalDateTime verifyTime;

    private String verifyPlace;

    private String verifyDevice;

    private String verifyItems;

    private String certificateNo;

    private String transactionNo;

    private String paymentVoucher;

    private String auditorId;

    private String auditorName;

    private LocalDateTime auditTime;

    private String auditOpinion;

    private String remark;

    private String subsidyServiceTxId;
}
