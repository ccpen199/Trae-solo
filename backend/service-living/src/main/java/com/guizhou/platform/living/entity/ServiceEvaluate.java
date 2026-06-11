package com.guizhou.platform.living.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("service_evaluate")
public class ServiceEvaluate extends BaseEntity {

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

    private Long replyBy;

    private String replyByName;

    private java.time.LocalDateTime replyTime;
}
