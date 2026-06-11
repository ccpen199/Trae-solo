package com.guizhou.platform.government.enums;

import lombok.Getter;

@Getter
public enum ApplyStatusEnum {

    PENDING_SUBMIT(0, "待提交"),
    UNDER_REVIEW(1, "审核中"),
    SUPPLEMENT_REQUIRED(2, "补正"),
    ACCEPTED(3, "受理"),
    PROCESSING(4, "办理中"),
    COMPLETED(5, "办结"),
    REJECTED(6, "不予受理"),
    WITHDRAWN(7, "已撤回");

    private final Integer code;
    private final String desc;

    ApplyStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static ApplyStatusEnum getByCode(Integer code) {
        for (ApplyStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
