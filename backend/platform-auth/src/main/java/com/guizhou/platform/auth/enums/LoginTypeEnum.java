package com.guizhou.platform.auth.enums;

import lombok.Getter;

@Getter
public enum LoginTypeEnum {

    PASSWORD("password", "账号密码登录"),
    SMS("sms", "短信验证码登录"),
    FACE("face", "人脸识别登录"),
    WECHAT("wechat", "微信登录"),
    ALIPAY("alipay", "支付宝登录"),
    KEYCLOAK("keycloak", "Keycloak SSO登录");

    private final String code;
    private final String desc;

    LoginTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static LoginTypeEnum getByCode(String code) {
        for (LoginTypeEnum value : values()) {
            if (value.getCode().equals(code)) {
                return value;
            }
        }
        return null;
    }
}
