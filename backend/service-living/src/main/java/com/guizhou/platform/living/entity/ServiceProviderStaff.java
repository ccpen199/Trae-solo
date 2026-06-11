package com.guizhou.platform.living.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("service_provider_staff")
public class ServiceProviderStaff extends BaseEntity {

    private Long providerId;

    private String staffName;

    private String staffPhone;

    private String idCard;

    private String categoryCode;

    private String categoryName;

    private String skillCert;

    private String healthCert;

    private Integer workYears;

    private String skillTags;

    private java.math.BigDecimal avgScore;

    private Integer totalOrders;

    private String avatar;

    private String bio;

    private Integer staffStatus;
}
