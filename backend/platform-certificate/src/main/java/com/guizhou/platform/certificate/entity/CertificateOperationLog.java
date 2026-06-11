package com.guizhou.platform.certificate.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("certificate_operation_log")
public class CertificateOperationLog extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private Long certificateId;

    private String certificateNo;

    private String operationType;

    private String operationContent;

    private Long operatorId;

    private String operatorName;

    private LocalDateTime operationTime;

    private String ipAddress;

    private String userAgent;

    private String extendInfo;
}
