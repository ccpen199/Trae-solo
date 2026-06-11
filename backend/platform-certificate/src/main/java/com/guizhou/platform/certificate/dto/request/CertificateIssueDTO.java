package com.guizhou.platform.certificate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class CertificateIssueDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "证照类型不能为空")
    private Integer certificateType;

    @NotBlank(message = "证照编号不能为空")
    private String certificateNo;

    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @NotBlank(message = "用户姓名不能为空")
    private String userName;

    @NotBlank(message = "身份证号不能为空")
    private String idCardNo;

    @NotNull(message = "签发日期不能为空")
    private LocalDateTime issueDate;

    @NotNull(message = "过期日期不能为空")
    private LocalDateTime expireDate;

    @NotBlank(message = "签发机关不能为空")
    private String issuingAuthority;

    private String issuingDepartment;

    private String templateId;

    private Map<String, Object> metadata;

    private Map<String, Object> extendInfo;

    private String remark;
}
