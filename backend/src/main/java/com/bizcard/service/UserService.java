package com.bizcard.service;

import com.bizcard.entity.User;
import com.bizcard.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @Transactional
    public User register(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        if (user.getEmail() != null && userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("邮箱已被注册");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus(User.UserStatus.PENDING);
        user.setRole(User.Role.USER);
        
        return userRepository.save(user);
    }
    
    @Transactional
    public User login(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("用户不存在");
        }
        
        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        
        if (user.getStatus() == User.UserStatus.PENDING) {
            throw new RuntimeException("用户待审核，请联系管理员");
        }
        if (user.getStatus() == User.UserStatus.REJECTED) {
            throw new RuntimeException("用户申请被拒绝");
        }
        if (user.getStatus() == User.UserStatus.DISABLED) {
            throw new RuntimeException("用户已被禁用");
        }
        
        user.setLastLoginAt(LocalDateTime.now());
        return userRepository.save(user);
    }
    
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
    
    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
    
    @Transactional
    public User changePassword(Long userId, String oldPassword, String newPassword) {
        User user = findById(userId);
        
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("原密码错误");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }
    
    @Transactional
    public User resetPasswordByEmail(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("邮箱不存在"));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }
    
    @Transactional
    public User updateProfile(Long userId, User updateUser) {
        User user = findById(userId);
        
        if (updateUser.getRealName() != null) {
            user.setRealName(updateUser.getRealName());
        }
        if (updateUser.getPhone() != null) {
            user.setPhone(updateUser.getPhone());
        }
        if (updateUser.getEmail() != null) {
            if (!updateUser.getEmail().equals(user.getEmail()) 
                    && userRepository.existsByEmail(updateUser.getEmail())) {
                throw new RuntimeException("邮箱已被使用");
            }
            user.setEmail(updateUser.getEmail());
        }
        
        return userRepository.save(user);
    }
}
