package com.guizhou.platform.certificate.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class CertificateListVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String certificateNo;

    private Integer certificateType;

    private String certificateTypeName;

    private String certificateName;

    private LocalDateTime issueDate;

    private LocalDateTime expireDate;

    private String issuingAuthority;

    private Integer status;

    private String statusName;

    private LocalDateTime createTime;
}
