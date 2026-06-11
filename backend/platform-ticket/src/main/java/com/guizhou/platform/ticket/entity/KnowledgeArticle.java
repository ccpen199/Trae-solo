package com.guizhou.platform.ticket.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("knowledge_article")
public class KnowledgeArticle extends BaseEntity {

    private String articleNo;

    private String title;

    private String content;

    private String summary;

    private String category;

    private String tags;

    private String keywords;

    private Long departmentId;

    private String departmentName;

    private Integer articleStatus;

    private Integer viewCount;

    private Integer helpfulCount;

    private String attachment;

    private String esId;
}
