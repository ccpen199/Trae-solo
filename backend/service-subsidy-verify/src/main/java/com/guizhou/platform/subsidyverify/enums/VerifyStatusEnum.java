package com.guizhou.platform.subsidyverify.enums;

import lombok.Getter;

@Getter
public enum VerifyStatusEnum {

    PENDING(0, "待核销"),
    VERIFYING(1, "核销中"),
    SUCCESS(2, "核销成功"),
    FAILED(3, "核销失败"),
    CANCELLED(4, "已撤销"),
    REFUNDED(5, "已退款");

    private final Integer code;
    private final String desc;

    VerifyStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static VerifyStatusEnum getByCode(Integer code) {
        for (VerifyStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
