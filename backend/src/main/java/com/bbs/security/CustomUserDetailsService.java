package com.bbs.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bbs.entity.User;
import com.bbs.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    
    private final UserMapper userMapper;
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, username)
                        .eq(User::getDeleted, false)
        );
        
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }
        
        List<String> roleCodes = userMapper.selectRoleCodesByUserId(user.getId());
        List<String> permissions = userMapper.selectPermissionCodesByUserId(user.getId());
        
        if (permissions == null) {
            permissions = new ArrayList<>();
        }
        
        for (String roleCode : roleCodes) {
            permissions.add("ROLE_" + roleCode);
        }
        
        user.setRoleCodes(roleCodes);
        user.setPermissions(permissions);
        
        return new UserDetailsImpl(user);
    }
}
