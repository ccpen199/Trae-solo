package com.bbs.controller;

import com.bbs.common.PageResult;
import com.bbs.common.Result;
import com.bbs.entity.User;
import com.bbs.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    
    private final UserService userService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<PageResult<User>> getUsers(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        PageResult<User> result = userService.getUserPage(current, size, keyword, status);
        return Result.success(result);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<User> getUser(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return Result.success(user);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<User> createUser(@RequestBody User user, @RequestParam(required = false) String roleCode) {
        User created = userService.createUser(user, roleCode);
        return Result.success("创建成功", created);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        User updated = userService.updateUser(user);
        return Result.success("更新成功", updated);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success();
    }
    
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        userService.updateUserStatus(id, status);
        return Result.success();
    }
    
    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<Void> assignRoles(@PathVariable Long id, @RequestBody List<String> roleCodes) {
        userService.assignRoles(id, roleCodes);
        return Result.success();
    }
}
