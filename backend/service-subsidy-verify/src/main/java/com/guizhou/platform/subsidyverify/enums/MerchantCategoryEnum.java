package com.guizhou.platform.subsidyverify.enums;

import lombok.Getter;

@Getter
public enum MerchantCategoryEnum {

    CATERING("CATERING", "餐饮"),
    RETAIL("RETAIL", "零售"),
    HOME_APPLIANCE("HOME_APPLIANCE", "家电"),
    TOURISM("TOURISM", "文旅"),
    GAS_STATION("GAS_STATION", "加油");

    private final String code;
    private final String desc;

    MerchantCategoryEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static MerchantCategoryEnum getByCode(String code) {
        for (MerchantCategoryEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
