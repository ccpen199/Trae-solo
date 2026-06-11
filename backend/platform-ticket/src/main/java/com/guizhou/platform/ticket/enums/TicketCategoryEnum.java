package com.guizhou.platform.ticket.enums;

import lombok.Getter;

@Getter
public enum TicketCategoryEnum {

    CONSULTATION(0, "咨询"),
    COMPLAINT(1, "投诉"),
    SUGGESTION(2, "建议"),
    HELP(3, "求助"),
    REPORT(4, "举报");

    private final Integer code;
    private final String desc;

    TicketCategoryEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static TicketCategoryEnum getByCode(Integer code) {
        for (TicketCategoryEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
