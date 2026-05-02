package com.coldchain.service;

import com.coldchain.entity.User;
import com.coldchain.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User register(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }
    
    public Optional<User> login(String username, String password) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent() && passwordEncoder.matches(password, user.get().getPassword())) {
            return user;
        }
        return Optional.empty();
    }
    
    public Optional<User> getUserById(Long userId) {
        return userRepository.findByUserId(userId);
    }
    
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    public User updatePassword(Long userId, String newPassword) {
        Optional<User> user = userRepository.findByUserId(userId);
        if (user.isPresent()) {
            user.get().setPassword(passwordEncoder.encode(newPassword));
            return userRepository.save(user.get());
        }
        throw new RuntimeException("User not found");
    }
}
