package com.bbs.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sub_categories")
public class SubCategory {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String subCategoryName;
    private String subCategoryCode;
    private Long categoryId;
    private String description;
    private Integer sort;
    private Integer status;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    
    @TableLogic
    private Boolean deleted;
    
    @TableField(exist = false)
    private String categoryName;
}
