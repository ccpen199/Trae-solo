package com.guizhou.platform.government.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("service_item")
public class ServiceItem extends BaseEntity {

    private String itemCode;

    private String itemName;

    private Long categoryId;

    private String categoryCode;

    private String department;

    private String departmentCode;

    private Integer serviceStatus;

    private String serviceType;

    private String serviceObject;

    private String serviceScene;

    private String legalBasis;

    private String applyCondition;

    private String materialsDesc;

    private String processDesc;

    private Integer processDays;

    private String chargeStandard;

    private String resultSample;

    private String onlineUrl;

    private String windowAddress;

    private String consultPhone;

    private String supervisionPhone;

    private Integer isOnline;

    private Integer isReservation;

    private LocalDate effectiveDate;

    private LocalDate expiryDate;

    private Integer sortNum;

    private String tags;

    private String remark;
}
