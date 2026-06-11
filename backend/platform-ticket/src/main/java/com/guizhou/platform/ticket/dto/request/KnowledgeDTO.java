package com.guizhou.platform.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KnowledgeDTO {

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "内容不能为空")
    private String content;

    private String summary;

    private String category;

    private String tags;

    private String keywords;

    private Long departmentId;

    private String departmentName;

    private String attachment;
}
