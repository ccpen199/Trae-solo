package com.guizhou.platform.living.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BookingDetailVO {

    private Long id;

    private String bookingNo;

    private Long providerId;

    private String providerName;

    private Long staffId;

    private String staffName;

    private Long userId;

    private String userName;

    private String userPhone;

    private String categoryCode;

    private String categoryName;

    private String serviceName;

    private BigDecimal servicePrice;

    private Integer bookingStatus;

    private String bookingStatusDesc;

    private LocalDateTime appointmentTime;

    private String appointmentAddress;

    private String serviceDuration;

    private String requirement;

    private String assignByName;

    private LocalDateTime assignTime;

    private LocalDateTime confirmTime;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private BigDecimal actualPrice;

    private String cancelReason;

    private LocalDateTime cancelTime;

    private String remark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private EvaluateInfo evaluate;

    @Data
    public static class EvaluateInfo {

        private BigDecimal score;

        private String content;

        private String images;

        private LocalDateTime createTime;
    }
}
