package com.guizhou.platform.subsidyverify.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class MerchantDetailVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

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

    private String statusDesc;

    private String contactName;

    private String contactPhone;

    private String bankAccount;

    private String bankName;

    private String bankCode;

    private String qualification;

    private String qualificationNo;

    private LocalDateTime qualifiedTime;

    private Integer verifyCount;

    private LocalDateTime createTime;
}
