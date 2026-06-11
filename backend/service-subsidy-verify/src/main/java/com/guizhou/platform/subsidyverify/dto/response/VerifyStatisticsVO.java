package com.guizhou.platform.subsidyverify.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class VerifyStatisticsVO implements Serializable {

    private static final long serialVersionUID = 1L;

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
