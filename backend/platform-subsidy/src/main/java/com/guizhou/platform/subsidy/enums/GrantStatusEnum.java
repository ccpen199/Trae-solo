package com.guizhou.platform.subsidy.enums;

import lombok.Getter;

@Getter
public enum GrantStatusEnum {

    PENDING_SUBMIT(0, "待提交"),
    PENDING_REVIEW(1, "待审核"),
    REVIEW_REJECTED(2, "审核驳回"),
    PENDING_APPROVAL(3, "待审批"),
    APPROVAL_REJECTED(4, "审批驳回"),
    PENDING_GRANT(5, "待发放"),
    GRANTING(6, "发放中"),
    GRANTED(7, "已发放"),
    GRANT_FAILED(8, "发放失败"),
    VERIFIED(9, "已核销"),
    REVOKED(10, "已撤销"),
    FROZEN(11, "已冻结");

    private final Integer code;
    private final String desc;

    GrantStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static GrantStatusEnum getByCode(Integer code) {
        for (GrantStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
