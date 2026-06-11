package com.guizhou.platform.subsidy.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RiskWarningVO {

    private Long id;

    private String warningNo;

    private Long grantId;

    private String grantNo;

    private Long policyId;

    private String policyCode;

    private String beneficiaryId;

    private String beneficiaryName;

    private Integer riskLevel;

    private String riskLevelDesc;

    private String riskLevelColor;

    private String riskType;

    private String riskRuleCode;

    private String riskRuleName;

    private Integer riskScore;

    private String riskDesc;

    private String riskEvidence;

    private Integer warningStatus;

    private String warningStatusDesc;

    private String handlerId;

    private String handlerName;

    private LocalDateTime handleTime;

    private String handleOpinion;

    private String handleResult;

    private Boolean autoFreeze;

    private LocalDateTime freezeTime;

    private String freezeReason;

    private LocalDateTime createTime;
}
