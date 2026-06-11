package com.guizhou.platform.monitor.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ServiceStatusEnum {

    UP("UP", "正常运行"),
    DOWN("DOWN", "服务不可用"),
    DEGRADED("DEGRADED", "服务降级");

    private final String code;
    private final String desc;
}
