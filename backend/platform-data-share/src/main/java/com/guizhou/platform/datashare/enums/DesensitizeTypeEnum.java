package com.guizhou.platform.datashare.enums;

import lombok.Getter;

@Getter
public enum DesensitizeTypeEnum {

    PHONE("phone", "手机号", "^1[3-9]\\d{9}$"),
    ID_CARD("id_card", "身份证号", "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$"),
    BANK_CARD("bank_card", "银行卡号", "^\\d{16,19}$"),
    EMAIL("email", "邮箱", "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"),
    NAME("name", "姓名", "^[\\u4e00-\\u9fa5]{2,4}$"),
    ADDRESS("address", "地址", null),
    CUSTOM("custom", "自定义", null);

    private final String code;
    private final String desc;
    private final String pattern;

    DesensitizeTypeEnum(String code, String desc, String pattern) {
        this.code = code;
        this.desc = desc;
        this.pattern = pattern;
    }
}
