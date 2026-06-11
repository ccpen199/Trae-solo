package com.guizhou.platform.payment.enums;

import lombok.Getter;

@Getter
public enum PaymentChannelEnum {

    WECHAT(1, "微信支付"),
    ALIPAY(2, "支付宝"),
    UNIONPAY(3, "银联支付"),
    CLOUD_QUICK_PASS(4, "云闪付");

    private final Integer code;
    private final String desc;

    PaymentChannelEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static PaymentChannelEnum getByCode(Integer code) {
        for (PaymentChannelEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
