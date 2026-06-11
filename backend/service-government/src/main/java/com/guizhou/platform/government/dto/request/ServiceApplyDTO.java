package com.guizhou.platform.government.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class ServiceApplyDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "服务事项ID不能为空")
    private Long itemId;

    @NotBlank(message = "申请人姓名不能为空")
    private String applicantName;

    @NotBlank(message = "申请人身份证号不能为空")
    private String applicantIdCard;

    @NotBlank(message = "申请人手机号不能为空")
    private String applicantPhone;

    private String applicantType;

    private String applicantAddress;

    private String legalPersonName;

    private String unifiedSocialCode;

    private String applyReason;

    private List<MaterialUploadDTO> materials;
}
