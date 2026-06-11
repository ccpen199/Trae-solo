package com.guizhou.platform.living.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BookingCreateDTO {

    @NotNull(message = "服务商ID不能为空")
    private Long providerId;

    private Long staffId;

    @NotBlank(message = "分类编码不能为空")
    private String categoryCode;

    @NotBlank(message = "服务名称不能为空")
    private String serviceName;

    @NotNull(message = "服务价格不能为空")
    private BigDecimal servicePrice;

    @NotNull(message = "预约时间不能为空")
    private LocalDateTime appointmentTime;

    @NotBlank(message = "预约地址不能为空")
    private String appointmentAddress;

    private String serviceDuration;

    private String requirement;
}
