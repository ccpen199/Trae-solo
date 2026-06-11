package com.guizhou.platform.monitor.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum AlertLevelEnum {

    INFO("INFO", "信息", 1),
    WARNING("WARNING", "警告", 2),
    CRITICAL("CRITICAL", "严重", 3),
    FATAL("FATAL", "致命", 4);

    private final String code;
    private final String desc;
    private final int level;
}
