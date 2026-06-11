package com.guizhou.platform.subsidy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("subsidy_audit_log")
public class SubsidyAuditLog extends BaseEntity {

    private String logNo;

    private String businessType;

    private Long businessId;

    private String businessNo;

    private Integer operationType;

    private String operationName;

    private Long operatorId;

    private String operatorName;

    private String operatorDept;

    private LocalDateTime operationTime;

    private String beforeData;

    private String afterData;

    private String changeContent;

    private String operationIp;

    private String operationDevice;

    private String remark;

    private String blockchainTxHash;
}
