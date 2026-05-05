package com.bbs.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bbs.entity.Role;
import com.bbs.entity.UserRole;
import com.bbs.mapper.RoleMapper;
import com.bbs.mapper.UserRoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserRoleService {
    
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;
    private final JdbcTemplate jdbcTemplate;
    
    @Transactional
    public void assignRoleToUser(Long userId, String roleCode) {
        Role role = roleMapper.selectOne(
                new LambdaQueryWrapper<Role>()
                        .eq(Role::getRoleCode, roleCode)
                        .eq(Role::getDeleted, false)
        );
        
        if (role == null) {
            throw new IllegalArgumentException("角色不存在: " + roleCode);
        }
        
        UserRole existing = userRoleMapper.selectOne(
                new LambdaQueryWrapper<UserRole>()
                        .eq(UserRole::getUserId, userId)
                        .eq(UserRole::getRoleId, role.getId())
        );
        
        if (existing == null) {
            UserRole userRole = new UserRole();
            userRole.setUserId(userId);
            userRole.setRoleId(role.getId());
            userRole.setCreatedAt(LocalDateTime.now());
            userRoleMapper.insert(userRole);
        }
    }
    
    @Transactional
    public void removeRoleFromUser(Long userId, String roleCode) {
        Role role = roleMapper.selectOne(
                new LambdaQueryWrapper<Role>()
                        .eq(Role::getRoleCode, roleCode)
        );
        
        if (role != null) {
            jdbcTemplate.update(
                    "DELETE FROM user_roles WHERE user_id = ? AND role_id = ?",
                    userId, role.getId()
            );
        }
    }
    
    @Transactional
    public void clearUserRoles(Long userId) {
        jdbcTemplate.update("DELETE FROM user_roles WHERE user_id = ?", userId);
    }
}
