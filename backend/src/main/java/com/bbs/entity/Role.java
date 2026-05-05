package com.bbs.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("roles")
public class Role {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String roleName;
    private String roleCode;
    private String description;
    private Integer status;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    
    @TableLogic
    private Boolean deleted;
    
    @TableField(exist = false)
    private List<Permission> permissions;
}
