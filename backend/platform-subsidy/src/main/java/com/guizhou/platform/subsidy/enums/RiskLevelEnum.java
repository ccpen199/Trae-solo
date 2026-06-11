package com.guizhou.platform.subsidy.enums;

import lombok.Getter;

@Getter
public enum RiskLevelEnum {

    LOW(1, "低风险", "blue"),
    MEDIUM(2, "中风险", "yellow"),
    HIGH(3, "高风险", "orange"),
    CRITICAL(4, "严重风险", "red");

    private final Integer code;
    private final String desc;
    private final String color;

    RiskLevelEnum(Integer code, String desc, String color) {
        this.code = code;
        this.desc = desc;
        this.color = color;
    }

    public static RiskLevelEnum getByCode(Integer code) {
        for (RiskLevelEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }

    public static RiskLevelEnum getByScore(Integer score) {
        if (score < 40) {
            return LOW;
        } else if (score < 60) {
            return MEDIUM;
        } else if (score < 80) {
            return HIGH;
        } else {
            return CRITICAL;
        }
    }
}
