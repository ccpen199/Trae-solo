package com.guizhou.platform.certificate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

@Data
public class CertificateVerifyDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "核验方式不能为空")
    private Integer verifyType;

    private String certificateNo;

    private String authCode;

    private String qrcodeContent;

    private String ocrImageBase64;

    private String faceImageBase64;

    private String verifierId;

    private String verifierName;

    private String verifierOrg;

    private String verifyPurpose;
}
