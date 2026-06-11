package com.guizhou.platform.government.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class ServiceCatalogVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long categoryId;

    private String categoryCode;

    private String categoryName;

    private Long parentId;

    private Integer level;

    private String icon;

    private Integer itemCount;

    private List<ServiceCatalogVO> children;

    private List<ServiceItemSimpleVO> serviceItems;

    @Data
    public static class ServiceItemSimpleVO implements Serializable {

        private static final long serialVersionUID = 1L;

        private Long id;

        private String itemCode;

        private String itemName;

        private String department;

        private Integer serviceStatus;

        private String serviceStatusDesc;

        private Integer isOnline;

        private Integer processDays;
    }
}
