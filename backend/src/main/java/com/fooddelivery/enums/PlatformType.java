package com.fooddelivery.enums;

import lombok.Getter;

@Getter
public enum PlatformType {
    MEITUAN(1, "美团外卖", "https://waimai.meituan.com"),
    ELEME(2, "饿了么", "https://www.ele.me"),
    SELF(3, "自营平台", "自有配送平台");

    private final int code;
    private final String name;
    private final String baseUrl;

    PlatformType(int code, String name, String baseUrl) {
        this.code = code;
        this.name = name;
        this.baseUrl = baseUrl;
    }

    public static PlatformType fromCode(int code) {
        for (PlatformType type : values()) {
            if (type.getCode() == code) {
                return type;
            }
        }
        throw new IllegalArgumentException("未知平台类型: " + code);
    }
}
