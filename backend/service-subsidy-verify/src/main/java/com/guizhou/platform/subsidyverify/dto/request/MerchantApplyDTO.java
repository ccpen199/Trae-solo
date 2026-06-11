package com.guizhou.platform.subsidyverify.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

@Data
public class MerchantApplyDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "商户名称不能为空")
    private String merchantName;

    @NotNull(message = "商户分类不能为空")
    private String categoryCode;

    @NotBlank(message = "法人姓名不能为空")
    private String legalPerson;

    @NotBlank(message = "身份证号不能为空")
    private String idCard;

    @NotBlank(message = "联系电话不能为空")
    private String phone;

    @NotBlank(message = "营业执照号不能为空")
    private String businessLicenseNo;

    private String businessLicense;

    @NotBlank(message = "经营地址不能为空")
    private String address;

    private String province;

    private String city;

    private String district;

    private Double longitude;

    private Double latitude;

    private String contactName;

    private String contactPhone;

    private String bankAccount;

    private String bankName;

    private String bankCode;

    private String qualification;

    private String qualificationNo;

    private String remark;
}
