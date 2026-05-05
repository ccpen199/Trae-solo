package com.bbs.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bbs.dto.LoginDTO;
import com.bbs.dto.RegisterDTO;
import com.bbs.entity.User;
import com.bbs.mapper.UserMapper;
import com.bbs.security.JwtService;
import com.bbs.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserRoleService userRoleService;
    
    @Transactional
    public Map<String, Object> login(LoginDTO loginDTO) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginDTO.getUsername(),
                        loginDTO.getPassword()
                )
        );
        
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, loginDTO.getUsername())
                        .eq(User::getDeleted, false)
        );
        
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        
        if (user.getStatus() != 1) {
            throw new IllegalArgumentException("用户已被禁用");
        }
        
        user.setRoleCodes(userMapper.selectRoleCodesByUserId(user.getId()));
        user.setPermissions(userMapper.selectPermissionCodesByUserId(user.getId()));
        
        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwt = jwtService.generateToken(userDetails);
        
        Map<String, Object> result = new HashMap<>();
        result.put("token", jwt);
        result.put("user", buildUserInfo(user));
        
        return result;
    }
    
    @Transactional
    public Map<String, Object> register(RegisterDTO registerDTO) {
        if (!registerDTO.getPassword().equals(registerDTO.getConfirmPassword())) {
            throw new IllegalArgumentException("两次密码输入不一致");
        }
        
        User existingUser = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, registerDTO.getUsername())
                        .eq(User::getDeleted, false)
        );
        
        if (existingUser != null) {
            throw new IllegalArgumentException("用户名已存在");
        }
        
        User user = new User();
        user.setUsername(registerDTO.getUsername());
        user.setPassword(passwordEncoder.encode(registerDTO.getPassword()));
        user.setEmail(registerDTO.getEmail());
        user.setNickname(registerDTO.getNickname() != null ? registerDTO.getNickname() : registerDTO.getUsername());
        user.setStatus(1);
        user.setDeleted(false);
        
        userMapper.insert(user);
        
        userRoleService.assignRoleToUser(user.getId(), "USER");
        
        user.setRoleCodes(userMapper.selectRoleCodesByUserId(user.getId()));
        user.setPermissions(userMapper.selectPermissionCodesByUserId(user.getId()));
        
        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwt = jwtService.generateToken(userDetails);
        
        Map<String, Object> result = new HashMap<>();
        result.put("token", jwt);
        result.put("user", buildUserInfo(user));
        
        return result;
    }
    
    private Map<String, Object> buildUserInfo(User user) {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("nickname", user.getNickname());
        userInfo.put("email", user.getEmail());
        userInfo.put("avatar", user.getAvatar());
        userInfo.put("roles", user.getRoleCodes());
        userInfo.put("permissions", user.getPermissions());
        return userInfo;
    }
    
    public User getCurrentUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null || user.getDeleted()) {
            throw new IllegalArgumentException("用户不存在");
        }
        user.setPassword(null);
        user.setRoleCodes(userMapper.selectRoleCodesByUserId(userId));
        user.setPermissions(userMapper.selectPermissionCodesByUserId(userId));
        return user;
    }
}
