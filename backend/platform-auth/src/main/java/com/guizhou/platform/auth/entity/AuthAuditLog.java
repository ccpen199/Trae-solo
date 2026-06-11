package com.guizhou.platform.auth.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("auth_audit_log")
public class AuthAuditLog extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private Long userId;

    private String username;

    private String loginType;

    private String clientId;

    private String ipAddress;

    private String userAgent;

    private String deviceInfo;

    private String location;

    private Boolean success;

    private String failReason;

    private LocalDateTime operateTime;

    private String traceId;

    private String extraInfo;
}
