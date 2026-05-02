package com.retailpos.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("promotion_rule")
public class PromotionRule {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String ruleCode;
    private String ruleName;
    private String ruleType;
    private String conditionConfig;
    private String actionConfig;
    private Integer priority;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private String status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
