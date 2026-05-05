package com.bbs.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import lombok.Data;

@Data
public class ArticleDTO {
    private Long id;
    
    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题长度不能超过200个字符")
    private String title;
    
    @NotBlank(message = "内容不能为空")
    private String content;
    
    @Size(max = 500, message = "摘要长度不能超过500个字符")
    private String summary;
    
    @Size(max = 200, message = "关键词长度不能超过200个字符")
    private String keywords;
    
    @NotNull(message = "请选择分类")
    private Long categoryId;
    
    private Long subCategoryId;
    
    private Boolean isTop;
    private Boolean isLocked;
}
