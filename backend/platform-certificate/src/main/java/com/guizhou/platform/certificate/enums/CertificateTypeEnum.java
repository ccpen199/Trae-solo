package com.guizhou.platform.certificate.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum CertificateTypeEnum {

    ID_CARD(1, "居民身份证", "公安部"),
    DRIVING_LICENSE(2, "机动车驾驶证", "交通运输部"),
    VEHICLE_LICENSE(3, "机动车行驶证", "交通运输部"),
    BUSINESS_LICENSE(4, "营业执照", "市场监督管理局"),
    SOCIAL_SECURITY_CARD(5, "社会保障卡", "人力资源和社会保障厅"),
    HEALTH_CARD(6, "健康卡", "卫生健康委员会"),
    EDUCATION_DEGREE(7, "学历证书", "教育厅"),
    REAL_ESTATE_CERTIFICATE(8, "不动产权证", "自然资源厅"),
    MARRIAGE_CERTIFICATE(9, "结婚证", "民政厅"),
    BIRTH_CERTIFICATE(10, "出生医学证明", "卫生健康委员会"),
    TAX_REGISTRATION(11, "税务登记证", "税务局"),
    ORG_CODE_CERTIFICATE(12, "组织机构代码证", "市场监督管理局");

    private final Integer code;
    private final String name;
    private final String issuingAuthority;

    public static CertificateTypeEnum getByCode(Integer code) {
        for (CertificateTypeEnum value : values()) {
            if (value.getCode().equals(code)) {
                return value;
            }
        }
        return null;
    }
}
