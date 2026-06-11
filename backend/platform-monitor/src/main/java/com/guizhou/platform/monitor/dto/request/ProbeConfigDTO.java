package com.guizhou.platform.monitor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProbeConfigDTO {

    @NotNull(message = "服务ID不能为空")
    private Long serviceId;

    @NotBlank(message = "健康检查URL不能为空")
    private String healthUrl;

    @NotBlank(message = "拨测类型不能为空")
    private String probeType;

    private Integer timeout;

    private Integer retryCount;

    private Integer intervalSeconds;
}
