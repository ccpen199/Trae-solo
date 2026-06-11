package com.guizhou.platform.certificate.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("certificate_verify_log")
public class CertificateVerifyLog extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private Long certificateId;

    private String certificateNo;

    private Integer verifyType;

    private String verifyContent;

    private String verifierId;

    private String verifierName;

    private String verifierOrg;

    private LocalDateTime verifyTime;

    private Boolean verifyResult;

    private String verifyDetail;

    private String ipAddress;

    private String userAgent;

    private String extendInfo;
}
