package com.guizhou.platform.certificate.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class VerifyResultVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Boolean success;

    private String message;

    private Integer verifyType;

    private String verifyTypeName;

    private LocalDateTime verifyTime;

    private String verifyLogId;

    private Map<String, Object> certificateInfo;

    private Map<String, Object> verifyDetail;

    private String blockchainVerifyResult;

    private String dataHashVerifyResult;

    public static VerifyResultVO success(String message) {
        VerifyResultVO result = new VerifyResultVO();
        result.setSuccess(true);
        result.setMessage(message);
        result.setVerifyTime(LocalDateTime.now());
        return result;
    }

    public static VerifyResultVO fail(String message) {
        VerifyResultVO result = new VerifyResultVO();
        result.setSuccess(false);
        result.setMessage(message);
        result.setVerifyTime(LocalDateTime.now());
        return result;
    }
}
