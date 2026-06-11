package com.guizhou.platform.ticket.enums;

import lombok.Getter;

@Getter
public enum TicketSourceEnum {

    APP(0, "APP"),
    MINI_PROGRAM(1, "小程序"),
    WEBSITE(2, "网站"),
    HOTLINE_12345(3, "12345热线");

    private final Integer code;
    private final String desc;

    TicketSourceEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static TicketSourceEnum getByCode(Integer code) {
        for (TicketSourceEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
