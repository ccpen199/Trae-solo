package com.guizhou.platform.living.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class EvaluateCreateDTO {

    @NotNull(message = "预约ID不能为空")
    private Long bookingId;

    @NotNull(message = "综合评分不能为空")
    private BigDecimal score;

    @NotNull(message = "态度评分不能为空")
    private Integer attitudeScore;

    @NotNull(message = "质量评分不能为空")
    private Integer qualityScore;

    @NotNull(message = "时效评分不能为空")
    private Integer timelinessScore;

    private String content;

    private String images;

    private Boolean anonymous;
}
