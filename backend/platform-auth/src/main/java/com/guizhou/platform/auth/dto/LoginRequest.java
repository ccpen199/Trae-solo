package com.guizhou.platform.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "登录请求")
public class LoginRequest {

    @Schema(description = "登录类型: password/sms/face/wechat/alipay/keycloak", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "登录类型不能为空")
    private String loginType;

    @Schema(description = "账号")
    private String username;

    @Schema(description = "密码")
    private String password;

    @Schema(description = "手机号")
    private String phone;

    @Schema(description = "短信验证码")
    private String smsCode;

    @Schema(description = "人脸图片Base64")
    private String faceImage;

    @Schema(description = "第三方授权码")
    private String code;

    @Schema(description = "客户端ID")
    private String clientId;

    @Schema(description = "设备信息")
    private String deviceInfo;
}
