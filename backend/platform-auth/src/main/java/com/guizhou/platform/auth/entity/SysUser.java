package com.guizhou.platform.auth.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_user")
public class SysUser extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String username;

    private String password;

    private String nickname;

    private String realName;

    private String idCard;

    private String phone;

    private String email;

    private String avatar;

    private Integer gender;

    private LocalDate birthday;

    private String address;

    private Integer status;

    private String openid;

    private String alipayId;

    private String faceFeature;

    private Integer loginFailCount;

    private LocalDateTime lockTime;

    private LocalDateTime lastLoginTime;

    private String lastLoginIp;

    private String remark;
}
