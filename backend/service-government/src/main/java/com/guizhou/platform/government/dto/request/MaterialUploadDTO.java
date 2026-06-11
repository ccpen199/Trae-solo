package com.guizhou.platform.government.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.io.Serializable;

@Data
public class MaterialUploadDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "材料名称不能为空")
    private String materialName;

    private String materialCode;

    private Integer materialType;

    @NotBlank(message = "材料来源不能为空")
    private String sourceType;

    private String certificateNo;

    private String certificateType;

    @NotBlank(message = "文件名不能为空")
    private String fileName;

    @NotBlank(message = "文件路径不能为空")
    private String filePath;

    private Long fileSize;

    private String fileMd5;

    private Integer isRequired;

    private String dataSource;
}
