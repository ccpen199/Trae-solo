package com.guizhou.platform.ticket.enums;

import lombok.Getter;

@Getter
public enum TicketPriorityEnum {

    LOW(0, "低"),
    MEDIUM(1, "中"),
    HIGH(2, "高"),
    URGENT(3, "紧急");

    private final Integer code;
    private final String desc;

    TicketPriorityEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static TicketPriorityEnum getByCode(Integer code) {
        for (TicketPriorityEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
