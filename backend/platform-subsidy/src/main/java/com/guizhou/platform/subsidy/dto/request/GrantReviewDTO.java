package com.guizhou.platform.subsidy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class GrantReviewDTO {

    @NotNull(message = "发放ID不能为空")
    private Long grantId;

    @NotNull(message = "审核结果不能为空")
    private Boolean passed;

    private String reviewOpinion;

    private BigDecimal approvedAmount;

    private String reviewerName;
}
