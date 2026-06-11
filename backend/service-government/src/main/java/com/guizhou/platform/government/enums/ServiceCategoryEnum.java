package com.guizhou.platform.government.enums;

import lombok.Getter;

@Getter
public enum ServiceCategoryEnum {

    SOCIAL_SECURITY("SOCIAL_SECURITY", "社会保障"),
    MEDICAL_INSURANCE("MEDICAL_INSURANCE", "医疗保险"),
    REAL_ESTATE("REAL_ESTATE", "不动产"),
    HOUSEHOLD("HOUSEHOLD", "户籍"),
    HOUSING_FUND("HOUSING_FUND", "公积金"),
    TAXATION("TAXATION", "税务"),
    EDUCATION("EDUCATION", "教育"),
    CIVIL_AFFAIRS("CIVIL_AFFAIRS", "民政"),
    EMPLOYMENT("EMPLOYMENT", "就业创业"),
    TRANSPORT("TRANSPORT", "交通出行"),
    HEALTH("HEALTH", "医疗卫生"),
    CONSTRUCTION("CONSTRUCTION", "住房建设"),
    ENVIRONMENT("ENVIRONMENT", "生态环境"),
    CULTURE("CULTURE", "文化旅游"),
    JUSTICE("JUSTICE", "司法公证"),
    BUSINESS("BUSINESS", "商事登记");

    private final String code;
    private final String desc;

    ServiceCategoryEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static ServiceCategoryEnum getByCode(String code) {
        for (ServiceCategoryEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
