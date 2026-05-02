package com.fooddelivery.enums;

import lombok.Getter;

@Getter
public enum RoleType {
    MERCHANT(1, "商家", "商家角色，拥有店铺管理权限"),
    STORE_CLERK(2, "店员", "店员角色，处理日常订单"),
    RIDER(3, "骑手", "骑手角色，处理配送"),
    PLATFORM(4, "平台", "平台管理员"),
    ADMIN(5, "系统管理员", "系统管理员");

    private final int code;
    private final String name;
    private final String description;

    RoleType(int code, String name, String description) {
        this.code = code;
        this.name = name;
        this.description = description;
    }

    public static RoleType fromCode(int code) {
        for (RoleType type : values()) {
            if (type.getCode() == code) {
                return type;
            }
        }
        throw new IllegalArgumentException("未知角色类型: " + code);
    }
}
