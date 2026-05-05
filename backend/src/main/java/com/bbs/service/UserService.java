package com.bbs.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.bbs.common.PageResult;
import com.bbs.entity.User;
import com.bbs.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserRoleService userRoleService;
    
    public PageResult<User> getUserPage(Long current, Long size, String keyword, Integer status) {
        Page<User> page = new Page<>(current, size);
        
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<User>()
                .eq(User::getDeleted, false)
                .orderByDesc(User::getCreatedAt);
        
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(User::getUsername, keyword)
                    .or()
                    .like(User::getNickname, keyword)
                    .or()
                    .like(User::getEmail, keyword)
            );
        }
        
        if (status != null) {
            wrapper.eq(User::getStatus, status);
        }
        
        Page<User> result = userMapper.selectPage(page, wrapper);
        
        for (User user : result.getRecords()) {
            user.setPassword(null);
            user.setRoleCodes(userMapper.selectRoleCodesByUserId(user.getId()));
        }
        
        return PageResult.of(result.getRecords(), result.getTotal(), result.getSize(), result.getCurrent());
    }
    
    public User getUserById(Long id) {
        User user = userMapper.selectById(id);
        if (user != null) {
            user.setPassword(null);
            user.setRoleCodes(userMapper.selectRoleCodesByUserId(id));
        }
        return user;
    }
    
    @Transactional
    public User createUser(User user, String roleCode) {
        User existing = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, user.getUsername())
                        .eq(User::getDeleted, false)
        );
        
        if (existing != null) {
            throw new IllegalArgumentException("用户名已存在");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus(1);
        user.setDeleted(false);
        
        userMapper.insert(user);
        
        if (StringUtils.hasText(roleCode)) {
            userRoleService.assignRoleToUser(user.getId(), roleCode);
        } else {
            userRoleService.assignRoleToUser(user.getId(), "USER");
        }
        
        user.setPassword(null);
        return user;
    }
    
    @Transactional
    public User updateUser(User user) {
        User existing = userMapper.selectById(user.getId());
        if (existing == null || existing.getDeleted()) {
            throw new IllegalArgumentException("用户不存在");
        }
        
        if (StringUtils.hasText(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        } else {
            user.setPassword(null);
        }
        
        userMapper.updateById(user);
        
        user.setPassword(null);
        return user;
    }
    
    @Transactional
    public void deleteUser(Long id) {
        User user = userMapper.selectById(id);
        if (user == null || user.getDeleted()) {
            throw new IllegalArgumentException("用户不存在");
        }
        
        user.setDeleted(true);
        userMapper.updateById(user);
    }
    
    @Transactional
    public void updateUserStatus(Long id, Integer status) {
        User user = userMapper.selectById(id);
        if (user == null || user.getDeleted()) {
            throw new IllegalArgumentException("用户不存在");
        }
        
        user.setStatus(status);
        userMapper.updateById(user);
    }
    
    @Transactional
    public void assignRoles(Long userId, List<String> roleCodes) {
        User user = userMapper.selectById(userId);
        if (user == null || user.getDeleted()) {
            throw new IllegalArgumentException("用户不存在");
        }
        
        userRoleService.clearUserRoles(userId);
        
        if (roleCodes != null && !roleCodes.isEmpty()) {
            for (String roleCode : roleCodes) {
                userRoleService.assignRoleToUser(userId, roleCode);
            }
        }
    }
}
