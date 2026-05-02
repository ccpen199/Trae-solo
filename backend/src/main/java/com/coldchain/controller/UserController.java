package com.coldchain.controller;

import com.coldchain.dto.ApiResponse;
import com.coldchain.entity.User;
import com.coldchain.security.JwtTokenUtil;
import com.coldchain.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtTokenUtil jwtTokenUtil;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@RequestBody User user) {
        try {
            User registeredUser = userService.register(user);
            return ResponseEntity.ok(ApiResponse.success(registeredUser, "注册成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("注册失败: " + e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, String> loginData) {
        String username = loginData.get("username");
        String password = loginData.get("password");
        
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );
            
            User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            String token = jwtTokenUtil.generateToken(userDetails, user.getUserId(), user.getRole());
            
            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("userId", user.getUserId());
            userMap.put("username", user.getUsername());
            userMap.put("role", user.getRole());
            userMap.put("contactInfo", user.getContactInfo());
            result.put("user", userMap);
            
            return ResponseEntity.ok(ApiResponse.success(result, "登录成功"));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("用户名或密码错误"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("登录失败: " + e.getMessage()));
        }
    }
    
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<User>> getUserInfo(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("未授权访问"));
        }
        
        return userService.getUserById(userId)
            .map(user -> {
                user.setPassword(null);
                return ResponseEntity.ok(ApiResponse.success(user));
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("用户不存在")));
    }
    
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<User>> updatePassword(
        HttpServletRequest request, 
        @RequestBody Map<String, String> passwordData
    ) {
        Long userId = (Long) request.getAttribute("userId");
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("未授权访问"));
        }
        
        String newPassword = passwordData.get("newPassword");
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("密码长度至少6位"));
        }
        
        try {
            User updatedUser = userService.updatePassword(userId, newPassword);
            updatedUser.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success(updatedUser, "密码修改成功"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
