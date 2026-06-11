package com.guizhou.platform.certificate.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class CertificateDetailVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String certificateNo;

    private Integer certificateType;

    private String certificateTypeName;

    private String certificateName;

    private Long userId;

    private String userName;

    private String idCardNo;

    private LocalDateTime issueDate;

    private LocalDateTime expireDate;

    private String issuingAuthority;

    private String issuingDepartment;

    private Integer status;

    private String statusName;

    private String ipfsHash;

    private String ipfsUrl;

    private String blockchainTxHash;

    private String blockchainUrl;

    private String dataHash;

    private String templateId;

    private Map<String, Object> metadata;

    private Map<String, Object> extendInfo;

    private String remark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
