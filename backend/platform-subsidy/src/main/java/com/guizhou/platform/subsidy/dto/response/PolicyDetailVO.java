package com.guizhou.platform.subsidy.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PolicyDetailVO {

    private Long id;

    private String policyCode;

    private String policyName;

    private String policyType;

    private Integer policyStatus;

    private String policyStatusDesc;

    private String department;

    private String departmentCode;

    private BigDecimal totalBudget;

    private BigDecimal grantedAmount;

    private BigDecimal remainingBudget;

    private BigDecimal subsidyStandard;

    private String subsidyUnit;

    private Integer grantCycle;

    private String grantCycleUnit;

    private String eligibilityCriteria;

    private String applicationMaterials;

    private LocalDate effectiveDate;

    private LocalDate expiryDate;

    private String reviewProcess;

    private Integer reviewLevel;

    private String description;

    private String attachment;

    private LocalDateTime publishTime;

    private Long publishBy;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
