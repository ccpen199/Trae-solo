package com.guizhou.platform.certificate.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("certificate_template")
public class CertificateTemplate extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String templateCode;

    private String templateName;

    private Integer certificateType;

    private String templateContent;

    private String styleConfig;

    private String fieldConfig;

    private String signConfig;

    private String sealConfig;

    private Integer version;

    private Integer status;

    private String remark;
}
