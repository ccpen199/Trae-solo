package com.guizhou.platform.certificate.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum CertificateStatusEnum {

    PENDING(0, "待签发"),
    VALID(1, "有效"),
    EXPIRED(2, "已过期"),
    REVOKED(3, "已吊销"),
    ARCHIVED(4, "已归档");

    private final Integer code;
    private final String name;

    public static CertificateStatusEnum getByCode(Integer code) {
        for (CertificateStatusEnum value : values()) {
            if (value.getCode().equals(code)) {
                return value;
            }
        }
        return null;
    }
}
