package com.guizhou.platform.living.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("service_provider")
public class ServiceProvider extends BaseEntity {

    private String providerCode;

    private String providerName;

    private String categoryCode;

    private String categoryName;

    private Integer providerStatus;

    private String contactName;

    private String contactPhone;

    private String businessLicense;

    private String legalPerson;

    private String legalIdCard;

    private String province;

    private String city;

    private String district;

    private String address;

    private BigDecimal minPrice;

    private BigDecimal maxPrice;

    private String serviceArea;

    private String description;

    private String qualifications;

    private String coverImage;

    private BigDecimal avgScore;

    private Integer totalOrders;

    private Integer totalEvaluates;

    private BigDecimal longitude;

    private BigDecimal latitude;

    private String remark;
}
