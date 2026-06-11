package com.guizhou.platform.subsidyverify.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("verify_statistics")
public class VerifyStatistics extends BaseEntity {

    private String statDate;

    private Long merchantId;

    private String merchantName;

    private String merchantCategory;

    private Long policyId;

    private String policyCode;

    private String policyName;

    private Integer verifyCount;

    private BigDecimal totalOriginalAmount;

    private BigDecimal totalSubsidyAmount;

    private BigDecimal totalSelfPayAmount;

    private Integer successCount;

    private Integer failCount;

    private BigDecimal successRate;
}
