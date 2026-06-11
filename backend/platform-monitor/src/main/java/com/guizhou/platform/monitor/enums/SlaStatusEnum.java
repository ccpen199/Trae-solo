package com.guizhou.platform.monitor.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SlaStatusEnum {

    PENDING("PENDING", "待考核"),
    QUALIFIED("QUALIFIED", "达标"),
    UNQUALIFIED("UNQUALIFIED", "未达标"),
    EXEMPTED("EXEMPTED", "豁免");

    private final String code;
    private final String desc;
}
