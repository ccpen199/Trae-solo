package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("audit_log")
public class AuditLog extends BaseEntity {

    private String traceId;

    private String businessType;

    private Long businessId;

    private String businessNo;

    private String sourceType;

    private String sourceName;

    private Long operatorId;

    private String operatorName;

    private String operatorRole;

    private String action;

    private String actionName;

    private Integer fromStatus;

    private String fromStatusName;

    private Integer toStatus;

    private String toStatusName;

    private String detail;

    private String requestIp;

    private String userAgent;

    private LocalDateTime operateTime;

    private String extInfo;
}
