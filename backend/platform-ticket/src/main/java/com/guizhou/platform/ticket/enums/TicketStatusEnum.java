package com.guizhou.platform.ticket.enums;

import lombok.Getter;

@Getter
public enum TicketStatusEnum {

    PENDING(0, "待受理"),
    ASSIGNED(1, "已分派"),
    PROCESSING(2, "处理中"),
    PENDING_CONFIRM(3, "待确认"),
    COMPLETED(4, "已完成"),
    CLOSED(5, "已关闭");

    private final Integer code;
    private final String desc;

    TicketStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static TicketStatusEnum getByCode(Integer code) {
        for (TicketStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
