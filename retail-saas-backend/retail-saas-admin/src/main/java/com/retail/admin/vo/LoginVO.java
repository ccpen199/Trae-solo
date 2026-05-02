package com.retail.admin.vo;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class LoginVO {

    private String token;

    private Long userId;

    private String username;

    private String realName;

    private Long orgId;

    private String orgName;

    private String dataScope;

    private List<String> roles;

    private List<String> permissions;

    private List<MenuVO> menus;
}
