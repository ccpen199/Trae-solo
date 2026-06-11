package com.guizhou.platform.government.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("apply_material")
public class ApplyMaterial extends BaseEntity {

    private Long applyId;

    private String applyNo;

    private Long itemId;

    private String materialName;

    private String materialCode;

    private Integer materialType;

    private String sourceType;

    private String certificateNo;

    private String certificateType;

    private String fileName;

    private String filePath;

    private Long fileSize;

    private String fileMd5;

    private Integer isRequired;

    private Integer isAutoFilled;

    private String dataSource;

    private String remark;
}
