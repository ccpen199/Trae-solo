package com.bizcard.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private UserInfo user;
    
    @Data
    public static class UserInfo {
        private Long id;
        private String username;
        private String email;
        private String phone;
        private String realName;
        private String role;
        private String status;
    }
}
