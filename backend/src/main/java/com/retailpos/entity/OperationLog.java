package com.retailpos.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("operation_log")
public class OperationLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String operationType;
    private String targetType;
    private Long targetId;
    private String detail;
    private String ipAddress;
    private LocalDateTime operationTime;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
