package com.guizhou.platform.living.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProviderDetailVO {

    private Long id;

    private String providerCode;

    private String providerName;

    private String categoryCode;

    private String categoryName;

    private Integer providerStatus;

    private String providerStatusDesc;

    private String contactName;

    private String contactPhone;

    private String businessLicense;

    private String legalPerson;

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

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private List<StaffInfo> staffList;

    @Data
    public static class StaffInfo {

        private Long id;

        private String staffName;

        private String staffPhone;

        private String categoryCode;

        private String skillTags;

        private BigDecimal avgScore;

        private Integer totalOrders;

        private String avatar;
    }
}
