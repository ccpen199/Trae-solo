package com.guizhou.platform.auth.security;

import com.guizhou.platform.auth.entity.SysPermission;
import com.guizhou.platform.auth.entity.SysRole;
import com.guizhou.platform.auth.entity.SysUser;
import com.guizhou.platform.auth.mapper.SysPermissionMapper;
import com.guizhou.platform.auth.mapper.SysRoleMapper;
import com.guizhou.platform.auth.mapper.SysUserMapper;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Resource
    private SysUserMapper userMapper;

    @Resource
    private SysRoleMapper roleMapper;

    @Resource
    private SysPermissionMapper permissionMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        SysUser user = userMapper.selectByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        List<SysRole> roles = roleMapper.selectByUserId(user.getId());
        for (SysRole role : roles) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getRoleCode()));
        }

        Set<String> perms = permissionMapper.selectPermsByUserId(user.getId());
        for (String perm : perms) {
            authorities.add(new SimpleGrantedAuthority(perm));
        }

        return User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(authorities)
                .accountLocked(user.getLockTime() != null && user.getLockTime().isAfter(java.time.LocalDateTime.now()))
                .disabled(user.getStatus() != null && user.getStatus() == 0)
                .build();
    }
}
