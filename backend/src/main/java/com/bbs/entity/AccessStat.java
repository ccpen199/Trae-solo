package com.bbs.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("access_stats")
public class AccessStat {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long articleId;
    private Long userId;
    private String ipAddress;
    private String userAgent;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime accessTime;
}
