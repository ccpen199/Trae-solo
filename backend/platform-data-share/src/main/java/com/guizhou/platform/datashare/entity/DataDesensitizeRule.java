package com.guizhou.platform.datashare.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("data_desensitize_rule")
public class DataDesensitizeRule extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String ruleCode;

    private String ruleName;

    private String desensitizeType;

    private String desensitizeStrategy;

    private String fieldName;

    private String pattern;

    private String maskChar;

    private Integer keepLeft;

    private Integer keepRight;

    private String replaceValue;

    private String encryptKey;

    private String hashAlgorithm;

    private Long apiId;

    private String apiCode;

    private Integer sort;

    private Boolean enabled;

    private String remark;
}
