package com.guizhou.platform.living.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("service_booking")
public class ServiceBooking extends BaseEntity {

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

    private LocalDateTime appointmentTime;

    private String appointmentAddress;

    private String serviceDuration;

    private String requirement;

    private Long assignBy;

    private String assignByName;

    private LocalDateTime assignTime;

    private LocalDateTime confirmTime;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private BigDecimal actualPrice;

    private String cancelReason;

    private LocalDateTime cancelTime;

    private String remark;
}
