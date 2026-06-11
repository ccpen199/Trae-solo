package com.guizhou.platform.certificate.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum VerifyTypeEnum {

    QRCODE(1, "二维码核验"),
    OCR(2, "OCR识别核验"),
    AUTH_CODE(3, "授权码核验"),
    FACE_RECOGNITION(4, "人脸识别核验");

    private final Integer code;
    private final String name;

    public static VerifyTypeEnum getByCode(Integer code) {
        for (VerifyTypeEnum value : values()) {
            if (value.getCode().equals(code)) {
                return value;
            }
        }
        return null;
    }
}
