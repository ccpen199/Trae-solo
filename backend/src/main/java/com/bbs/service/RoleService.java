package com.bbs.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.bbs.common.PageResult;
import com.bbs.entity.Permission;
import com.bbs.entity.Role;
import com.bbs.mapper.PermissionMapper;
import com.bbs.mapper.RoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {
    
    private final RoleMapper roleMapper;
    private final PermissionMapper permissionMapper;
    private final JdbcTemplate jdbcTemplate;
    
    public PageResult<Role> getRolePage(Long current, Long size, String keyword) {
        Page<Role> page = new Page<>(current, size);
        
        LambdaQueryWrapper<Role> wrapper = new LambdaQueryWrapper<Role>()
                .eq(Role::getDeleted, false)
                .orderByAsc(Role::getId);
        
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(Role::getRoleName, keyword)
                    .or()
                    .like(Role::getRoleCode, keyword)
            );
        }
        
        Page<Role> result = roleMapper.selectPage(page, wrapper);
        
        for (Role role : result.getRecords()) {
            role.setPermissions(roleMapper.selectPermissionsByRoleId(role.getId()));
        }
        
        return PageResult.of(result.getRecords(), result.getTotal(), result.getSize(), result.getCurrent());
    }
    
    public List<Role> getAllRoles() {
        List<Role> roles = roleMapper.selectList(
                new LambdaQueryWrapper<Role>()
                        .eq(Role::getStatus, 1)
                        .eq(Role::getDeleted, false)
                        .orderByAsc(Role::getId)
        );
        return roles;
    }
    
    public Role getRoleById(Long id) {
        Role role = roleMapper.selectById(id);
        if (role != null) {
            role.setPermissions(roleMapper.selectPermissionsByRoleId(id));
        }
        return role;
    }
    
    @Transactional
    public Role createRole(Role role) {
        Role existing = roleMapper.selectOne(
                new LambdaQueryWrapper<Role>()
                        .eq(Role::getRoleCode, role.getRoleCode())
                        .eq(Role::getDeleted, false)
        );
        
        if (existing != null) {
            throw new IllegalArgumentException("角色编码已存在");
        }
        
        role.setStatus(1);
        role.setDeleted(false);
        roleMapper.insert(role);
        return role;
    }
    
    @Transactional
    public Role updateRole(Role role) {
        Role existing = roleMapper.selectById(role.getId());
        if (existing == null || existing.getDeleted()) {
            throw new IllegalArgumentException("角色不存在");
        }
        
        roleMapper.updateById(role);
        return role;
    }
    
    @Transactional
    public void deleteRole(Long id) {
        Role role = roleMapper.selectById(id);
        if (role == null || role.getDeleted()) {
            throw new IllegalArgumentException("角色不存在");
        }
        
        Long userCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_roles WHERE role_id = ?",
                Long.class, id
        );
        
        if (userCount > 0) {
            throw new IllegalArgumentException("该角色下还有用户，无法删除");
        }
        
        role.setDeleted(true);
        roleMapper.updateById(role);
    }
    
    @Transactional
    public void assignPermissions(Long roleId, List<Long> permissionIds) {
        Role role = roleMapper.selectById(roleId);
        if (role == null || role.getDeleted()) {
            throw new IllegalArgumentException("角色不存在");
        }
        
        jdbcTemplate.update("DELETE FROM role_permissions WHERE role_id = ?", roleId);
        
        if (permissionIds != null && !permissionIds.isEmpty()) {
            for (Long permissionId : permissionIds) {
                jdbcTemplate.update(
                        "INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (role_id, permission_id) DO NOTHING",
                        roleId, permissionId
                );
            }
        }
    }
    
    public List<Permission> getAllPermissions() {
        return permissionMapper.selectList(
                new LambdaQueryWrapper<Permission>()
                        .eq(Permission::getStatus, 1)
                        .eq(Permission::getDeleted, false)
                        .orderByAsc(Permission::getParentId)
                        .orderByAsc(Permission::getSort)
        );
    }
}
