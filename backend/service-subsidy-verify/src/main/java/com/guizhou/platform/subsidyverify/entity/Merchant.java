package com.guizhou.platform.subsidyverify.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("merchant")
public class Merchant extends BaseEntity {

    private String merchantCode;

    private String merchantName;

    private String categoryCode;

    private String categoryName;

    private String legalPerson;

    private String idCard;

    private String phone;

    private String businessLicense;

    private String businessLicenseNo;

    private String address;

    private String province;

    private String city;

    private String district;

    private Double longitude;

    private Double latitude;

    private Integer status;

    private String contactName;

    private String contactPhone;

    private String bankAccount;

    private String bankName;

    private String bankCode;

    private String qualification;

    private String qualificationNo;

    private LocalDateTime qualifiedTime;

    private Integer verifyCount;

    private String remark;
}
