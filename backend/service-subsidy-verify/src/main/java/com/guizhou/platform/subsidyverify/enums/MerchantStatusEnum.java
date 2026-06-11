package com.guizhou.platform.subsidyverify.enums;

import lombok.Getter;

@Getter
public enum MerchantStatusEnum {

    PENDING_REVIEW(0, "待审核"),
    APPROVED(1, "已通过"),
    REJECTED(2, "已驳回"),
    DISABLED(3, "已禁用"),
    BLACKLISTED(4, "已拉黑");

    private final Integer code;
    private final String desc;

    MerchantStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static MerchantStatusEnum getByCode(Integer code) {
        for (MerchantStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
