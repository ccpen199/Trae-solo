package com.bizcard.controller;

import com.bizcard.dto.ApiResponse;
import com.bizcard.dto.LoginRequest;
import com.bizcard.dto.LoginResponse;
import com.bizcard.entity.User;
import com.bizcard.security.JwtTokenProvider;
import com.bizcard.service.UserService;
import javax.validation.Valid;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    
    public AuthController(UserService userService, JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }
    
    @PostMapping("/register")
    public ApiResponse<User> register(@Valid @RequestBody User user) {
        try {
            User registeredUser = userService.register(user);
            registeredUser.setPassword(null);
            return ApiResponse.success("注册成功，请等待审核", registeredUser);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request.getUsername(), request.getPassword());
            
            String token = jwtTokenProvider.generateToken(
                user.getUsername(),
                user.getId(),
                user.getRole().name()
            );
            
            LoginResponse response = new LoginResponse();
            response.setToken(token);
            
            LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo();
            userInfo.setId(user.getId());
            userInfo.setUsername(user.getUsername());
            userInfo.setEmail(user.getEmail());
            userInfo.setPhone(user.getPhone());
            userInfo.setRealName(user.getRealName());
            userInfo.setRole(user.getRole().name());
            userInfo.setStatus(user.getStatus().name());
            response.setUser(userInfo);
            
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @GetMapping("/me")
    public ApiResponse<LoginResponse.UserInfo> getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByUsername(username);
        
        LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setUsername(user.getUsername());
        userInfo.setEmail(user.getEmail());
        userInfo.setPhone(user.getPhone());
        userInfo.setRealName(user.getRealName());
        userInfo.setRole(user.getRole().name());
        userInfo.setStatus(user.getStatus().name());
        
        return ApiResponse.success(userInfo);
    }
    
    @PostMapping("/change-password")
    public ApiResponse<String> changePassword(
            @RequestParam String oldPassword,
            @RequestParam String newPassword) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByUsername(username);
        
        try {
            userService.changePassword(user.getId(), oldPassword, newPassword);
            return ApiResponse.success("密码修改成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(
            @RequestParam String email,
            @RequestParam String newPassword) {
        try {
            userService.resetPasswordByEmail(email, newPassword);
            return ApiResponse.success("密码重置成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
