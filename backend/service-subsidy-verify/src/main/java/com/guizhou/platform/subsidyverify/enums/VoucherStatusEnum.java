package com.guizhou.platform.subsidyverify.enums;

import lombok.Getter;

@Getter
public enum VoucherStatusEnum {

    UNUSED(0, "未使用"),
    PARTIAL_USED(1, "部分使用"),
    USED(2, "已使用"),
    EXPIRED(3, "已过期"),
    CANCELLED(4, "已作废");

    private final Integer code;
    private final String desc;

    VoucherStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static VoucherStatusEnum getByCode(Integer code) {
        for (VoucherStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
