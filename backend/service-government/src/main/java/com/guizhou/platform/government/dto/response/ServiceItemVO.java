package com.guizhou.platform.government.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Data
public class ServiceItemVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String itemCode;

    private String itemName;

    private Long categoryId;

    private String categoryCode;

    private String categoryName;

    private String department;

    private String departmentCode;

    private Integer serviceStatus;

    private String serviceStatusDesc;

    private String serviceType;

    private String serviceObject;

    private String serviceScene;

    private String legalBasis;

    private String applyCondition;

    private String materialsDesc;

    private List<String> materialList;

    private String processDesc;

    private List<String> processSteps;

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

    private String tags;
}
