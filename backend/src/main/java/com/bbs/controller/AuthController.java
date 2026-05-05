package com.bbs.controller;

import com.bbs.common.Result;
import com.bbs.dto.LoginDTO;
import com.bbs.dto.RegisterDTO;
import com.bbs.security.UserDetailsImpl;
import com.bbs.service.AuthService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginDTO loginDTO) {
        Map<String, Object> result = authService.login(loginDTO);
        return Result.success("登录成功", result);
    }
    
    @PostMapping("/register")
    public Result<Map<String, Object>> register(@Valid @RequestBody RegisterDTO registerDTO) {
        Map<String, Object> result = authService.register(registerDTO);
        return Result.success("注册成功", result);
    }
    
    @GetMapping("/me")
    public Result<com.bbs.entity.User> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return Result.unauthorized("未登录");
        }
        com.bbs.entity.User user = authService.getCurrentUser(userDetails.getUserId());
        return Result.success(user);
    }
}
