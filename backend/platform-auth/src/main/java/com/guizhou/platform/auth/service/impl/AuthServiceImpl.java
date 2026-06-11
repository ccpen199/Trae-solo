package com.guizhou.platform.auth.service.impl;

import com.guizhou.platform.auth.config.JwtConfig;
import com.guizhou.platform.auth.dto.LoginRequest;
import com.guizhou.platform.auth.dto.LoginResponse;
import com.guizhou.platform.auth.dto.RefreshTokenRequest;
import com.guizhou.platform.auth.dto.TokenVO;
import com.guizhou.platform.auth.entity.AuthAuditLog;
import com.guizhou.platform.auth.entity.SysUser;
import com.guizhou.platform.auth.enums.LoginTypeEnum;
import com.guizhou.platform.auth.enums.StatusEnum;
import com.guizhou.platform.auth.mapper.AuthAuditLogMapper;
import com.guizhou.platform.auth.mapper.SysUserMapper;
import com.guizhou.platform.auth.service.AuthService;
import com.guizhou.platform.auth.service.FaceRecognitionService;
import com.guizhou.platform.auth.service.SmsService;
import com.guizhou.platform.auth.service.TokenService;
import com.guizhou.platform.auth.vo.UserInfoVO;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.common.result.ResultCode;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    @Resource
    private SysUserMapper userMapper;

    @Resource
    private AuthAuditLogMapper auditLogMapper;

    @Resource
    private TokenService tokenService;

    @Resource
    private SmsService smsService;

    @Resource
    private FaceRecognitionService faceRecognitionService;

    @Resource
    private PasswordEncoder passwordEncoder;

    @Resource
    private JwtConfig jwtConfig;

    @Value("${auth.login.max-fail-count:5}")
    private Integer maxFailCount;

    @Value("${auth.login.lock-minutes:30}")
    private Integer lockMinutes;

    @Override
    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        LoginTypeEnum loginType = LoginTypeEnum.getByCode(request.getLoginType());
        if (loginType == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "不支持的登录类型");
        }

        SysUser user = null;
        String failReason = null;

        try {
            switch (loginType) {
                case PASSWORD:
                    user = loginByPassword(request);
                    break;
                case SMS:
                    user = loginBySms(request);
                    break;
                case FACE:
                    user = loginByFace(request);
                    break;
                case WECHAT:
                    user = loginByWechat(request);
                    break;
                case ALIPAY:
                    user = loginByAlipay(request);
                    break;
                default:
                    throw new BusinessException(ResultCode.PARAM_ERROR, "不支持的登录类型");
            }
        } catch (BusinessException e) {
            failReason = e.getMessage();
            recordAuditLog(null, request.getUsername(), loginType.getCode(), request.getClientId(),
                    ipAddress, userAgent, request.getDeviceInfo(), false, failReason);
            throw e;
        }

        if (user.getLoginFailCount() != null && user.getLoginFailCount() >= maxFailCount) {
            if (user.getLockTime() != null && user.getLockTime().isAfter(LocalDateTime.now())) {
                failReason = "账号已锁定，请" + lockMinutes + "分钟后重试";
                recordAuditLog(user.getId(), user.getUsername(), loginType.getCode(), request.getClientId(),
                        ipAddress, userAgent, request.getDeviceInfo(), false, failReason);
                throw new BusinessException(ResultCode.AUTH_FAIL, failReason);
            }
            userMapper.resetLoginFailCount(user.getId());
            user.setLoginFailCount(0);
        }

        if (!StatusEnum.ENABLE.getCode().equals(user.getStatus())) {
            failReason = "用户已被禁用";
            recordAuditLog(user.getId(), user.getUsername(), loginType.getCode(), request.getClientId(),
                    ipAddress, userAgent, request.getDeviceInfo(), false, failReason);
            throw new BusinessException(ResultCode.USER_DISABLED);
        }

        userMapper.updateLoginInfo(user.getId(), LocalDateTime.now(), ipAddress);

        TokenVO tokenVO = tokenService.generateToken(user.getId(), user.getUsername(), buildUserInfo(user));

        recordAuditLog(user.getId(), user.getUsername(), loginType.getCode(), request.getClientId(),
                ipAddress, userAgent, request.getDeviceInfo(), true, null);

        return LoginResponse.builder()
                .accessToken(tokenVO.getAccessToken())
                .refreshToken(tokenVO.getRefreshToken())
                .tokenType(tokenVO.getTokenType())
                .expiresIn(tokenVO.getExpiresIn())
                .scope(tokenVO.getScope())
                .loginTime(tokenVO.getLoginTime())
                .userId(user.getId())
                .username(user.getUsername())
                .build();
    }

    @Override
    public TokenVO refreshToken(RefreshTokenRequest request) {
        return tokenService.refreshToken(request.getRefreshToken());
    }

    @Override
    public void logout(String accessToken) {
        if (accessToken != null && accessToken.startsWith(jwtConfig.getTokenPrefix())) {
            accessToken = accessToken.substring(jwtConfig.getTokenPrefix().length());
        }
        tokenService.addTokenToBlacklist(accessToken);
    }

    @Override
    public void sendSmsCode(String phone, String bizType) {
        smsService.sendCode(phone, bizType);
    }

    @Override
    public UserInfoVO getCurrentUserInfo() {
        return null;
    }

    private SysUser loginByPassword(LoginRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "用户名和密码不能为空");
        }
        SysUser user = userMapper.selectByUsername(request.getUsername());
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            userMapper.incrementLoginFailCount(user.getId());
            int remainCount = maxFailCount - (user.getLoginFailCount() == null ? 0 : user.getLoginFailCount()) - 1;
            if (remainCount <= 0) {
                userMapper.updateLockTime(user.getId(), LocalDateTime.now().plusMinutes(lockMinutes));
                throw new BusinessException(ResultCode.AUTH_FAIL, "密码错误次数过多，账号已锁定" + lockMinutes + "分钟");
            }
            throw new BusinessException(ResultCode.USER_PASSWORD_ERROR, "密码错误，还剩" + remainCount + "次机会");
        }
        return user;
    }

    private SysUser loginBySms(LoginRequest request) {
        if (request.getPhone() == null || request.getSmsCode() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "手机号和验证码不能为空");
        }
        if (!smsService.verifyCode(request.getPhone(), request.getSmsCode(), "login")) {
            throw new BusinessException(ResultCode.VERIFICATION_CODE_ERROR);
        }
        SysUser user = userMapper.selectByPhone(request.getPhone());
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        return user;
    }

    private SysUser loginByFace(LoginRequest request) {
        if (request.getFaceImage() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "人脸图片不能为空");
        }
        if (request.getUsername() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "用户名不能为空");
        }
        SysUser user = userMapper.selectByUsername(request.getUsername());
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        if (user.getFaceFeature() == null) {
            throw new BusinessException(ResultCode.AUTH_FAIL, "用户未录入人脸信息");
        }
        boolean matched = faceRecognitionService.verify(request.getFaceImage(), user.getFaceFeature());
        if (!matched) {
            throw new BusinessException(ResultCode.AUTH_FAIL, "人脸识别失败");
        }
        return user;
    }

    private SysUser loginByWechat(LoginRequest request) {
        if (request.getCode() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "微信授权码不能为空");
        }
        String openid = simulateWechatAuth(request.getCode());
        SysUser user = userMapper.selectByOpenid(openid);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST, "微信账号未绑定平台用户");
        }
        return user;
    }

    private SysUser loginByAlipay(LoginRequest request) {
        if (request.getCode() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "支付宝授权码不能为空");
        }
        String alipayId = simulateAlipayAuth(request.getCode());
        SysUser user = userMapper.selectByAlipayId(alipayId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST, "支付宝账号未绑定平台用户");
        }
        return user;
    }

    private String simulateWechatAuth(String code) {
        log.info("模拟微信OAuth认证, code: {}", code);
        return "wx_openid_" + code.hashCode();
    }

    private String simulateAlipayAuth(String code) {
        log.info("模拟支付宝OAuth认证, code: {}", code);
        return "alipay_uid_" + code.hashCode();
    }

    private UserInfoVO buildUserInfo(SysUser user) {
        return UserInfoVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .realName(user.getRealName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .gender(user.getGender())
                .birthday(user.getBirthday())
                .address(user.getAddress())
                .status(user.getStatus())
                .lastLoginTime(user.getLastLoginTime())
                .lastLoginIp(user.getLastLoginIp())
                .build();
    }

    private void recordAuditLog(Long userId, String username, String loginType, String clientId,
                                String ipAddress, String userAgent, String deviceInfo,
                                Boolean success, String failReason) {
        AuthAuditLog auditLog = new AuthAuditLog();
        auditLog.setUserId(userId);
        auditLog.setUsername(username);
        auditLog.setLoginType(loginType);
        auditLog.setClientId(clientId);
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLog.setDeviceInfo(deviceInfo);
        auditLog.setSuccess(success);
        auditLog.setFailReason(failReason);
        auditLog.setOperateTime(LocalDateTime.now());
        auditLogMapper.insert(auditLog);
    }
}
