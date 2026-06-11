package com.guizhou.platform.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "登录响应")
public class LoginResponse {

    @Schema(description = "访问令牌")
    private String accessToken;

    @Schema(description = "刷新令牌")
    private String refreshToken;

    @Schema(description = "令牌类型")
    private String tokenType;

    @Schema(description = "过期时间(秒)")
    private Long expiresIn;

    @Schema(description = "作用域")
    private String scope;

    @Schema(description = "登录时间")
    private LocalDateTime loginTime;

    @Schema(description = "用户ID")
    private Long userId;

    @Schema(description = "用户名")
    private String username;
}
