package com.guizhou.platform.living.enums;

import lombok.Getter;

@Getter
public enum LivingCategoryEnum {

    HOUSEKEEPING("HOUSEKEEPING", "家政"),
    CLEANING("CLEANING", "保洁"),
    REPAIR("REPAIR", "维修"),
    DECORATION("DECORATION", "装修"),
    MOVING("MOVING", "搬家"),
    TRANSPORT("TRANSPORT", "出行"),
    EXPRESS("EXPRESS", "快递"),
    PIPELINE("PIPELINE", "管道疏通"),
    APPLIANCE("APPLIANCE", "家电维修");

    private final String code;
    private final String desc;

    LivingCategoryEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static LivingCategoryEnum getByCode(String code) {
        for (LivingCategoryEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
