package com.bbs.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("permissions")
public class Permission {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String permissionName;
    private String permissionCode;
    private String resourceType;
    private Long parentId;
    private String path;
    private String component;
    private String icon;
    private Integer sort;
    private Integer status;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    
    @TableLogic
    private Boolean deleted;
    
    @TableField(exist = false)
    private List<Permission> children;
}
