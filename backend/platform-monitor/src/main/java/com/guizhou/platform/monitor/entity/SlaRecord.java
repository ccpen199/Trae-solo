package com.guizhou.platform.monitor.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sla_record")
public class SlaRecord extends BaseEntity {

    private Long agreementId;

    private String agreementCode;

    private Long serviceId;

    private String serviceCode;

    private String serviceName;

    private LocalDate checkMonth;

    private BigDecimal totalMinutes;

    private BigDecimal downtimeMinutes;

    private BigDecimal actualAvailability;

    private BigDecimal availabilityTarget;

    private BigDecimal avgResponseTime;

    private BigDecimal responseTimeTarget;

    private BigDecimal errorRate;

    private BigDecimal errorRateTarget;

    private Long totalRequests;

    private Long failedRequests;

    private String checkStatus;

    private String checkResult;

    private String remark;
}
