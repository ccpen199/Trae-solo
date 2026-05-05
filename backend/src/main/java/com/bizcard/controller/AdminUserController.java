package com.bizcard.controller;

import com.bizcard.dto.ApiResponse;
import com.bizcard.entity.User;
import com.bizcard.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public AdminUserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @GetMapping
    public ApiResponse<List<User>> listUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null));
        return ApiResponse.success(users);
    }
    
    @GetMapping("/{id}")
    public ApiResponse<User> getUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setPassword(null);
        return ApiResponse.success(user);
    }
    
    @PutMapping("/{id}/approve")
    public ApiResponse<User> approveUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setStatus(User.UserStatus.ACTIVE);
        user = userRepository.save(user);
        user.setPassword(null);
        return ApiResponse.success("用户已审核通过", user);
    }
    
    @PutMapping("/{id}/reject")
    public ApiResponse<User> rejectUser(@PathVariable Long id, @RequestParam(required = false) String reason) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setStatus(User.UserStatus.REJECTED);
        user = userRepository.save(user);
        user.setPassword(null);
        return ApiResponse.success("用户申请已拒绝", user);
    }
    
    @PutMapping("/{id}/disable")
    public ApiResponse<User> disableUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setStatus(User.UserStatus.DISABLED);
        user = userRepository.save(user);
        user.setPassword(null);
        return ApiResponse.success("用户已禁用", user);
    }
    
    @PutMapping("/{id}/enable")
    public ApiResponse<User> enableUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setStatus(User.UserStatus.ACTIVE);
        user = userRepository.save(user);
        user.setPassword(null);
        return ApiResponse.success("用户已启用", user);
    }
    
    @PutMapping("/{id}/role")
    public ApiResponse<User> updateRole(@PathVariable Long id, @RequestParam String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setRole(User.Role.valueOf(role.toUpperCase()));
        user = userRepository.save(user);
        user.setPassword(null);
        return ApiResponse.success("角色已更新", user);
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ApiResponse.success("用户已删除", null);
    }
}
