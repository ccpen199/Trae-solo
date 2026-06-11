package com.guizhou.platform.datashare.util;

import cn.hutool.core.util.DesensitizedUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.SecureUtil;

public class DesensitizeUtil {

    public static String maskPhone(String phone) {
        if (StrUtil.isBlank(phone) || phone.length() < 11) {
            return phone;
        }
        return DesensitizedUtil.mobilePhone(phone);
    }

    public static String maskIdCard(String idCard) {
        if (StrUtil.isBlank(idCard) || idCard.length() < 15) {
            return idCard;
        }
        return DesensitizedUtil.idCardNum(idCard, 3, 4);
    }

    public static String maskBankCard(String bankCard) {
        if (StrUtil.isBlank(bankCard) || bankCard.length() < 16) {
            return bankCard;
        }
        return DesensitizedUtil.bankCard(bankCard);
    }

    public static String maskEmail(String email) {
        if (StrUtil.isBlank(email)) {
            return email;
        }
        return DesensitizedUtil.email(email);
    }

    public static String maskChineseName(String name) {
        if (StrUtil.isBlank(name)) {
            return name;
        }
        return DesensitizedUtil.chineseName(name);
    }

    public static String maskValue(String value, int keepLeft, int keepRight, String maskChar) {
        if (StrUtil.isBlank(value)) {
            return value;
        }
        int length = value.length();
        if (keepLeft + keepRight >= length) {
            return value;
        }
        String left = value.substring(0, keepLeft);
        String right = value.substring(length - keepRight);
        String mask = StrUtil.repeat(maskChar != null ? maskChar : "*", length - keepLeft - keepRight);
        return left + mask + right;
    }

    public static String hashValue(String value, String algorithm) {
        if (StrUtil.isBlank(value)) {
            return value;
        }
        return switch (algorithm != null ? algorithm.toLowerCase() : "sha256") {
            case "md5" -> SecureUtil.md5(value);
            case "sha1" -> SecureUtil.sha1(value);
            case "sha256" -> SecureUtil.sha256(value);
            default -> SecureUtil.sha256(value);
        };
    }

    public static String encryptValue(String value, String key) {
        if (StrUtil.isBlank(value)) {
            return value;
        }
        String encryptKey = StrUtil.isNotBlank(key) ? key : "guizhou-datashare-default-key";
        return SecureUtil.aes(encryptKey.getBytes()).encryptBase64(value);
    }

    public static String decryptValue(String value, String key) {
        if (StrUtil.isBlank(value)) {
            return value;
        }
        String encryptKey = StrUtil.isNotBlank(key) ? key : "guizhou-datashare-default-key";
        return SecureUtil.aes(encryptKey.getBytes()).decryptStr(value);
    }
}
