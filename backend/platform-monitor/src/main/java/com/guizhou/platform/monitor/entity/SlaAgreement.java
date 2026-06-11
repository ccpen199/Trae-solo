package com.guizhou.platform.monitor.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sla_agreement")
public class SlaAgreement extends BaseEntity {

    private String agreementCode;

    private Long serviceId;

    private String serviceCode;

    private String serviceName;

    private BigDecimal availabilityTarget;

    private BigDecimal responseTimeTarget;

    private BigDecimal errorRateTarget;

    private BigDecimal penaltyClause;

    private LocalDateTime effectiveDate;

    private LocalDateTime expiryDate;

    private String status;

    private String description;
}
