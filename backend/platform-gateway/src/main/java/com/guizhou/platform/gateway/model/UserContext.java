package com.guizhou.platform.gateway.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserContext implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long userId;

    private String username;

    private String realName;

    private String idCard;

    private String phone;

    private String email;

    private List<String> roles;

    private List<String> permissions;

    private String tenantId;

    private String userType;

    private Long loginTime;

    private String loginIp;
}
