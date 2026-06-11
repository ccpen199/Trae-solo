package com.guizhou.platform.government.enums;

import lombok.Getter;

@Getter
public enum ServiceStatusEnum {

    DRAFT(0, "草稿"),
    PUBLISHED(1, "已发布"),
    ACTIVE(2, "在办"),
    SUSPENDED(3, "暂停"),
    DEPRECATED(4, "已下架"),
    CANCELLED(5, "已取消");

    private final Integer code;
    private final String desc;

    ServiceStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static ServiceStatusEnum getByCode(Integer code) {
        for (ServiceStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
