package com.guizhou.platform.living.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProviderApplyDTO {

    @NotBlank(message = "服务商名称不能为空")
    private String providerName;

    @NotBlank(message = "分类编码不能为空")
    private String categoryCode;

    @NotBlank(message = "联系人不能为空")
    private String contactName;

    @NotBlank(message = "联系电话不能为空")
    private String contactPhone;

    @NotBlank(message = "营业执照不能为空")
    private String businessLicense;

    @NotBlank(message = "法人不能为空")
    private String legalPerson;

    @NotBlank(message = "法人身份证不能为空")
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

    private BigDecimal longitude;

    private BigDecimal latitude;
}
