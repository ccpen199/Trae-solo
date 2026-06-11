package com.guizhou.platform.subsidy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("subsidy_policy")
public class SubsidyPolicy extends BaseEntity {

    private String policyCode;

    private String policyName;

    private String policyType;

    private Integer policyStatus;

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
}
