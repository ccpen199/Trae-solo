package com.guizhou.platform.payment.enums;

import lombok.Getter;

@Getter
public enum BillTypeEnum {

    WATER(1, "水费"),
    ELECTRICITY(2, "电费"),
    GAS(3, "燃气费"),
    HEATING(4, "暖气费"),
    PROPERTY(5, "物业费");

    private final Integer code;
    private final String desc;

    BillTypeEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static BillTypeEnum getByCode(Integer code) {
        for (BillTypeEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
