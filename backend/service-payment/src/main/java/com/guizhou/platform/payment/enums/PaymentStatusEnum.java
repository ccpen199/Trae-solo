package com.guizhou.platform.payment.enums;

import lombok.Getter;

@Getter
public enum PaymentStatusEnum {

    PENDING_PAY(0, "待支付"),
    PAYING(1, "支付中"),
    PAY_SUCCESS(2, "支付成功"),
    PAY_FAILED(3, "支付失败"),
    REFUNDING(4, "退款中"),
    REFUND_SUCCESS(5, "退款成功"),
    REFUND_FAILED(6, "退款失败"),
    CLOSED(7, "已关闭"),
    EXPIRED(8, "已过期");

    private final Integer code;
    private final String desc;

    PaymentStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static PaymentStatusEnum getByCode(Integer code) {
        for (PaymentStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
