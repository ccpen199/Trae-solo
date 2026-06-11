package com.guizhou.platform.certificate.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("certificate")
public class Certificate extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String certificateNo;

    private Integer certificateType;

    private String certificateName;

    private Long userId;

    private String userName;

    private String idCardNo;

    private LocalDateTime issueDate;

    private LocalDateTime expireDate;

    private String issuingAuthority;

    private String issuingDepartment;

    private Integer status;

    private String ipfsHash;

    private String blockchainTxHash;

    private String dataHash;

    private String templateId;

    private String metadata;

    private String extendInfo;

    private String remark;
}
