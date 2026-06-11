package com.guizhou.platform.living.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class EvaluateVO {

    private Long id;

    private Long bookingId;

    private String bookingNo;

    private Long providerId;

    private Long staffId;

    private String staffName;

    private Long userId;

    private String userName;

    private BigDecimal score;

    private Integer attitudeScore;

    private Integer qualityScore;

    private Integer timelinessScore;

    private String content;

    private String images;

    private Boolean anonymous;

    private String replyContent;

    private String replyByName;

    private LocalDateTime replyTime;

    private LocalDateTime createTime;
}
