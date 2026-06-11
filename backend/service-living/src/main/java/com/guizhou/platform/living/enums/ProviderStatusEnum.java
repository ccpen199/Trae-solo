package com.guizhou.platform.living.enums;

import lombok.Getter;

@Getter
public enum ProviderStatusEnum {

    PENDING_REVIEW(0, "待审核"),
    REVIEW_PASSED(1, "审核通过"),
    REVIEW_REJECTED(2, "审核驳回"),
    ACTIVE(3, "营业中"),
    SUSPENDED(4, "已暂停"),
    BLACKLISTED(5, "已拉黑");

    private final Integer code;
    private final String desc;

    ProviderStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static ProviderStatusEnum getByCode(Integer code) {
        for (ProviderStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
