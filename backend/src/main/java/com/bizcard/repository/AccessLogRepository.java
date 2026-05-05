package com.bizcard.repository;

import com.bizcard.entity.AccessLog;
import com.bizcard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {
    
    Page<AccessLog> findByUser(User user, Pageable pageable);
    
    Page<AccessLog> findByTargetTypeAndTargetId(String targetType, Long targetId, Pageable pageable);
    
    Page<AccessLog> findByTargetType(String targetType, Pageable pageable);
}
