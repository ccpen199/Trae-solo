package com.guizhou.platform.subsidy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("risk_warning")
public class RiskWarning extends BaseEntity {

    private String warningNo;

    private Long grantId;

    private String grantNo;

    private Long policyId;

    private String policyCode;

    private String beneficiaryId;

    private String beneficiaryName;

    private Integer riskLevel;

    private String riskType;

    private String riskRuleCode;

    private String riskRuleName;

    private Integer riskScore;

    private String riskDesc;

    private String riskEvidence;

    private Integer warningStatus;

    private String handlerId;

    private String handlerName;

    private LocalDateTime handleTime;

    private String handleOpinion;

    private String handleResult;

    private Boolean autoFreeze;

    private LocalDateTime freezeTime;

    private String freezeReason;
}
