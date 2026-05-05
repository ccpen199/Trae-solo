package com.bizcard.entity;

import javax.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "access_logs")
public class AccessLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccessType accessType;
    
    private Long targetId;
    
    private String targetType;
    
    private String targetName;
    
    private String ipAddress;
    
    private String userAgent;
    
    @Column(length = 2000)
    private String description;
    
    private LocalDateTime createdAt;
    
    public enum AccessType {
        VIEW, CREATE, UPDATE, DELETE, SEARCH, EXPORT, LOGIN, LOGOUT
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
