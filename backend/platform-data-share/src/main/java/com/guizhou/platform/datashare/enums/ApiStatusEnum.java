package com.guizhou.platform.datashare.enums;

import lombok.Getter;

@Getter
public enum ApiStatusEnum {

    DRAFT(0, "草稿"),
    PUBLISHED(1, "已发布"),
    OFFLINE(2, "已下线"),
    DEPRECATED(3, "已废弃");

    private final Integer code;
    private final String desc;

    ApiStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
