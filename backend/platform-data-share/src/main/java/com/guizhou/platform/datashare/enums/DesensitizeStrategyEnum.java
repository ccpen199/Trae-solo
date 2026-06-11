package com.guizhou.platform.datashare.enums;

import lombok.Getter;

@Getter
public enum DesensitizeStrategyEnum {

    MASK("mask", "掩码替换"),
    HASH("hash", "哈希加密"),
    REPLACE("replace", "固定值替换"),
    TRUNCATE("truncate", "截断"),
    ENCRYPT("encrypt", "对称加密");

    private final String code;
    private final String desc;

    DesensitizeStrategyEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
