package com.guizhou.platform.monitor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class SlaAgreementDTO {

    @NotBlank(message = "服务编码不能为空")
    private String serviceCode;

    @NotBlank(message = "服务名称不能为空")
    private String serviceName;

    @NotNull(message = "可用性目标不能为空")
    private BigDecimal availabilityTarget;

    @NotNull(message = "响应时间目标不能为空")
    private BigDecimal responseTimeTarget;

    @NotNull(message = "错误率目标不能为空")
    private BigDecimal errorRateTarget;

    private BigDecimal penaltyClause;

    @NotNull(message = "生效日期不能为空")
    private LocalDateTime effectiveDate;

    @NotNull(message = "到期日期不能为空")
    private LocalDateTime expiryDate;

    private String description;
}
