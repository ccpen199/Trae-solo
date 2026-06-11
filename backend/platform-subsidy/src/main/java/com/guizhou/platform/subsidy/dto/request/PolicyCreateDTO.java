package com.guizhou.platform.subsidy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PolicyCreateDTO {

    @NotBlank(message = "政策名称不能为空")
    private String policyName;

    @NotBlank(message = "政策类型不能为空")
    private String policyType;

    @NotBlank(message = "主管部门不能为空")
    private String department;

    @NotBlank(message = "部门编码不能为空")
    private String departmentCode;

    @NotNull(message = "总预算不能为空")
    private BigDecimal totalBudget;

    @NotNull(message = "补贴标准不能为空")
    private BigDecimal subsidyStandard;

    private String subsidyUnit;

    private Integer grantCycle;

    private String grantCycleUnit;

    private String eligibilityCriteria;

    private String applicationMaterials;

    @NotNull(message = "生效日期不能为空")
    private LocalDate effectiveDate;

    @NotNull(message = "到期日期不能为空")
    private LocalDate expiryDate;

    private String reviewProcess;

    private Integer reviewLevel;

    private String description;

    private String attachment;
}
