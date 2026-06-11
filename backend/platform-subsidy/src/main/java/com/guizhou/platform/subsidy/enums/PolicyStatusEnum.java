package com.guizhou.platform.subsidy.enums;

import lombok.Getter;

@Getter
public enum PolicyStatusEnum {

    DRAFT(0, "草稿"),
    PUBLISHED(1, "已发布"),
    ACTIVE(2, "执行中"),
    PAUSED(3, "已暂停"),
    EXPIRED(4, "已过期"),
    CANCELLED(5, "已取消");

    private final Integer code;
    private final String desc;

    PolicyStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static PolicyStatusEnum getByCode(Integer code) {
        for (PolicyStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
