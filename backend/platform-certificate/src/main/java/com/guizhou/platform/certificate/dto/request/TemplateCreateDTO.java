package com.guizhou.platform.certificate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.util.Map;

@Data
public class TemplateCreateDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "模板编码不能为空")
    private String templateCode;

    @NotBlank(message = "模板名称不能为空")
    private String templateName;

    @NotNull(message = "证照类型不能为空")
    private Integer certificateType;

    private String templateContent;

    private Map<String, Object> styleConfig;

    private Map<String, Object> fieldConfig;

    private Map<String, Object> signConfig;

    private Map<String, Object> sealConfig;

    private Integer version;

    private String remark;
}
